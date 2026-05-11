import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

// Mapping plan → priceId env var
const PLAN_TO_PRICE: Record<string, string | undefined> = {
  'essentiel-monthly':  process.env.STRIPE_PRICE_ESSENTIEL_MONTHLY,
  'essentiel-yearly':   process.env.STRIPE_PRICE_ESSENTIEL_YEARLY,
  'signature-monthly':  process.env.STRIPE_PRICE_SIGNATURE_MONTHLY,
  'signature-yearly':   process.env.STRIPE_PRICE_SIGNATURE_YEARLY,
}

const PLAN_TO_TIER: Record<string, string> = {
  'essentiel-monthly':  'essentiel',
  'essentiel-yearly':   'essentiel',
  'signature-monthly':  'signature',
  'signature-yearly':   'signature',
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // plan dans le body (ex: "signature-monthly"). Backward compat: si absent, fallback essentiel-monthly
  let plan = 'essentiel-monthly'
  try {
    const body = await req.json()
    if (body?.plan && PLAN_TO_PRICE[body.plan]) plan = body.plan
  } catch {}

  const priceId = PLAN_TO_PRICE[plan]
  if (!priceId) {
    return NextResponse.json({ error: `Plan ${plan} non configuré` }, { status: 400 })
  }

  const tier = PLAN_TO_TIER[plan]

  // Trial 7 jours uniquement sur Signature (essentiel = pas de trial pour pousser à essayer le free)
  const isSignature = tier === 'signature'

  // Vérif si l'utilisatrice a déjà eu un trial pour ce tier (via metadata profile)
  const { data: profile } = await supabase
    .from('profiles')
    .select('trial_signature_used, stripe_customer_id')
    .eq('id', user.id)
    .single()

  const eligibleTrial = isSignature && !profile?.trial_signature_used

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app/profil?premium=success&plan=${plan}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app/pricing`,
    metadata: { user_id: user.id, plan, tier },
    subscription_data: {
      metadata: { user_id: user.id, plan, tier },
      ...(eligibleTrial ? { trial_period_days: 7 } : {}),
    },
    allow_promotion_codes: true,
    locale: 'fr',
  }

  // Réutilise le customer s'il existe déjà
  if (profile?.stripe_customer_id) {
    sessionParams.customer = profile.stripe_customer_id
  } else {
    sessionParams.customer_email = user.email
  }

  const session = await stripe.checkout.sessions.create(sessionParams)
  return NextResponse.json({ url: session.url })
}
