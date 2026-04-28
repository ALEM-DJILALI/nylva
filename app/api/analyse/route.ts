import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase-server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PROMPT_VISAGE = `Tu es NYLVA, experte beauté bienveillante et précise. Analyse ce visage avec douceur et expertise.

Réponds UNIQUEMENT en JSON valide, sans markdown, dans ce format exact :
{
  "score": 78,
  "titre": "Un regard intense qui gagne en harmonie",
  "resume": "Ton maquillage est soigné et bien posé. Quelques petits ajustements suffiraient à sublimer davantage ton regard et ta carnation.",
  "humeur": "encourageant",
  "zones": [
    {
      "zone": "Teint",
      "emoji": "✨",
      "status": "ok",
      "note": "Ton fond de teint est bien unifié, la carnation est lumineuse",
      "conseil": "Un voile de poudre libre sur la zone T prolongerait la tenue toute la journée"
    },
    {
      "zone": "Yeux",
      "emoji": "👁",
      "status": "warn",
      "note": "Le trait d'eyeliner est légèrement plus épais à droite",
      "conseil": "Un coton-tige légèrement humidifié permet de corriger facilement l'asymétrie"
    },
    {
      "zone": "Lèvres",
      "emoji": "💋",
      "status": "ok",
      "note": "Le contour est net et la couleur bien posée",
      "conseil": "Un gloss transparent au centre de la lèvre supérieure donnerait encore plus de volume"
    },
    {
      "zone": "Sourcils",
      "emoji": "〰️",
      "status": "err",
      "note": "Une légère différence de densité entre les deux sourcils",
      "conseil": "Quelques petits traits de crayon côté gauche pour rééquilibrer la symétrie"
    },
    {
      "zone": "Blush",
      "emoji": "🌸",
      "status": "ok",
      "note": "Application naturelle et bien fondue sur les pommettes",
      "conseil": "Pour un effet bonne mine encore plus naturel, estompe légèrement vers la tempe"
    },
    {
      "zone": "Contouring",
      "emoji": "🔆",
      "status": "warn",
      "note": "Le contouring est discret mais pourrait être mieux fondu",
      "conseil": "Estompe la limite avec un pinceau propre pour un résultat plus naturel"
    }
  ],
  "point_fort": "Tes lèvres sont parfaitement maquillées — c'est clairement ton point fort aujourd'hui.",
  "corrections": 2
}

Zones à analyser obligatoirement : Teint, Yeux, Lèvres, Sourcils, Blush, Contouring.
Status : "ok" (bien exécuté), "warn" (amélioration mineure possible), "err" (correction recommandée).
Score : 0-100 basé sur la précision et l'harmonie globale.
Ton : bienveillant, expert, encourageant. Jamais brutal. Toujours constructif.
Le champ "conseil" doit être un geste beauté concret et actionnable (max 15 mots).
Le champ "point_fort" valorise le meilleur aspect du maquillage.
Si aucun maquillage : score 0, encourage à revenir avec du maquillage, conseils de base.`

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    let userId: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const supabase = createServiceClient()
      const { data } = await supabase.auth.getUser(token)
      userId = data.user?.id ?? null
    }

    if (userId) {
      const supabase = createServiceClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('analyses_count_month, is_premium, is_admin, analyses_reset_at')
        .eq('id', userId)
        .single()

      if (profile && !profile.is_admin) {
        const needsReset = !profile.analyses_reset_at || new Date(profile.analyses_reset_at) <= new Date()
        const count = needsReset ? 0 : profile.analyses_count_month
        const limit = profile.is_premium ? 9999 : 3

        if (count >= limit) {
          return NextResponse.json(
            { error: 'Limite mensuelle atteinte', premium: !profile.is_premium },
            { status: 429 }
          )
        }
      }
    }

    const body = await req.json()
    const { image, type } = body

    if (!image) {
      return NextResponse.json({ error: 'Image manquante' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
          { type: 'text', text: PROMPT_VISAGE },
        ],
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const result = JSON.parse(text.replace(/```json|```/g, '').trim())

    if (userId) {
      const supabase = createServiceClient()
      await supabase.from('analyses').insert({
        user_id: userId,
        type: type ?? 'visage',
        score: result.score,
        titre: result.titre,
        resume: result.resume,
        zones: result.zones,
        corrections: result.corrections,
        ok: result.score >= 75,
      })
      await supabase.rpc('increment_analysis_count', { user_uuid: userId })
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Analyse error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
