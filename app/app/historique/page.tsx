'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Crown, ChevronDown, ChevronUp, Calendar, TrendingUp, Lock } from 'lucide-react'

type Status = 'ok' | 'warn' | 'err' | 'nu'
type Zone = { zone: string; emoji: string; status: Status; note: string; conseil: string }
type Couleur = { nom: string; hex: string }
type Tenue = { couleurs_recommandees?: Couleur[]; couleurs_eviter?: Couleur[]; conseil_style?: string; occasion?: string }
type Analyse = { id: string; score: number; titre: string; resume: string; zones: Zone[]; created_at: string; ok: boolean; tenue?: Tenue }
type Tier = 'free' | 'essentiel' | 'signature' | 'loading'

const SC: Record<Status, string> = { ok: '#5A9E7A', warn: '#C4863A', err: '#C45A6A', nu: '#9B8070' }
const SB: Record<Status, string> = { ok: 'rgba(90,158,122,0.1)', warn: 'rgba(196,134,58,0.1)', err: 'rgba(196,90,106,0.1)', nu: 'rgba(155,128,112,0.08)' }

function Ring({ score }: { score: number }) {
  const r = 28, c = 2 * Math.PI * r, fill = (score / 100) * c
  const col = score >= 75 ? '#5A9E7A' : score >= 50 ? '#C4863A' : '#C45A6A'
  return (
    <svg width={68} height={68} viewBox="0 0 72 72">
      <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={5} />
      <circle cx={36} cy={36} r={r} fill="none" stroke={col} strokeWidth={5} strokeDasharray={`${fill} ${c}`} strokeLinecap="round" transform="rotate(-90 36 36)" />
      <text x={36} y={40} textAnchor="middle" fill={col} style={{ fontSize: 15, fontFamily: "'Cormorant Garamond',serif", fontWeight: 500 }}>{score}</text>
    </svg>
  )
}

function Card({ a }: { a: Analyse }) {
  const [open, setOpen] = useState(false)
  const date = new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <div className="nylva-card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Ring score={a.score} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, marginBottom: 4, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titre}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}><Calendar size={11} />{date}</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {a.zones?.slice(0, 3).map(z => (
              <span key={z.zone} style={{ fontSize: 11, background: SB[z.status], color: SC[z.status], borderRadius: 6, padding: '2px 7px' }}>
                {z.emoji} {z.zone}
              </span>
            ))}
          </div>
        </div>
        <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>
      {open && (
        <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>{a.resume}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {a.zones?.map(z => (
              <div key={z.zone} style={{ background: SB[z.status], border: `1px solid ${SC[z.status]}33`, borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>{z.emoji}</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{z.zone}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: SC[z.status] }}>
                    {z.status === 'ok' ? '✓ OK' : z.status === 'warn' ? '! Attention' : z.status === 'err' ? '✗ À corriger' : '○ Nu'}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text2)', margin: '0 0 4px' }}>{z.note}</p>
                <p style={{ fontSize: 12, color: SC[z.status], margin: 0, fontStyle: 'italic' }}>→ {z.conseil}</p>
              </div>
            ))}
          </div>

          {/* Tenue & couleurs si présentes */}
          {a.tenue?.couleurs_recommandees && a.tenue.couleurs_recommandees.length > 0 && (
            <div style={{ marginTop: 12, padding: '12px 14px', background: 'linear-gradient(160deg, rgba(255,255,255,0.7), rgba(253,247,244,0.9))', border: '1px solid rgba(184,147,74,0.18)', borderRadius: 10 }}>
              <p style={{ fontSize: 10, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 600 }}>
                Tenue & couleurs {a.tenue.occasion ? `· ${a.tenue.occasion}` : ''}
              </p>
              {a.tenue.conseil_style && (
                <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 14, fontStyle: 'italic', color: 'var(--text)', marginBottom: 10, lineHeight: 1.4 }}>
                  « {a.tenue.conseil_style} »
                </p>
              )}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {a.tenue.couleurs_recommandees.map(c => (
                  <div key={c.hex + c.nom} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 16, padding: '3px 8px 3px 3px' }}>
                    <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: c.hex, border: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'var(--text2)' }}>{c.nom}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Mini-graphique progression des scores (Signature)
function ProgressionChart({ analyses }: { analyses: Analyse[] }) {
  // On prend les 12 dernières et on les inverse pour avoir l'ordre chronologique
  const data = useMemo(() => {
    return [...analyses].slice(0, 12).reverse()
  }, [analyses])

  if (data.length < 2) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
        Au moins 2 analyses sont nécessaires pour voir ta progression.
      </div>
    )
  }

  const max = 100, min = 0, w = 320, h = 100, pad = 14
  const stepX = (w - 2 * pad) / Math.max(1, data.length - 1)
  const points = data.map((a, i) => {
    const x = pad + i * stepX
    const y = h - pad - ((a.score - min) / (max - min)) * (h - 2 * pad)
    return { x, y, score: a.score, date: a.created_at }
  })
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const area = `${path} L ${points[points.length - 1].x} ${h - pad} L ${points[0].x} ${h - pad} Z`

  const moyenne = Math.round(data.reduce((s, a) => s + a.score, 0) / data.length)
  const evolution = data[data.length - 1].score - data[0].score
  const evolutionColor = evolution > 0 ? '#5A9E7A' : evolution < 0 ? '#C45A6A' : '#9B8070'

  return (
    <div className="nylva-card" style={{ marginBottom: 16, background: 'linear-gradient(160deg, #FFFFFF 0%, #FDF5F7 100%)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
          ✨ Ta progression
        </p>
        <span style={{ fontSize: 11, color: evolutionColor, fontWeight: 600 }}>
          {evolution > 0 ? '+' : ''}{evolution} pts
        </span>
      </div>

      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(196,117,138,0.4)" />
            <stop offset="100%" stopColor="rgba(196,117,138,0)" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#grad)" />
        <path d={path} fill="none" stroke="#C4758A" strokeWidth={2} />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="#FFF" stroke="#C4758A" strokeWidth={1.8} />
        ))}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
        <span>Moyenne <strong style={{ color: 'var(--text)' }}>{moyenne}/100</strong></span>
        <span>{data.length} dernières analyses</span>
      </div>
    </div>
  )
}

export default function PageHistorique() {
  const router = useRouter()
  const [analyses, setAnalyses] = useState<Analyse[]>([])
  const [tier, setTier] = useState<Tier>('loading')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/auth'); return }
      const { data: p } = await supabase.from('profiles')
        .select('tier,is_admin,is_premium,premium_until')
        .eq('id', session.user.id).single()

      const expired = p?.premium_until && new Date(p.premium_until) < new Date()
      const t: Tier = p?.is_admin ? 'signature' : (expired ? 'free' : ((p?.tier as any) ?? 'free'))
      setTier(t)

      if (t !== 'free') {
        // Essentiel = 3 mois max ; Signature = illimité
        const since = new Date()
        if (t === 'essentiel') since.setMonth(since.getMonth() - 3)
        else since.setFullYear(since.getFullYear() - 10)
        const { data } = await supabase.from('analyses')
          .select('*')
          .eq('user_id', session.user.id)
          .gte('created_at', since.toISOString())
          .order('created_at', { ascending: false })
          .limit(t === 'signature' ? 200 : 50)
        setAnalyses((data ?? []) as Analyse[])
      }
      setLoading(false)
    })
  }, [router])

  if (loading || tier === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div className="pulse" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 48, color: 'var(--accent)' }}>◈</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 30, marginBottom: 4 }}>
          Historique
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          {tier === 'free' ? 'Fonctionnalité réservée aux abonnées' :
            tier === 'essentiel' ? `${analyses.length} analyse${analyses.length > 1 ? 's' : ''} · 3 derniers mois` :
              `${analyses.length} analyse${analyses.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {tier === 'free' ? (
        <div className="nylva-card" style={{ textAlign: 'center', padding: 36 }}>
          <Crown size={32} style={{ color: 'var(--gold)', marginBottom: 12 }} />
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, marginBottom: 8 }}>Historique abonnée</h2>
          <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
            Retrouve toutes tes analyses passées et suis ta progression au fil du temps.
          </p>
          <button
            className="nylva-btn-primary"
            onClick={() => router.push('/pricing')}
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--gold))' }}
          >
            ✦ Découvrir les abonnements
          </button>
        </div>
      ) : analyses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>◇</div>
          <p style={{ fontSize: 14 }}>Aucune analyse pour l'instant.</p>
        </div>
      ) : (
        <>
          {/* Graphique progression — Signature uniquement */}
          {tier === 'signature' && analyses.length >= 2 && <ProgressionChart analyses={analyses} />}

          {/* Cross-sell : essentiel → signature pour la progression */}
          {tier === 'essentiel' && analyses.length >= 2 && (
            <div className="nylva-card" style={{
              marginBottom: 16,
              background: 'linear-gradient(160deg, #FFFFFF 0%, #FDF5F7 100%)',
              border: '1px solid rgba(184,147,74,0.25)',
              padding: 18,
            }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <TrendingUp size={20} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Ta progression dans le temps</p>
                  <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.55, marginBottom: 12 }}>
                    Visualise l'évolution de ton score d'analyse mois par mois avec NYLVA Signature. Historique complet sans limite de durée.
                  </p>
                  <button
                    onClick={() => router.push('/pricing')}
                    style={{
                      background: 'linear-gradient(135deg, var(--accent), var(--gold))',
                      color: '#FFFFFF', border: 'none', borderRadius: 22,
                      padding: '8px 16px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    Passer à Signature
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>{analyses.map(a => <Card key={a.id} a={a} />)}</div>

          {/* Footer essentiel : limite 3 mois */}
          {tier === 'essentiel' && (
            <div style={{ textAlign: 'center', marginTop: 20, padding: 14, background: 'rgba(184,147,74,0.06)', border: '1px solid rgba(184,147,74,0.18)', borderRadius: 12 }}>
              <Lock size={14} style={{ color: 'var(--gold)', marginBottom: 6 }} />
              <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
                Tu visualises les 3 derniers mois. <button onClick={() => router.push('/pricing')} style={{ background: 'none', border: 'none', color: 'var(--gold)', textDecoration: 'underline', fontSize: 12, cursor: 'pointer', padding: 0 }}>Passe à Signature</button> pour l'historique illimité.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
