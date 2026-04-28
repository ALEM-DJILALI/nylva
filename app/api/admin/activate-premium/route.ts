import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const premiumUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  // Chercher profil existant
  const { data: target } = await service
    .from('profiles').select('id').eq('email', email).single()

  if (target) {
    // Profil existe → activer directement
    await service.from('profiles')
      .update({ is_premium: true, premium_until: premiumUntil })
      .eq('id', target.id)
  }

  // Dans tous les cas → marquer waitlist (pour les non-inscrits aussi)
  await service.from('waitlist')
    .update({ premium_granted: true })
    .eq('email', email)

  return NextResponse.json({ ok: true })
}
