import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase-server'
import { getAccessProfile } from '@/lib/access'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PROMPT_SAISON = `Tu es une experte en analyse chromatique et colorimétrie personnelle. Analyse ce visage.

Réponds UNIQUEMENT en JSON valide, sans markdown, sans préambule :
{
  "saison": "Hiver" | "Printemps" | "Été" | "Automne",
  "sous_saison": "Hiver Brillant" | "Hiver Profond" | "Hiver Froid" | "Printemps Lumineux" | "Printemps Chaud" | "Printemps Clair" | "Été Doux" | "Été Froid" | "Été Clair" | "Automne Chaud" | "Automne Profond" | "Automne Doux",
  "teint": "description précise de la carnation observée",
  "yeux": "description de la couleur des yeux",
  "cheveux": "description de la couleur naturelle estimée",
  "undertone": "Chaud" | "Froid" | "Neutre",
  "resume": "2 phrases expliquant pourquoi cette saison, ton bienveillant",
  "couleurs_phares": ["#hex1","#hex2","#hex3","#hex4","#hex5","#hex6"],
  "couleurs_eviter": ["#hex1","#hex2","#hex3"],
  "matieres": ["soie","velours","dentelle"],
  "styles_maquillage": ["Nude chaleureux","Smoky brun","Lèvres terracotta"],
  "fondations_teinte": "conseil teinte fond de teint adapté",
  "celebrites": ["nom1","nom2","nom3"],
  "conseil_signature": "une phrase poétique et précise sur le style beauté de cette saison"
}`

function extractJSON(text: string): any {
  const cleaned = text.replace(/```json|```/g, '').trim()
  try { return JSON.parse(cleaned) } catch {}
  const start = cleaned.indexOf('{')
  if (start === -1) throw new Error('Pas de JSON trouvé')
  let depth = 0
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === '{') depth++
    else if (cleaned[i] === '}') {
      depth--
      if (depth === 0) return JSON.parse(cleaned.slice(start, i + 1))
    }
  }
  throw new Error('JSON malformé')
}

export async function POST(req: NextRequest) {
  try {
    const access = await getAccessProfile(req.headers.get('Authorization'))
    if (!access) {
      return NextResponse.json({ error: 'Connexion requise' }, { status: 401 })
    }

    if (access.tier === 'free') {
      return NextResponse.json(
        { error: 'L\'analyse chromatique est réservée aux abonnées NYLVA', upgrade: 'essentiel' },
        { status: 403 }
      )
    }

    // Essentiel : 1 analyse de saison à vie. Signature : illimité
    if (access.tier === 'essentiel') {
      const supabase = createServiceClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('saison_chromatique')
        .eq('id', access.userId)
        .single()

      if (profile?.saison_chromatique) {
        return NextResponse.json({
          error: 'Tu as déjà déterminé ta saison chromatique. Pour la re-analyser, passe à NYLVA Signature.',
          upgrade: 'signature',
          saison_existante: profile.saison_chromatique,
        }, { status: 403 })
      }
    }

    const { image } = await req.json()
    if (!image) return NextResponse.json({ error: 'Image manquante' }, { status: 400 })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
          { type: 'text', text: PROMPT_SAISON },
        ],
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const result = extractJSON(text)

    const supabase = createServiceClient()
    await supabase.from('profiles').update({
      saison_chromatique: result.saison,
      sous_saison: result.sous_saison,
      undertone: result.undertone,
    }).eq('id', access.userId)

    return NextResponse.json(result)
  } catch (err) {
    console.error('Saison error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
