'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Camera, Upload, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase'

type SaisonResult = {
  saison: string
  sous_saison: string
  teint: string
  yeux: string
  cheveux: string
  undertone: string
  resume: string
  couleurs_phares: string[]
  couleurs_eviter: string[]
  matieres: string[]
  styles_maquillage: string[]
  fondations_teinte: string
  celebrites: string[]
  conseil_signature: string
}

const SAISON_BG: Record<string, string> = {
  'Printemps': 'linear-gradient(135deg,rgba(255,220,150,0.15),rgba(255,180,120,0.12))',
  'Été':       'linear-gradient(135deg,rgba(200,210,255,0.15),rgba(180,190,230,0.12))',
  'Automne':   'linear-gradient(135deg,rgba(200,120,60,0.15),rgba(160,90,40,0.12))',
  'Hiver':     'linear-gradient(135deg,rgba(180,190,220,0.15),rgba(100,120,180,0.12))',
}
const SAISON_EMOJI: Record<string, string> = {
  'Printemps': '🌸', 'Été': '☀️', 'Automne': '🍂', 'Hiver': '❄️'
}

export default function PageSaison() {
  const fileRef   = useRef<HTMLInputElement>(null)
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [phase, setPhase]   = useState<'idle'|'camera'|'preview'|'loading'|'result'>('idle')
  const [imageB64, setImageB64] = useState<string | null>(null)
  const [result, setResult] = useState<SaisonResult | null>(null)
  const [error, setError]   = useState<string | null>(null)
  const [session, setSession] = useState<any>(null)
  const [savedSaison, setSavedSaison] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s)
      if (s) {
        const { data: p } = await supabase.from('profiles').select('saison_chromatique,sous_saison').eq('id', s.user.id).single()
        if (p?.saison_chromatique) setSavedSaison(`${p.saison_chromatique}${p.sous_saison ? ' · ' + p.sous_saison : ''}`)
      }
    })
  }, [])

  useEffect(() => {
    if (phase === 'camera' && streamRef.current && videoRef.current) {
      const v = videoRef.current
      v.srcObject = streamRef.current
      v.onloadedmetadata = () => v.play().catch(() => {})
    }
  }, [phase])

  const startCamera = useCallback(async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      setPhase('camera')
    } catch { setError('Caméra indisponible.') }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const v = videoRef.current, c = canvasRef.current
    c.width = v.videoWidth; c.height = v.videoHeight
    const ctx = c.getContext('2d')!
    ctx.translate(c.width, 0); ctx.scale(-1, 1); ctx.drawImage(v, 0, 0)
    setImageB64(c.toDataURL('image/jpeg', .9).split(',')[1])
    stopCamera(); setPhase('preview')
  }, [stopCamera])

  const importPhoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader()
    r.onload = () => { setImageB64((r.result as string).split(',')[1]); setPhase('preview') }
    r.readAsDataURL(f)
  }, [])

  const analyser = useCallback(async () => {
    if (!imageB64) return
    setPhase('loading'); setError(null)
    try {
      const res = await fetch('/api/saison', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ image: imageB64 }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setResult(json); setPhase('result')
    } catch { setError('Erreur analyse. Réessaie.'); setPhase('preview') }
  }, [imageB64, session])

  const reset = () => {
    stopCamera(); setPhase('idle'); setImageB64(null); setResult(null); setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div style={{ padding: '20px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 30, marginBottom: 4 }}>Saison Chromatique</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          {savedSaison ? `✦ Ta saison : ${savedSaison}` : 'Découvre ta palette de couleurs naturelle'}
        </p>
      </div>

      {/* IDLE */}
      {phase === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="nylva-card fade-up" style={{ background: 'linear-gradient(145deg,#FFFFFF,#FFF8F5)', padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎨</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 300, marginBottom: 8 }}>Ton identité chromatique</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
              Printemps, Été, Automne ou Hiver — une analyse de ton teint, tes yeux et tes cheveux pour révéler ta palette de couleurs idéale.
            </p>
            <button className="nylva-btn-primary" onClick={startCamera} style={{ marginBottom: 10 }}>
              <Camera size={15} style={{ display: 'inline', marginRight: 8 }} />Prendre une photo
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={importPhoto} />
            <button className="nylva-btn-ghost" onClick={() => fileRef.current?.click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Upload size={15} />Importer une photo
            </button>
          </div>

          {/* Saisons preview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {['Printemps 🌸','Été ☀️','Automne 🍂','Hiver ❄️'].map(s => (
              <div key={s} style={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 14px', boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, marginBottom: 4 }}>{s}</p>
                <p style={{ color: 'var(--muted)', fontSize: 11, lineHeight: 1.4 }}>
                  {s.includes('Printemps') ? 'Chaud · Lumineux · Doré' : s.includes('Été') ? 'Froid · Doux · Rosé' : s.includes('Automne') ? 'Chaud · Profond · Terreux' : 'Froid · Vif · Contrasté'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CAMERA */}
      {phase === 'camera' && (
        <div>
          <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', marginBottom: 16, background: '#1C1410', minHeight: 300, boxShadow: 'var(--shadow-md)' }}>
            <video ref={videoRef} playsInline muted autoPlay style={{ width: '100%', display: 'block', transform: 'scaleX(-1)' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ width: '55%', paddingBottom: '75%', borderRadius: '50%', border: '2px solid rgba(196,117,138,0.6)', boxShadow: '0 0 0 9999px rgba(28,20,16,.45)' }} />
            </div>
            <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center' }}>
              <p style={{ color: 'rgba(251,247,244,.7)', fontSize: 11 }}>Lumière naturelle · Sans maquillage si possible</p>
            </div>
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="nylva-btn-ghost" onClick={reset}>Annuler</button>
            <button className="nylva-btn-primary" onClick={capture}><Camera size={15} style={{ display: 'inline', marginRight: 8 }} />Capturer</button>
          </div>
        </div>
      )}

      {/* PREVIEW */}
      {phase === 'preview' && imageB64 && (
        <div>
          <img src={`data:image/jpeg;base64,${imageB64}`} alt="Photo" style={{ width: '100%', borderRadius: 20, marginBottom: 16, boxShadow: 'var(--shadow-md)' }} />
          {error && <div style={{ background: 'rgba(196,90,106,0.08)', border: '1px solid rgba(196,90,106,0.25)', borderRadius: 12, padding: 12, marginBottom: 16, color: 'var(--red)', fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="nylva-btn-ghost" onClick={reset}><RefreshCw size={13} style={{ display: 'inline', marginRight: 6 }} />Reprendre</button>
            <button className="nylva-btn-primary" onClick={analyser}>🎨 Analyser ma saison</button>
          </div>
        </div>
      )}

      {/* LOADING */}
      {phase === 'loading' && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(196,117,138,.15),rgba(184,147,74,.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <div className="pulse" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, color: 'var(--accent)' }}>◈</div>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 15, fontFamily: "'Cormorant Garamond',serif", marginBottom: 6 }}>Analyse chromatique en cours…</p>
          <p style={{ color: 'var(--muted)', fontSize: 12 }}>Teint · Sous-tons · Contraste naturel</p>
        </div>
      )}

      {/* RÉSULTAT */}
      {phase === 'result' && result && (
        <div className="fade-up">
          {/* Saison card */}
          <div className="nylva-card" style={{ marginBottom: 16, padding: 28, background: SAISON_BG[result.saison] || '#FFFFFF', border: '1px solid rgba(196,117,138,0.2)' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 52, marginBottom: 8 }}>{SAISON_EMOJI[result.saison]}</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 300, marginBottom: 4 }}>{result.saison}</h2>
              <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>{result.sous_saison}</p>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{result.resume}</p>
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontStyle: 'italic', color: 'var(--text2)', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              "{result.conseil_signature}"
            </div>
          </div>

          {/* Palette couleurs */}
          <div className="nylva-card" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontWeight: 500 }}>Ta palette chromatique</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {result.couleurs_phares.map((c, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: c, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', border: '2px solid rgba(255,255,255,0.8)' }} />
                  <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'monospace' }}>{c}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, fontWeight: 500 }}>Couleurs à éviter :</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {result.couleurs_eviter.map((c, i) => (
                <div key={i} style={{ position: 'relative', width: 36, height: 36, borderRadius: 10, background: c, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 14, filter: 'brightness(2)' }}>✕</span>
                </div>
              ))}
            </div>
          </div>

          {/* Infos beauté */}
          <div className="nylva-card" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontWeight: 500 }}>Profil observé</p>
            {[['👁 Teint', result.teint], ['💎 Yeux', result.yeux], ['🌿 Cheveux', result.cheveux], ['🎯 Sous-tons', result.undertone], ['✨ Fond de teint', result.fondations_teinte]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--muted)', minWidth: 100 }}>{l}</span>
                <span style={{ fontSize: 13, color: 'var(--text2)', flex: 1 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Styles maquillage */}
          <div className="nylva-card" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontWeight: 500 }}>Styles maquillage recommandés</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {result.styles_maquillage.map(s => (
                <span key={s} style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 20, padding: '6px 12px', fontSize: 12, color: 'var(--text2)' }}>{s}</span>
              ))}
            </div>
          </div>

          {/* Célébrités */}
          {result.celebrites?.length > 0 && (
            <div className="nylva-card" style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 500 }}>Célébrités de ta saison</p>
              <p style={{ fontSize: 14, color: 'var(--text2)' }}>{result.celebrites.join(' · ')}</p>
            </div>
          )}

          <button className="nylva-btn-ghost" onClick={reset}><RefreshCw size={13} style={{ display: 'inline', marginRight: 8 }} />Nouvelle analyse</button>
        </div>
      )}
    </div>
  )
}
