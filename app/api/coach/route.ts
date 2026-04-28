import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase-server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = (p: any) => `Tu es NYLVA, coach beauté vocale — bienveillante, experte, chaleureuse. 
Réponds TOUJOURS en français, en "tu", en 2-4 phrases MAX (lues à voix haute).
Zéro markdown, zéro liste. Parle naturellement comme une amie experte.
Ton : doux, précis, encourageant. Jamais condescendant.
${p ? `\nProfil : prénom ${p.prenom||'?'}, teint ${p.teint||'?'}, peau ${p.peau||'?'}, sous-tons ${p.souston||'?'}, saison chromatique ${p.saison_chromatique||'non déterminée'}, fond de teint ${p.fond_teint||'?'}.` : ''}
Domaine : maquillage, soins, routines, couleurs, techniques. Hors beauté → redirige gentiment.`

export async function POST(req: NextRequest) {
  try {
    let profile = null
    const auth = req.headers.get('Authorization')
    if (auth?.startsWith('Bearer ')) {
      const supabase = createServiceClient()
      const { data } = await supabase.auth.getUser(auth.slice(7))
      if (data.user) {
        const { data: p } = await supabase.from('profiles')
          .select('prenom,teint,peau,souston,fond_teint,rouge_levres,saison_chromatique,is_premium')
          .eq('id', data.user.id).single()
        profile = p
      }
    }
    const { messages } = await req.json()
    if (!Array.isArray(messages)) return NextResponse.json({ error: 'Messages manquants' }, { status: 400 })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5', max_tokens: 280,
      system: SYSTEM(profile),
      messages: messages.slice(-12),
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ text })
  } catch (err) {
    console.error('Coach error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
