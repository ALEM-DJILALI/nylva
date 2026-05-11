import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Mapping price → tier (lecture depuis env, mêmes vars que checkout)
function priceToTier(priceId: string): 'essentiel' | 'signature' | null {
  if (priceId === process.env.STRIPE_PRICE_ESSENTIEL_MONTHLY) return 'essentiel'
  if (priceId === process.env.STRIPE_PRICE_ESSENTIEL_YEARLY) return 'essentiel'
  if (priceId === process.env.STRIPE_PRICE_SIGNATURE_MONTHLY) return 'signature'
  if (priceId === process.env.STRIPE_PRICE_SIGNATURE_YEARLY) return 'signature'
  return null
}

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  if (!process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: 'Missing STRIPE_WEBHOOK_SECRET' }, { status: 500 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid webhook signature'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const tier = (session.metadata?.tier as 'essentiel' | 'signature' | undefined) ?? null

        if (!userId || !tier) {
          console.warn('checkout.session.completed sans user_id/tier en metadata')
          break
        }

        // Récupérer la subscription pour avoir current_period_end
        const subId = session.subscription as string | null
        let premiumUntil: string
        let trialing = false
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          const periodEnd = (sub as any).current_period_end as number | undefined
          premiumUntil = periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString()
          trialing = sub.status === 'trialing'
        } else {
          premiumUntil = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString()
        }

        const update: any = {
          tier,
          is_premium: true,
          premium_until: premiumUntil,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subId,
        }
        // Si Signature en trial → marque le trial comme consommé
        if (tier === 'signature' && trialing) {
          update.trial_signature_used = true
        }

        await supabase.from('profiles').update(update).eq('id', userId)
        console.log(`✓ ${tier} activé pour`, userId, trialing ? '(trial)' : '')
        break
      }

      case 'invoice.paid': {
        // Renouvellement réussi → prolonge premium_until
        const invoice = event.data.object as Stripe.Invoice
        const subId = (invoice as any).subscription as string | null
        if (!subId) break
        const sub = await stripe.subscriptions.retrieve(subId)
        const userId = sub.metadata?.user_id
        if (!userId) break
        const tier = priceToTier(sub.items.data[0]?.price.id ?? '') ?? sub.metadata?.tier ?? null
        const periodEnd = (sub as any).current_period_end as number | undefined
        const premiumUntil = periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString()

        const update: any = { is_premium: true, premium_until: premiumUntil }
        if (tier) update.tier = tier
        await supabase.from('profiles').update(update).eq('id', userId)
        console.log('✓ Renouvelé pour', userId, tier, '→', premiumUntil)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.user_id
        if (!userId) break

        const actif = sub.status === 'active' || sub.status === 'trialing'
        const periodEnd = (sub as any).current_period_end as number | undefined
        const premiumUntil = periodEnd ? new Date(periodEnd * 1000).toISOString() : null
        const tier = priceToTier(sub.items.data[0]?.price.id ?? '') ?? sub.metadata?.tier ?? null

        const update: any = {
          is_premium: actif,
          premium_until: actif ? premiumUntil : null,
        }
        if (actif && tier) update.tier = tier
        if (!actif) update.tier = 'free'

        await supabase.from('profiles').update(update).eq('id', userId)
        console.log(`subscription.updated (${sub.status}) pour`, userId, '→', tier)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.user_id
        if (!userId) break
        await supabase.from('profiles').update({
          is_premium: false,
          premium_until: null,
          tier: 'free',
        }).eq('id', userId)
        console.log('✓ Abonnement révoqué pour', userId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.warn('payment_failed pour', invoice.customer)
        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook handler error'
    console.error('Webhook error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
