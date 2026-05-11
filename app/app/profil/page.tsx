'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LogOut, Save, Crown } from 'lucide-react'

type Profile = {
  prenom: string
  teint: string
  peau: string
  souston: string
  fond_teint: string
  rouge_levres: string
  correcteur: string
  is_premium: boolean
  tier: 'free' | 'essentiel' | 'signature'
  analyses_count_month: number
}

const TEINTS = ['Très clair', 'Clair', 'Medium', 'Hâlé', 'Foncé', 'Très foncé']
const PEAUX  = ['Normale', 'Sèche', 'Grasse', 'Mixte', 'Sensible']
const SOUSTONS = ['Chaud', 'Froid', 'Neutre', 'Olive']

export default function PageProfil() {
  const router = useRouter()
  const [premiumSuccess, setPremiumSuccess] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setPremiumSuccess(params.get('premium') === 'success')
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/auth'); return }
      setEmail(session.user.email ?? '')
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      if (p) {
        // Si premium_until est expiré côté client, on force tier=free pour l'affichage
        // (le cron côté serveur fera le vrai update plus tard)
        const expired = p.premium_until && new Date(p.premium_until) < new Date()
        if (expired && !p.is_admin) {
          p.tier = 'free'
          p.is_premium = false
        }
        setProfile(p)
      }
      setLoading(false)
    })
  }, [router])


  const save = async () => {
    if (!profile) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    // Whitelist : seuls les champs profil utilisateur sont updatables côté client.
    // is_premium / premium_until / is_admin / analyses_count_month sont gérés côté serveur uniquement.
    const safeUpdate = {
      prenom: profile.prenom ?? null,
      teint: profile.teint ?? null,
      peau: profile.peau ?? null,
      souston: profile.souston ?? null,
      fond_teint: profile.fond_teint ?? null,
      rouge_levres: profile.rouge_levres ?? null,
      correcteur: profile.correcteur ?? null,
    }
    await supabase.from('profiles').update(safeUpdate).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh(); router.push('/auth')
  }

  const field = (key: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfile(prev => prev ? { ...prev, [key]: e.target.value } : prev)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div className="pulse" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 48, color: 'var(--accent)' }}>◈</div>
    </div>
  )

  if (!profile) return null

  return (
    <div style={{ padding: '20px', maxWidth: 480, margin: '0 auto' }}>
      {premiumSuccess && (
        <div style={{ background: 'rgba(93,202,165,0.1)', border: '1px solid rgba(93,202,165,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: 'var(--green)', fontSize: 13, textAlign: 'center' }}>
          ✓ Premium activé ! Merci pour ton abonnement.
        </div>
      )}

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 28, marginBottom: 4 }}>
            Mon profil
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>{email}</p>
        </div>
        {profile.tier === 'signature' && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, rgba(196,117,138,0.12), rgba(184,147,74,0.12))', border: '1px solid rgba(184,147,74,0.4)', borderRadius: 20, padding: '6px 12px', fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>
            <Crown size={12} /> Signature
          </span>
        )}
        {profile.tier === 'essentiel' && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(196,117,138,0.1)', border: '1px solid rgba(196,117,138,0.3)', borderRadius: 20, padding: '6px 12px', fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
            ✦ Essentiel
          </span>
        )}
      </div>

      {/* Quota */}
      {profile.tier === 'free' && (
        <div className="nylva-card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Analyses ce mois</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: profile.analyses_count_month >= 3 ? 'var(--red)' : 'var(--green)' }}>
              {profile.analyses_count_month}/3
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(profile.analyses_count_month / 3) * 100}%`, background: profile.analyses_count_month >= 3 ? 'var(--red)' : 'var(--accent)', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
          <button
            className="nylva-btn-primary"
            onClick={() => router.push('/pricing')}
            style={{ marginTop: 12, background: 'linear-gradient(135deg,var(--accent),var(--gold))', color: '#FFFFFF', fontSize: 13 }}
          >
            ✦ Découvrir les abonnements
          </button>
        </div>
      )}

      {profile.tier === 'essentiel' && (
        <div className="nylva-card" style={{ marginBottom: 16, background: 'linear-gradient(160deg, #FFFFFF, #FDF5F7)', border: '1px solid rgba(196,117,138,0.25)' }}>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10, lineHeight: 1.55 }}>
            ✨ Tu profites de NYLVA <strong>Essentiel</strong>. Pour le coach vocal, le miroir IA et la morphologie, passe à Signature.
          </p>
          <button
            className="nylva-btn-primary"
            onClick={() => router.push('/pricing')}
            style={{ background: 'linear-gradient(135deg,var(--accent),var(--gold))', color: '#FFFFFF', fontSize: 13 }}
          >
            Passer à Signature
          </button>
        </div>
      )}

      {/* Prénom */}
      <div style={{ marginBottom: 16 }}>
        <label className="nylva-label">Prénom</label>
        <input className="nylva-input" value={profile.prenom ?? ''} onChange={field('prenom')} placeholder="Ton prénom" />
      </div>

      {/* Teint */}
      <div style={{ marginBottom: 16 }}>
        <label className="nylva-label">Teint</label>
        <select className="nylva-input" value={profile.teint ?? ''} onChange={field('teint')}>
          <option value="">Sélectionne ton teint</option>
          {TEINTS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Type de peau */}
      <div style={{ marginBottom: 16 }}>
        <label className="nylva-label">Type de peau</label>
        <select className="nylva-input" value={profile.peau ?? ''} onChange={field('peau')}>
          <option value="">Sélectionne ton type</option>
          {PEAUX.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Sous-tons */}
      <div style={{ marginBottom: 16 }}>
        <label className="nylva-label">Sous-tons</label>
        <select className="nylva-input" value={profile.souston ?? ''} onChange={field('souston')}>
          <option value="">Sélectionne tes sous-tons</option>
          {SOUSTONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Produits */}
      <div style={{ marginBottom: 16 }}>
        <label className="nylva-label">Fond de teint habituel</label>
        <input className="nylva-input" value={profile.fond_teint ?? ''} onChange={field('fond_teint')} placeholder="ex: L'Oréal Infaillible N120" />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="nylva-label">Rouge à lèvres habituel</label>
        <input className="nylva-input" value={profile.rouge_levres ?? ''} onChange={field('rouge_levres')} placeholder="ex: MAC Ruby Woo" />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label className="nylva-label">Correcteur habituel</label>
        <input className="nylva-input" value={profile.correcteur ?? ''} onChange={field('correcteur')} placeholder="ex: NARS Radiant Creamy" />
      </div>

      {/* Actions */}
      <button className="nylva-btn-primary" onClick={save} disabled={saving} style={{ marginBottom: 12 }}>
        <Save size={14} style={{ display: 'inline', marginRight: 6 }} />
        {saving ? 'Sauvegarde…' : saved ? '✓ Sauvegardé' : 'Sauvegarder'}
      </button>

      <button className="nylva-btn-ghost" onClick={logout}>
        <LogOut size={14} style={{ display: 'inline', marginRight: 6 }} />
        Se déconnecter
      </button>
    </div>
  )
}
