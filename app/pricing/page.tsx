'use client'

import { useState, useEffect } from 'react'
import { Check, Sparkles, Crown, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Period = 'monthly' | 'yearly'

const PRICES = {
  essentiel: { monthly: 6.99, yearly: 59 },
  signature: { monthly: 14.99, yearly: 129 },
}

// Économie annuelle vs mensuel
const SAVINGS = {
  essentiel: Math.round(((PRICES.essentiel.monthly * 12 - PRICES.essentiel.yearly) / (PRICES.essentiel.monthly * 12)) * 100),
  signature: Math.round(((PRICES.signature.monthly * 12 - PRICES.signature.yearly) / (PRICES.signature.monthly * 12)) * 100),
}

export default function PricingPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<Period>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setAuthed(!!data.user))
  }, [])

  const subscribe = async (plan: 'essentiel' | 'signature') => {
    if (!authed) {
      router.push('/auth?next=/app/pricing')
      return
    }
    const planKey = `${plan}-${period === 'monthly' ? 'monthly' : 'yearly'}`
    setLoading(planKey)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>

        {/* Header */}
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 24, cursor: 'pointer' }}>
          <ArrowLeft size={14} /> Retour
        </button>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 12, fontWeight: 600 }}>Devenir abonnée</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 38, lineHeight: 1.15, marginBottom: 12, color: 'var(--text)' }}>
            Choisis ton<br /><em style={{ color: 'var(--accent)', fontWeight: 400 }}>niveau d'expertise</em>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 460, margin: '0 auto', lineHeight: 1.55 }}>
            NYLVA t'accompagne au quotidien dans ta routine beauté. Annulable à tout moment, sans engagement.
          </p>
        </div>

        {/* Toggle mensuel/annuel */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', background: '#FFFFFF', border: '1px solid var(--border)',
            borderRadius: 30, padding: 4, position: 'relative',
          }}>
            <button onClick={() => setPeriod('monthly')} style={{
              padding: '8px 22px', borderRadius: 26, border: 'none',
              background: period === 'monthly' ? 'var(--accent)' : 'transparent',
              color: period === 'monthly' ? '#FFF' : 'var(--text2)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
            }}>Mensuel</button>
            <button onClick={() => setPeriod('yearly')} style={{
              padding: '8px 22px', borderRadius: 26, border: 'none',
              background: period === 'yearly' ? 'var(--accent)' : 'transparent',
              color: period === 'yearly' ? '#FFF' : 'var(--text2)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              Annuel
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 8,
                background: period === 'yearly' ? 'rgba(255,255,255,0.2)' : 'rgba(196,117,138,0.15)',
                color: period === 'yearly' ? '#FFF' : 'var(--accent)',
                fontWeight: 700,
              }}>−30%</span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', maxWidth: 720, margin: '0 auto' }}>

          {/* ESSENTIEL */}
          <div style={{
            background: '#FFFFFF', borderRadius: 20, padding: 28,
            border: '1px solid var(--border)',
            position: 'relative',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Sparkles size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>Essentiel</span>
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 400, fontSize: 26, marginBottom: 8, color: 'var(--text)' }}>
              Pour la routine du quotidien
            </h2>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4, marginTop: 18 }}>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 42, fontWeight: 400, color: 'var(--text)' }}>
                {period === 'monthly' ? PRICES.essentiel.monthly : (PRICES.essentiel.yearly / 12).toFixed(2)}€
              </span>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>/mois</span>
            </div>
            {period === 'yearly' && (
              <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 18 }}>
                Soit {PRICES.essentiel.yearly}€/an — économise {SAVINGS.essentiel}%
              </p>
            )}
            {period === 'monthly' && <div style={{ height: 22 }} />}

            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24 }}>
              {[
                'Analyses visage illimitées',
                'Saison chromatique (analyse unique)',
                'Coach IA texte (30 messages/jour)',
                'Catalogue marques + recommandations',
                'Historique de 3 mois',
                'Sans publicité',
              ].map(f => (
                <li key={f} style={{ display: 'flex', gap: 10, fontSize: 13, marginBottom: 10, color: 'var(--text2)', lineHeight: 1.5 }}>
                  <Check size={15} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => subscribe('essentiel')}
              disabled={loading !== null}
              className="nylva-btn-primary"
              style={{ width: '100%', background: '#FFF', color: 'var(--accent)', border: '1.5px solid var(--accent)' }}
            >
              {loading === `essentiel-${period}` ? 'Redirection…' : 'Choisir Essentiel'}
            </button>
          </div>

          {/* SIGNATURE */}
          <div style={{
            background: 'linear-gradient(160deg, #FFFFFF 0%, #FDF5F7 100%)',
            borderRadius: 20, padding: 28,
            border: '1.5px solid var(--accent)',
            position: 'relative',
            boxShadow: '0 12px 36px rgba(196,117,138,0.18)',
          }}>
            {/* Badge */}
            <div style={{
              position: 'absolute', top: -12, right: 24,
              background: 'linear-gradient(135deg, var(--accent), var(--gold))',
              color: '#FFF', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              padding: '5px 12px', borderRadius: 20, textTransform: 'uppercase',
            }}>
              7 jours d'essai gratuit
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Crown size={16} style={{ color: 'var(--gold)' }} />
              <span style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>Signature</span>
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 400, fontSize: 26, marginBottom: 8, color: 'var(--text)' }}>
              L'expertise complète sans limite
            </h2>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4, marginTop: 18 }}>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 42, fontWeight: 400, color: 'var(--text)' }}>
                {period === 'monthly' ? PRICES.signature.monthly : (PRICES.signature.yearly / 12).toFixed(2)}€
              </span>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>/mois</span>
            </div>
            {period === 'yearly' && (
              <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 18 }}>
                Soit {PRICES.signature.yearly}€/an — économise {SAVINGS.signature}%
              </p>
            )}
            {period === 'monthly' && <div style={{ height: 22 }} />}

            <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Tout l'Essentiel +
            </p>

            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24 }}>
              {[
                'Coach IA vocal (voix française naturelle)',
                'Miroir IA temps réel (essai virtuel)',
                'Analyse morphologie du visage',
                'Saison chromatique illimitée',
                'Coach texte sans limite',
                'Historique illimité + comparaisons mois par mois',
                'Accès anticipé aux nouvelles features',
                'Support prioritaire',
              ].map(f => (
                <li key={f} style={{ display: 'flex', gap: 10, fontSize: 13, marginBottom: 10, color: 'var(--text2)', lineHeight: 1.5 }}>
                  <Check size={15} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => subscribe('signature')}
              disabled={loading !== null}
              className="nylva-btn-primary"
              style={{ width: '100%', background: 'linear-gradient(135deg, var(--accent), var(--gold))' }}
            >
              {loading === `signature-${period}` ? 'Redirection…' : 'Démarrer 7 jours gratuits'}
            </button>
            <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>
              Sans engagement. Annulable avant la fin de l'essai sans frais.
            </p>
          </div>
        </div>

        {/* FAQ rapide */}
        <div style={{ maxWidth: 580, margin: '48px auto 0' }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 400, fontSize: 22, textAlign: 'center', marginBottom: 24, color: 'var(--text)' }}>
            Questions fréquentes
          </h3>
          {[
            { q: 'Puis-je annuler à tout moment ?', a: 'Oui. L\'annulation est immédiate depuis ton espace personnel. Aucun frais caché, aucune condition.' },
            { q: 'Comment fonctionne l\'essai gratuit Signature ?', a: '7 jours d\'accès complet sans frais. Tu peux annuler avant la fin de la période d\'essai sans être prélevée.' },
            { q: 'Mes données sont-elles protégées ?', a: 'Oui. Tes photos ne sont jamais conservées sur nos serveurs après l\'analyse. Hébergement européen, RGPD-compatible.' },
            { q: 'Puis-je changer de plan ?', a: 'Tu peux passer d\'Essentiel à Signature à tout moment. La différence est calculée au prorata.' },
          ].map(({ q, a }) => (
            <details key={q} style={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 8 }}>
              <summary style={{ fontWeight: 500, fontSize: 14, cursor: 'pointer', color: 'var(--text)' }}>{q}</summary>
              <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 10, lineHeight: 1.55 }}>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
