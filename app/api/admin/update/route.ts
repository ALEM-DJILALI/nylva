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

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { action, id, data } = await req.json()

  if (action === 'update_profile') {
    const { error } = await service.from('profiles').update(data).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (action === 'reset_analyses') {
    const { error } = await service.from('profiles')
      .update({ analyses_count_month: 0, analyses_reset_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (action === 'delete_user') {
    await service.from('analyses').delete().eq('user_id', id)
    const { error } = await service.from('profiles').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (action === 'delete_analyses') {
    const { error } = await service.from('analyses').delete().eq('user_id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (action === 'delete_analyse') {
    const { error } = await service.from('analyses').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
