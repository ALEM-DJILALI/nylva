import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase-server'
import { getAccessProfile, coachQuotaParJour } from '@/lib/access'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = (p: any) => `Tu es NYLVA, coach beauté vocale — bienveillante, experte, chaleureuse.
Réponds TOUJOURS en français, en "tu", en 2-4 phrases MAX (lues à voix haute).
Zéro markdown, zéro liste. Parle naturellement comme une amie experte.
Ton : doux, précis, encourageant. Jamais condescendant.
${p ? `\nProfil : prénom ${p.prenom||'?'}, teint ${p.teint||'?'}, peau ${p.peau||'?'}, sous-tons ${p.souston||'?'}, saison chromatique ${p.saison_chromatique||'non déterminée'}, fond de teint ${p.fond_teint||'?'}.` : ''}
Domaine : maquillage, soins, routines, couleurs, techniques. Hors beauté → redirige gentiment.`

export async function POST(req: NextRequest) {
  try {
    const access = await getAccessProfile(req.headers.get('Authorization'))

    if (!access) {
      return NextResponse.json({ error: 'Connexion requise' }, { status: 401 })
    }

    // Le coach est accessible aux abonnées Essentiel et Signature
    if (access.tier === 'free') {
      return NextResponse.json(
        { error: 'Le coach IA est réservé aux abonnées NYLVA', upgrade: 'essentiel' },
        { status: 403 }
      )
    }

    // Détection mode vocal — Signature only
    let vocal = false
    try {
      const url = new URL(req.url)
      vocal = url.searchParams.get('vocal') === '1'
    } catch {}

    if (vocal && access.tier !== 'signature') {
      return NextResponse.json(
        { error: 'Le coach vocal est réservé aux abonnées NYLVA Signature', upgrade: 'signature' },
        { status: 403 }
      )
    }

    // Quota messages : on compte les messages des 24 dernières heures (fenêtre glissante)
    // Plus juste que "aujourd'hui en UTC" qui pénalise les utilisateurs proches de minuit local
    const supabase = createServiceClient()
    const limit = coachQuotaParJour(access.tier)

    if (limit < 9999) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { count } = await supabase
        .from('coach_messages_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', access.userId)
        .gte('created_at', since)

      if ((count ?? 0) >= limit) {
        return NextResponse.json(
          { error: `Limite atteinte (${limit} messages / 24h)`, upgrade: 'signature' },
          { status: 429 }
        )
      }
    }

    const { messages } = await req.json()
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages manquants' }, { status: 400 })
    }

    // Récup profil pour le system prompt
    const { data: profileFull } = await supabase.from('profiles')
      .select('prenom,teint,peau,souston,fond_teint,saison_chromatique')
      .eq('id', access.userId).single()

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 280,
      system: SYSTEM(profileFull),
      messages: messages.slice(-12),
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Log usage (pour quota tomorrow + analytics)
    await supabase.from('coach_messages_log').insert({
      user_id: access.userId,
      tier: access.tier,
      vocal,
    })

    return NextResponse.json({ text })
  } catch (err) {
    console.error('Coach error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
