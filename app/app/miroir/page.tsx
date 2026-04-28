'use client'

import { useEffect, useRef, useState } from 'react'
import { Zap, X } from 'lucide-react'

/* ─────────────────────────────────────────────
   MIROIR INTELLIGENT — Feature exclusive NYLVA
   MediaPipe FaceLandmarker → overlay zones beauté
   en temps réel sur caméra frontale
   ───────────────────────────────────────────── */

const ZONES = [
  { id: 'teint',     label: 'Teint',     color: 'rgba(196,117,138,0.55)', indices: [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109] },
  { id: 'yeux_g',   label: 'Œil G',     color: 'rgba(90,158,122,0.7)',   indices: [33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246] },
  { id: 'yeux_d',   label: 'Œil D',     color: 'rgba(90,158,122,0.7)',   indices: [362,382,381,380,374,373,390,249,263,466,388,387,386,385,384,398] },
  { id: 'levres',   label: 'Lèvres',    color: 'rgba(184,147,74,0.75)',  indices: [61,185,40,39,37,0,267,269,270,409,291,375,321,405,314,17,84,181,91,146] },
  { id: 'sourcils', label: 'Sourcils',  color: 'rgba(196,134,58,0.7)',   indices: [70,63,105,66,107,336,296,334,293,300] },
  { id: 'nez',      label: 'Nez',       color: 'rgba(155,128,112,0.45)', indices: [1,2,5,4,6,19,94,125,141,235,236,198,209,49,48,198,197,196,174,188,187,186,92,165,167] },
]

type ZoneStatus = 'ok' | 'warn' | 'err' | null

export default function PageMiroir() {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)
  const detRef    = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [ready, setReady]   = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [tip, setTip]       = useState<string>('Positionne ton visage dans le cadre')
  const [detected, setDetected] = useState(false)
  const [activeZone, setActiveZone] = useState<string | null>(null)

  // Conseils rotatifs quand visage détecté
  const tips = [
    'Lumière naturelle de face pour une analyse optimale',
    'Garde ton visage immobile quelques secondes',
    'NYLVA analyse tes zones en temps réel',
    'Cligne des yeux normalement — le suivi s\'adapte',
    'Ton profil beauté est mémorisé automatiquement',
  ]
  const tipIdx = useRef(0)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        // Charger MediaPipe
        const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        })
        if (!mounted) return
        detRef.current = landmarker

        // Caméra
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream

        const video = videoRef.current!
        video.srcObject = stream
        await new Promise<void>(r => { video.onloadedmetadata = () => { video.play().then(r) } })

        if (!mounted) return
        setReady(true)
        startLoop()
      } catch (e: any) {
        if (mounted) setError('Caméra ou MediaPipe indisponible. Vérifie les permissions.')
      }
    }

    init()
    return () => {
      mounted = false
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
      detRef.current?.close?.()
    }
  }, [])

  // Rotation des conseils
  useEffect(() => {
    if (!detected) return
    const iv = setInterval(() => {
      tipIdx.current = (tipIdx.current + 1) % tips.length
      setTip(tips[tipIdx.current])
    }, 3500)
    return () => clearInterval(iv)
  }, [detected])

  const startLoop = () => {
    let lastTs = -1
    const loop = (ts: number) => {
      rafRef.current = requestAnimationFrame(loop)
      if (!videoRef.current || !canvasRef.current || !detRef.current) return
      const video = videoRef.current
      const canvas = canvasRef.current
      if (video.readyState < 2) return
      if (ts === lastTs) return
      lastTs = ts

      // Dimensions
      const W = video.videoWidth, H = video.videoHeight
      if (!W || !H) return
      canvas.width = W; canvas.height = H

      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, W, H)

      // Détection
      const result = detRef.current.detectForVideo(video, ts)
      const lm = result?.faceLandmarks?.[0]

      if (!lm || lm.length < 478) {
        setDetected(false)
        setTip('Positionne ton visage dans le cadre')
        drawGuide(ctx, W, H)
        return
      }

      setDetected(true)

      // Dessiner overlay zones
      ctx.save()
      ctx.scale(-1, 1)  // Miroir horizontal
      ctx.translate(-W, 0)

      ZONES.forEach(zone => {
        const pts = zone.indices.map(i => ({ x: lm[i].x * W, y: lm[i].y * H }))
        if (pts.length < 3) return

        ctx.beginPath()
        ctx.moveTo(pts[0].x, pts[0].y)
        pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
        ctx.closePath()
        ctx.fillStyle = zone.id === activeZone ? zone.color.replace('0.5', '0.75') : zone.color
        ctx.fill()

        // Label zone
        const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length
        const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 10px DM Sans, sans-serif'
        ctx.textAlign = 'center'
        ctx.shadowColor = 'rgba(0,0,0,0.4)'
        ctx.shadowBlur = 3
        ctx.fillText(zone.label, cx, cy)
        ctx.shadowBlur = 0
      })

      ctx.restore()

      // Indicateur détection
      drawDetected(ctx, W, H)
    }
    rafRef.current = requestAnimationFrame(loop)
  }

  const drawGuide = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    ctx.save()
    const cx = W / 2, cy = H / 2
    const rx = W * 0.28, ry = H * 0.38
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(196,117,138,0.5)'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 6])
    ctx.stroke()
    ctx.restore()
  }

  const drawDetected = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    ctx.save()
    ctx.beginPath()
    ctx.arc(W - 20, 20, 6, 0, Math.PI * 2)
    ctx.fillStyle = '#5A9E7A'
    ctx.fill()
    ctx.restore()
  }

  return (
    <div style={{ padding: '20px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 30, marginBottom: 4 }}>
          Miroir Intelligent
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          Analyse faciale en temps réel · Zones beauté détectées par IA
        </p>
      </div>

      {/* Viewer */}
      <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', marginBottom: 16, background: '#1C1410', aspectRatio: '4/3', boxShadow: 'var(--shadow-lg)' }}>
        <video
          ref={videoRef}
          playsInline muted autoPlay
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: ready ? 'block' : 'none' }}
        />
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', mixBlendMode: 'screen' }}
        />

        {/* Loader */}
        {!ready && !error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'linear-gradient(145deg,#1C1410,#2a1a12)' }}>
            <div className="pulse" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 52, color: 'var(--accent)' }}>◈</div>
            <p style={{ color: 'rgba(251,247,244,0.6)', fontSize: 13 }}>Chargement du moteur IA…</p>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, background: '#1C1410' }}>
            <X size={32} color="var(--red)" />
            <p style={{ color: 'rgba(251,247,244,0.7)', fontSize: 13, textAlign: 'center', lineHeight: 1.5 }}>{error}</p>
          </div>
        )}

        {/* Tip overlay */}
        {ready && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: 'linear-gradient(to top, rgba(28,20,16,0.85), transparent)' }}>
            <p style={{ color: 'rgba(251,247,244,0.85)', fontSize: 12, textAlign: 'center', letterSpacing: '0.03em' }}>
              {detected ? <span style={{ color: 'var(--accent)' }}>◉ </span> : '◎ '}
              {tip}
            </p>
          </div>
        )}
      </div>

      {/* Zones legend */}
      {ready && (
        <div className="nylva-card fade-up" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontWeight: 500 }}>Zones analysées en direct</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ZONES.map(z => (
              <button
                key={z.id}
                onClick={() => setActiveZone(activeZone === z.id ? null : z.id)}
                style={{
                  padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                  background: activeZone === z.id ? z.color.replace('0.5','0.2').replace('0.55','0.2').replace('0.7','0.2').replace('0.75','0.2').replace('0.45','0.15') : 'var(--bg1)',
                  color: activeZone === z.id ? 'var(--text)' : 'var(--muted)',
                  transition: 'all 0.2s',
                  borderColor: activeZone === z.id ? z.color : 'transparent',
                }}
              >
                {z.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info card */}
      <div style={{ background: 'linear-gradient(135deg,rgba(196,117,138,0.07),rgba(184,147,74,0.07))', border: '1px solid rgba(196,117,138,0.18)', borderRadius: 16, padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Zap size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            Le <strong>Miroir Intelligent</strong> détecte 478 points faciaux en temps réel via MediaPipe. Aucune photo n'est envoyée — tout se passe sur ton appareil.
          </p>
        </div>
      </div>
    </div>
  )
}
