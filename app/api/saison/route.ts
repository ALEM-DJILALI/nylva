import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase-server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PROMPT_SAISON = `Tu es une experte en analyse chromatique et colorimétrie personnelle. Analyse ce visage.

Réponds UNIQUEMENT en JSON valide, sans markdown :
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
}

Saisons : Printemps (chaud-clair), Été (froid-doux), Automne (chaud-profond), Hiver (froid-vif).
Sois précise sur les codes hex des couleurs — elles seront affichées directement.`

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    let userId: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      const supabase = createServiceClient()
      const { data } = await supabase.auth.getUser(authHeader.slice(7))
      userId = data.user?.id ?? null
    }

    const { image } = await req.json()
    if (!image) return NextResponse.json({ error: 'Image manquante' }, { status: 400 })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
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
    const result = JSON.parse(text.replace(/```json|```/g, '').trim())

    // Sauvegarder la saison dans le profil
    if (userId) {
      const supabase = createServiceClient()
      await supabase.from('profiles').update({
        saison_chromatique: result.saison,
        sous_saison: result.sous_saison,
        undertone: result.undertone,
      }).eq('id', userId)
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Saison error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
