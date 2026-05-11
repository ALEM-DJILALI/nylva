import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')
    let userId: string | null = null

    if (auth?.startsWith('Bearer ')) {
      const supabase = createServiceClient()
      const { data } = await supabase.auth.getUser(auth.slice(7))
      userId = data.user?.id ?? null
    }

    const body = await req.json()
    const { result, zones_incorrectes, comment } = body

    if (!Array.isArray(zones_incorrectes) || zones_incorrectes.length === 0) {
      return NextResponse.json({ error: 'Zones incorrectes manquantes' }, { status: 400 })
    }

    const supabase = createServiceClient()
    await supabase.from('feedback_analyses').insert({
      user_id: userId,
      score: result?.score ?? null,
      titre: result?.titre ?? null,
      zones_incorrectes,
      comment: comment ?? null,
      detection_brute: result?._debug?.detection ?? null,
      zones_confirmees: result?._debug?.zonesConfirmees ?? null,
      zones_resultat: result?.zones ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Feedback error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
