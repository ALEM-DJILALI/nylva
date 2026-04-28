import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: profiles }, { data: analyses }, { data: waitlist }] = await Promise.all([
    service.from('profiles').select('*').order('created_at', { ascending: false }),
    service.from('analyses').select('id, type, score, titre, resume, created_at, user_id').order('created_at', { ascending: false }),
    service.from('waitlist').select('*').order('created_at', { ascending: false }),
  ])

  return NextResponse.json({ profiles: profiles ?? [], analyses: analyses ?? [], waitlist: waitlist ?? [] })
}
