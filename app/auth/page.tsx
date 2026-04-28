'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function PageAuth() {
  const [mode, setMode]         = useState<'login' | 'signup'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()

    if (mode === 'signup') {
      const { data: signUpData, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      // Vérifier si email dans waitlist avec premium_granted
      if (signUpData.user) {
        const { data: wl } = await supabase
          .from('waitlist').select('premium_granted').eq('email', email).single()
        if (wl?.premium_granted) {
          const premiumUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          await supabase.from('profiles')
            .update({ is_premium: true, premium_until: premiumUntil })
            .eq('id', signUpData.user.id)
        }
      }
      setSuccess('Compte créé ! Tu peux te connecter.')
      setLoading(false)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError('Email ou mot de passe incorrect'); setLoading(false); return }
      window.location.href = '/app'
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24,
      background: 'var(--bg)', backgroundImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(196,117,138,0.08) 0%, transparent 60%)',
    }}>
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 52, letterSpacing: 4 }}>
          N<span style={{ color: 'var(--accent)' }}>Y</span>LVA
        </div>

        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 12 }}>Beauty Intelligence</p>
      </div>

      <div className="nylva-card" style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', marginBottom: 24, background: 'var(--bg2)', borderRadius: 10, padding: 4 }}>
          {(['login', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null) }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
                background: mode === m ? '#FFFFFF' : 'transparent',
                color: mode === m ? 'var(--accent)' : 'var(--muted)',
              }}
            >
              {m === 'login' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✉️</div>
            <p style={{ color: 'var(--green)', fontSize: 14, marginBottom: 16 }}>{success}</p>
            <button className="nylva-btn-primary" onClick={() => { setSuccess(null); setMode('login') }}>
              Se connecter
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div style={{ marginBottom: 14 }}>
              <label className="nylva-label">Email</label>
              <input
                className="nylva-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="contact@nylva.fr"
                required
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="nylva-label">Mot de passe</label>
              <input
                className="nylva-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(196,90,106,0.08)', border: '1px solid rgba(196,90,106,0.25)', borderRadius: 8, padding: 10, marginBottom: 16, color: 'var(--red)', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button className="nylva-btn-primary" type="submit" disabled={loading}>
              {loading ? '…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
