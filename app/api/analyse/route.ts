import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase-server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────
const SEUIL_CERTITUDE = 65            // En dessous → considéré comme nu
const VOTE_PARALLELE = true           // Active le double passage en parallèle
const SELF_CRITIQUE = true            // Active la self-critique après détection

// ─────────────────────────────────────────────────────────────
// PASSE 1 — Détection avec niveau de certitude par zone
// ─────────────────────────────────────────────────────────────
const promptDetection = (profilContext?: string) => `Tu es un expert en cosmétique avec 20 ans d'expérience. Mission : détecter le maquillage zone par zone, AVEC un niveau de certitude.

${profilContext ? `\nCONTEXTE UTILISATRICE (à prendre en compte pour calibrer ton jugement) :\n${profilContext}\n` : ''}
Pour chaque zone tu dois donner DEUX informations :
1. presence: true/false → y a-t-il du maquillage appliqué ?
2. certitude: 0 à 100 → à quel point tu en es sûr ?

ÉCHELLE DE CERTITUDE :
- 90-100 : tu vois clairement et sans ambiguïté les indices visuels du produit (texture, démarcation, couleur saturée, brillance artificielle).
- 70-89 : indices probables mais quelques traits pourraient être naturels.
- 50-69 : tu hésites sérieusement, ça pourrait être naturel ou produit.
- 30-49 : tu penches plutôt pour du naturel.
- 0-29 : aucun signe de maquillage.

═══════════════════════════════════════════════════════════════
TEINT (fond de teint / poudre / BB crème / correcteur)
═══════════════════════════════════════════════════════════════
✅ INDICES POSITIFS — certitude HAUTE (>70) seulement si tu observes :
- Couche uniforme MASQUANT visiblement les pores ou irrégularités
- Démarcation au niveau de la mâchoire ou des cheveux
- Texture poudrée/matifiée artificielle
- Couleur DIFFÉRENTE du cou (mismatch teint visage / cou)
- Couvrance visible de cernes, rougeurs ou taches avec un produit pigmenté

❌ ANTI-INDICES — certitude BASSE (<40) si seulement :
- Peau qui paraît belle, lumineuse, hydratée, ou bien éclairée
- Peau jeune, lisse, sans imperfection visible naturellement
- Highlighter ponctuel sur les pommettes (≠ fond de teint global)
- Reflet de lumière sur le front ou les joues (≠ poudre)
- Couleur uniforme du visage et du cou identique

═══════════════════════════════════════════════════════════════
YEUX (mascara / fard à paupières / eye-liner)
═══════════════════════════════════════════════════════════════
✅ INDICES POSITIFS — certitude HAUTE (>70) seulement si :
- Cils CLAIREMENT allongés, recourbés, séparés ou épaissis (mascara visible)
- Cils dont la pointe est nettement plus foncée et chargée
- Pigment coloré/métallisé sur la paupière mobile ou fixe (fard)
- Trait NET et continu le long de la ligne des cils (eye-liner / crayon)
- Smoky-eye avec dégradé de couleur travaillé

❌ ANTI-INDICES — certitude BASSE (<40) si seulement :
- Cils naturellement foncés ou denses sans rallongement visible
- Paupière légèrement rosée ou colorée naturellement (vascularisation)
- Petite ombre dans le creux de l'œil due à l'éclairage
- Cernes naturels (≠ eye-liner inférieur)
- Paupière supérieure naturellement plus foncée (morphologie)

═══════════════════════════════════════════════════════════════
LÈVRES (rouge à lèvres / gloss / teinte / crayon)
═══════════════════════════════════════════════════════════════
✅ INDICES POSITIFS — certitude HAUTE (>70) seulement si :
- Couleur saturée ou inhabituelle pour des lèvres nues (rouge vif, fuchsia, brun, nude clairement posé)
- Brillance grasse caractéristique d'un gloss
- Contour redessiné au crayon (ligne nette, parfois débordante)
- Effet mat poudré uniforme (rouge mat)
- Couleur uniforme couvrant toute la surface de la lèvre

❌ ANTI-INDICES — certitude BASSE (<40) si seulement :
- Lèvres naturellement rosées ou pulpeuses
- Lèvres hydratées avec brillance naturelle (≠ gloss)
- Couleur rouge/rose naturelle qui varie selon la zone de la lèvre
- Lèvres légèrement humides
- Reste de boisson ou aliment

═══════════════════════════════════════════════════════════════
SOURCILS (gel / crayon / pommade / poudre)
═══════════════════════════════════════════════════════════════
✅ INDICES POSITIFS — certitude HAUTE (>70) seulement si :
- Poils alignés/fixés artificiellement (gel sourcils visible)
- Tracé qui PROLONGE ou redessine la forme naturelle au-delà des poils
- Couleur intensifiée DIFFÉRENTE des racines des cheveux
- Trous comblés visiblement avec un produit pigmenté
- Forme géométrique nette et symétrique non naturelle

❌ ANTI-INDICES — certitude BASSE (<40) si seulement :
- Sourcils naturellement épais, denses ou foncés
- Sourcils naturellement bien dessinés génétiquement
- Quelques poils rebelles vers le haut (≠ gel)
- Légère dissymétrie naturelle entre les deux sourcils
- Couleur cohérente avec les cheveux

═══════════════════════════════════════════════════════════════
BLUSH (poudre / crème / liquide)
═══════════════════════════════════════════════════════════════
✅ INDICES POSITIFS — certitude HAUTE (>70) seulement si :
- Tache colorée LOCALISÉE et nette sur la pommette
- Couleur posée typique de blush (rose bonbon, pêche, terracotta, corail)
- Démarcation visible entre la zone du blush et le reste du visage
- Application en virgule ou en pomme bien dessinée
- Texture visible (poudre / crème)

❌ ANTI-INDICES — certitude BASSE (<40) si seulement :
- Rougeur diffuse naturelle des pommettes (circulation, émotion, sport, chaleur)
- Coup de soleil léger
- Rosacée légère
- Reflet rosé naturel diffus sans démarcation
- Pommettes hautes avec ombre/lumière naturelle

═══════════════════════════════════════════════════════════════
CONTOURING (bronzer / sculpting / poudre foncée)
═══════════════════════════════════════════════════════════════
✅ INDICES POSITIFS — certitude HAUTE (>70) seulement si :
- Ombre nette ARTIFICIELLE et localisée sous les pommettes
- Trait foncé sur les tempes ou le long de la mâchoire
- Sculpture du nez (deux traits parallèles foncés)
- Démarcation visible entre la zone foncée et la peau
- Couleur clairement plus foncée que la carnation

❌ ANTI-INDICES — certitude BASSE (<40) si seulement :
- Ombres naturelles dues à la morphologie du visage
- Ombres dues à l'éclairage de la pièce ou du soleil
- Creux des joues anatomiques (joues fines)
- Peau bronzée uniformément
- Reflet d'ombre sur la mâchoire dû à la posture

═══════════════════════════════════════════════════════════════
RÈGLE D'OR ABSOLUE
═══════════════════════════════════════════════════════════════
En cas de doute entre "naturel" et "produit", tu réponds presence: false ET certitude basse.
Il vaut MIEUX rater un maquillage léger que d'inventer un produit qui n'existe pas.
Une utilisatrice à qui on dit "tu n'as pas de fond de teint" alors qu'elle en a → c'est anodin.
Une utilisatrice à qui on dit "ton fond de teint est mal posé" alors qu'elle n'en a pas → c'est blessant et fait perdre toute crédibilité à l'application.

═══════════════════════════════════════════════════════════════
FORMAT DE RÉPONSE
═══════════════════════════════════════════════════════════════
Réponds UNIQUEMENT en JSON valide, sans préambule ni markdown :
{
  "teint":      { "presence": <bool>, "certitude": <0-100>, "indices": "<ce que tu observes vraiment, factuel>" },
  "yeux":       { "presence": <bool>, "certitude": <0-100>, "indices": "<...>" },
  "levres":     { "presence": <bool>, "certitude": <0-100>, "indices": "<...>" },
  "sourcils":   { "presence": <bool>, "certitude": <0-100>, "indices": "<...>" },
  "blush":      { "presence": <bool>, "certitude": <0-100>, "indices": "<...>" },
  "contouring": { "presence": <bool>, "certitude": <0-100>, "indices": "<...>" }
}`

// ─────────────────────────────────────────────────────────────
// PASSE 1 BIS — Self-critique : Claude relit sa propre réponse
// ─────────────────────────────────────────────────────────────
const promptSelfCritique = (detection: any) => `Tu viens d'analyser cette photo et tu as donné cette détection :

${JSON.stringify(detection, null, 2)}

Maintenant tu dois CRITIQUER ta propre analyse en mode avocat du diable. Pour CHAQUE zone que tu as marquée presence: true, tu te poses la question :

"Si je devais prouver à un sceptique que cette zone est VRAIMENT maquillée, quelle preuve VISUELLE CONCRÈTE pourrais-je pointer du doigt sur la photo ?"

Si tu n'as pas de preuve visuelle solide et concrète (juste une "impression"), tu dois RÉTROGRADER cette zone à presence: false avec une certitude basse.

Question miroir pour les zones marquées presence: false : "Est-ce que je suis 100% sûre qu'il n'y a rien ? Si oui, je laisse à false. Si je voyais quelque chose mais ai été trop prudente, je peux remonter."

Réponds UNIQUEMENT en JSON valide (même format que la détection initiale, sans préambule ni markdown) :
{
  "teint":      { "presence": <bool>, "certitude": <0-100>, "indices": "<preuve concrète ou explication révision>" },
  "yeux":       { "presence": <bool>, "certitude": <0-100>, "indices": "<...>" },
  "levres":     { "presence": <bool>, "certitude": <0-100>, "indices": "<...>" },
  "sourcils":   { "presence": <bool>, "certitude": <0-100>, "indices": "<...>" },
  "blush":      { "presence": <bool>, "certitude": <0-100>, "indices": "<...>" },
  "contouring": { "presence": <bool>, "certitude": <0-100>, "indices": "<...>" }
}`

// ─────────────────────────────────────────────────────────────
// PASSE 2 — Analyse détaillée (zones confirmées uniquement)
// ─────────────────────────────────────────────────────────────
const promptAnalyse = (zonesConfirmees: Record<string, boolean>, profilContext?: string) => `Tu es NYLVA, experte beauté bienveillante.
${profilContext ? `\nContexte utilisatrice : ${profilContext}\n` : ''}
Une première passe de détection a déterminé les zones réellement maquillées :
${JSON.stringify(zonesConfirmees, null, 2)}

Tu dois respecter STRICTEMENT cette détection :
- Pour les zones marquées TRUE : analyse le maquillage et donne status "ok"/"warn"/"err"
- Pour les zones marquées FALSE : status OBLIGATOIRE "nu", note neutre, conseil = soin/préparation (PAS de retouche maquillage)

Ne JAMAIS contredire la détection en disant qu'une zone "false" a du maquillage.

Tu dois aussi recommander une harmonie vestimentaire cohérente avec :
1. Le maquillage analysé (couleurs dominantes, intensité, atmosphère chaude/froide)
2. La saison chromatique de l'utilisatrice si elle est connue dans son profil
3. Le moment d'usage probable du maquillage (jour/soir/professionnel/festif selon l'intensité)

Donne 3 couleurs RECOMMANDÉES (avec leur code hex), 2 couleurs À ÉVITER pour ne pas casser l'harmonie,
1 conseil de style en 1 phrase, et une suggestion d'occasion.

Réponds UNIQUEMENT en JSON valide, sans préambule ni markdown :
{
  "score": <0-100, calcule sur les zones réellement maquillées>,
  "titre": <string court bienveillant>,
  "resume": <2 phrases max>,
  "humeur": "encourageant" | "neutre" | "constructif",
  "zones": [
    { "zone": "Teint",      "emoji": "✨", "status": "ok"|"warn"|"err"|"nu", "note": "<factuel>", "conseil": "<max 15 mots>" },
    { "zone": "Yeux",       "emoji": "👁️", "status": "...", "note": "...", "conseil": "..." },
    { "zone": "Lèvres",     "emoji": "💋", "status": "...", "note": "...", "conseil": "..." },
    { "zone": "Sourcils",   "emoji": "✏️", "status": "...", "note": "...", "conseil": "..." },
    { "zone": "Blush",      "emoji": "🌸", "status": "...", "note": "...", "conseil": "..." },
    { "zone": "Contouring", "emoji": "🎨", "status": "...", "note": "...", "conseil": "..." }
  ],
  "point_fort": <string ou null>,
  "corrections": <nombre de zones en warn ou err>,
  "tenue": {
    "couleurs_recommandees": [
      { "nom": "<nom couleur en français>", "hex": "#XXXXXX" },
      { "nom": "<...>", "hex": "#XXXXXX" },
      { "nom": "<...>", "hex": "#XXXXXX" }
    ],
    "couleurs_eviter": [
      { "nom": "<...>", "hex": "#XXXXXX" },
      { "nom": "<...>", "hex": "#XXXXXX" }
    ],
    "conseil_style": "<1 phrase précise et inspirante, max 25 mots>",
    "occasion": "<ex: soirée, journée pro, dîner, festival… 1-3 mots>"
  }
}`

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

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

// Construit un texte de contexte à partir du profil utilisateur
function buildProfilContext(profile: any): string | undefined {
  if (!profile) return undefined
  const bits: string[] = []
  if (profile.teint) bits.push(`carnation ${profile.teint}`)
  if (profile.peau) bits.push(`type de peau ${profile.peau}`)
  if (profile.souston) bits.push(`sous-tons ${profile.souston}`)
  if (profile.saison_chromatique) bits.push(`saison chromatique ${profile.saison_chromatique}`)
  if (bits.length === 0) return undefined
  return bits.join(', ') + '. Cette information est connue d\'avance, ne l\'invente pas et ne la contredis pas.'
}

// FUSION par moyenne pondérée : 2 détections → 1 détection consensus
function fusionnerDetections(d1: any, d2: any): any {
  const zones = ['teint','yeux','levres','sourcils','blush','contouring']
  const out: any = {}
  for (const z of zones) {
    const a = d1[z] ?? { presence: false, certitude: 0, indices: '' }
    const b = d2[z] ?? { presence: false, certitude: 0, indices: '' }
    // Si les deux sont d'accord sur presence, on garde la moyenne de certitude
    // Si désaccord, on prend le plus prudent (presence=false avec certitude diminuée)
    if (a.presence === b.presence) {
      out[z] = {
        presence: a.presence,
        certitude: Math.round((a.certitude + b.certitude) / 2),
        indices: a.indices || b.indices,
      }
    } else {
      // Désaccord : on prend le côté "false" et on baisse la certitude
      out[z] = {
        presence: false,
        certitude: Math.min(a.certitude, b.certitude, 40), // forcé sous 40
        indices: `Désaccord entre passes (${a.presence}/${b.presence}) → mode prudent`,
      }
    }
  }
  return out
}

// FUSION détection initiale + self-critique : on prend la version la plus prudente
function fusionnerAvecCritique(initiale: any, critique: any): any {
  const zones = ['teint','yeux','levres','sourcils','blush','contouring']
  const out: any = {}
  for (const z of zones) {
    const a = initiale[z] ?? { presence: false, certitude: 0, indices: '' }
    const b = critique[z] ?? { presence: false, certitude: 0, indices: '' }
    // Si la self-critique a rétrogradé : on suit la critique
    if (a.presence === true && b.presence === false) {
      out[z] = { ...b, indices: `[rétrogradé après self-critique] ${b.indices}` }
    } else if (a.presence === b.presence) {
      // Accord : moyenne des certitudes
      out[z] = {
        presence: a.presence,
        certitude: Math.round((a.certitude + b.certitude) / 2),
        indices: b.indices || a.indices,
      }
    } else {
      // Critique a remonté à true : on garde le doute (false, certitude basse)
      out[z] = { presence: false, certitude: Math.min(a.certitude, b.certitude, 50), indices: a.indices }
    }
  }
  return out
}

const conseilNuParZone: Record<string, string> = {
  teint: 'Hydrate matin et soir avec une crème adaptée.',
  yeux: 'Soin contour des yeux pour préparer la zone.',
  levres: 'Un baume hydratant suffit en soin quotidien.',
  sourcils: 'Brosse-les vers le haut au réveil.',
  blush: 'La rougeur naturelle des pommettes est belle.',
  contouring: 'L\'éclairage naturel met déjà en valeur tes traits.',
}
const noteNuParZone: Record<string, string> = {
  teint: 'Peau au naturel, sans produit visible.',
  yeux: 'Pas de maquillage des yeux détecté.',
  levres: 'Lèvres au naturel.',
  sourcils: 'Sourcils naturels, non dessinés.',
  blush: 'Pas de blush appliqué.',
  contouring: 'Aucune sculpture du visage détectée.',
}
const emojiParZone: Record<string, string> = {
  teint: '✨', yeux: '👁️', levres: '💋', sourcils: '✏️', blush: '🌸', contouring: '🎨',
}
const labelParZone: Record<string, string> = {
  teint: 'Teint', yeux: 'Yeux', levres: 'Lèvres', sourcils: 'Sourcils', blush: 'Blush', contouring: 'Contouring',
}

function reponseVisageNu() {
  const zones = Object.keys(labelParZone).map(z => ({
    zone: labelParZone[z],
    emoji: emojiParZone[z],
    status: 'nu' as const,
    note: noteNuParZone[z],
    conseil: conseilNuParZone[z],
  }))
  return {
    score: 0,
    maquillage_detecte: false,
    titre: 'Visage au naturel',
    resume: 'Aucun maquillage détecté. Reviens nous montrer ton make-up quand tu en auras posé pour une analyse complète.',
    humeur: 'encourageant' as const,
    zones,
    point_fort: null,
    corrections: 0,
  }
}

function appliquerForceNu(result: any, zonesConfirmees: Record<string, boolean>) {
  if (!result?.zones || !Array.isArray(result.zones)) return result
  const mapZone: Record<string, string> = {
    'Teint': 'teint', 'Yeux': 'yeux', 'Lèvres': 'levres',
    'Sourcils': 'sourcils', 'Blush': 'blush', 'Contouring': 'contouring',
  }
  result.zones = result.zones.map((z: any) => {
    const key = mapZone[z.zone]
    if (key && zonesConfirmees[key] === false) {
      return {
        ...z,
        status: 'nu',
        note: noteNuParZone[key],
        conseil: conseilNuParZone[key],
      }
    }
    return z
  })
  // Recalcule le nombre de corrections
  result.corrections = result.zones.filter((z: any) => z.status === 'warn' || z.status === 'err').length
  return result
}

// Appel détection (factorisé pour le vote majoritaire)
async function appelerDetection(image: string, profilContext?: string) {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 800,
    temperature: 0,
    messages: [{
      role: 'user',
      content: [
        { type: 'image' as const, source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: image } },
        { type: 'text' as const, text: promptDetection(profilContext) },
      ],
    }],
  })
  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  return extractJSON(text)
}

// ─────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    let userId: string | null = null
    let profile: any = null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const supabase = createServiceClient()
      const { data } = await supabase.auth.getUser(token)
      userId = data.user?.id ?? null

      if (userId) {
        const { data: p } = await supabase
          .from('profiles')
          .select('analyses_count_month, is_premium, is_admin, analyses_reset_at, premium_until, teint, peau, souston, saison_chromatique')
          .eq('id', userId)
          .single()
        profile = p

        if (profile && !profile.is_admin) {
          const premiumActif = profile.is_premium && (
            !profile.premium_until || new Date(profile.premium_until) > new Date()
          )
          const needsReset = !profile.analyses_reset_at || new Date(profile.analyses_reset_at) <= new Date()
          const count = needsReset ? 0 : profile.analyses_count_month
          const limit = premiumActif ? 9999 : 3

          if (count >= limit) {
            return NextResponse.json(
              { error: 'Limite mensuelle atteinte', premium: !premiumActif },
              { status: 429 }
            )
          }
        }
      }
    }

    const body = await req.json()
    const { image, type } = body

    if (!image) {
      return NextResponse.json({ error: 'Image manquante' }, { status: 400 })
    }

    const profilContext = buildProfilContext(profile)

    const imageContent = {
      type: 'image' as const,
      source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: image },
    }

    // ─── PASSE 1 : Détection (vote majoritaire si activé) ───
    let detection: any
    if (VOTE_PARALLELE) {
      const [d1, d2] = await Promise.all([
        appelerDetection(image, profilContext),
        appelerDetection(image, profilContext),
      ])
      detection = fusionnerDetections(d1, d2)
      console.log('[Analyse] vote détection 1:', JSON.stringify(d1))
      console.log('[Analyse] vote détection 2:', JSON.stringify(d2))
      console.log('[Analyse] détection fusionnée:', JSON.stringify(detection))
    } else {
      detection = await appelerDetection(image, profilContext)
      console.log('[Analyse] détection unique:', JSON.stringify(detection))
    }

    // ─── PASSE 1 BIS : Self-critique (si activée) ───
    if (SELF_CRITIQUE) {
      const critiqueMsg = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 800,
        temperature: 0,
        messages: [{
          role: 'user',
          content: [imageContent, { type: 'text', text: promptSelfCritique(detection) }],
        }],
      })
      const critiqueText = critiqueMsg.content[0].type === 'text' ? critiqueMsg.content[0].text : ''
      try {
        const critique = extractJSON(critiqueText)
        const detectionAvant = { ...detection }
        detection = fusionnerAvecCritique(detectionAvant, critique)
        console.log('[Analyse] self-critique:', JSON.stringify(critique))
        console.log('[Analyse] après critique:', JSON.stringify(detection))
      } catch (e) {
        console.warn('[Analyse] self-critique parsing failed, on garde la détection:', e)
      }
    }

    // ─── Filtrage par seuil ───
    const zones = ['teint','yeux','levres','sourcils','blush','contouring']
    const zonesConfirmees: Record<string, boolean> = {}
    for (const z of zones) {
      const d = detection[z]
      zonesConfirmees[z] = !!(d?.presence === true && (d?.certitude ?? 0) >= SEUIL_CERTITUDE)
    }

    const nbZonesMaquillees = Object.values(zonesConfirmees).filter(Boolean).length
    let result: any

    if (nbZonesMaquillees === 0) {
      result = reponseVisageNu()
    } else {
      const analyseMsg = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: [imageContent, { type: 'text', text: promptAnalyse(zonesConfirmees, profilContext) }],
        }],
      })
      const analyseText = analyseMsg.content[0].type === 'text' ? analyseMsg.content[0].text : ''
      result = extractJSON(analyseText)
      result = appliquerForceNu(result, zonesConfirmees)
      result.maquillage_detecte = true
    }

    // Retourne aussi la détection brute (utile pour debug et future calibration utilisateur)
    result._debug = {
      seuil: SEUIL_CERTITUDE,
      detection,
      zonesConfirmees,
    }

    console.log('[Analyse] zones confirmées (seuil ' + SEUIL_CERTITUDE + ') :', zonesConfirmees)

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
        tenue: result.tenue ?? null,
      })
      // On n'incrémente le compteur que pour les utilisateurs free non-admin
      // (les abonnés ont des analyses illimitées, pas besoin de polluer le compteur)
      const isFree = !profile?.is_admin && !profile?.is_premium
      if (result.maquillage_detecte && isFree) {
        await supabase.rpc('increment_analysis_count', { user_uuid: userId })
      }
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Analyse error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
