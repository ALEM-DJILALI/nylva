'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const supabase = createClient()

interface Profile {
  id: string
  email: string
  prenom: string | null
  teint: string | null
  peau: string | null
  is_premium: boolean
  is_admin: boolean
  analyses_count_month: number
  analyses_reset_at: string | null
  premium_until: string | null
  stripe_customer_id: string | null
  created_at: string
}

interface Analyse {
  id: string
  type: string
  score: number
  titre: string | null
  resume: string | null
  created_at: string
}

interface Stats {
  totalUsers: number
  totalPremium: number
  totalAdmins: number
  totalAnalyses: number
  analysesToday: number
  analysesSemaine: number
  newUsersToday: number
  newUsersWeek: number
}

interface Waitlist {
  id: string
  email: string
  source: string | null
  created_at: string
}

type Tab = 'dashboard' | 'users' | 'analyses' | 'waitlist'
type Modal = null | 'detail' | 'edit' | 'add' | 'confirm'

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, totalPremium: 0, totalAdmins: 0,
    totalAnalyses: 0, analysesToday: 0, analysesSemaine: 0,
    newUsersToday: 0, newUsersWeek: 0
  })
  const [users, setUsers] = useState<Profile[]>([])
  const [allAnalyses, setAllAnalyses] = useState<Analyse[]>([])
  const [filtered, setFiltered] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'premium' | 'admin' | 'free'>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const [modal, setModal] = useState<Modal>(null)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [userAnalyses, setUserAnalyses] = useState<Analyse[]>([])
  const [confirmAction, setConfirmAction] = useState<{ label: string; fn: () => Promise<void> } | null>(null)

  const [editForm, setEditForm] = useState({
    prenom: '', teint: '', peau: '',
    is_premium: false, is_admin: false,
    analyses_count_month: 0, premium_until: ''
  })

  const [addForm, setAddForm] = useState({ email: '', prenom: '', password: '' })
  const [waitlist, setWaitlist] = useState<Waitlist[]>([])

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    let list = [...users]
    if (filterStatus === 'premium') list = list.filter(u => u.is_premium && !u.is_admin)
    if (filterStatus === 'admin') list = list.filter(u => u.is_admin)
    if (filterStatus === 'free') list = list.filter(u => !u.is_premium && !u.is_admin)
    if (search) list = list.filter(u =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.prenom?.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(list)
  }, [search, filterStatus, users])

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function loadAll() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString()

    const res = await fetch('/api/admin/data')
    if (!res.ok) { setLoading(false); return }
    const { profiles, analyses, waitlist: wl } = await res.json()
    setWaitlist(wl ?? [])

    const p = profiles ?? []
    const a = analyses ?? []

    setStats({
      totalUsers: p.length,
      totalPremium: p.filter((x: Profile) => x.is_premium).length,
      totalAdmins: p.filter((x: Profile) => x.is_admin).length,
      totalAnalyses: a.length,
      analysesToday: a.filter((x: Analyse) => x.created_at.startsWith(today)).length,
      analysesSemaine: a.filter((x: Analyse) => x.created_at >= weekAgo).length,
      newUsersToday: p.filter((x: Profile) => x.created_at.startsWith(today)).length,
      newUsersWeek: p.filter((x: Profile) => x.created_at >= weekAgo).length,
    })

    setUsers(p)
    setFiltered(p)
    setAllAnalyses(a)
    setLoading(false)
  }

  async function openDetail(user: Profile) {
    setSelectedUser(user)
    setModal('detail')
    const { data } = await supabase
      .from('analyses').select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setUserAnalyses(data ?? [])
  }

  function openEdit(user: Profile) {
    setSelectedUser(user)
    setEditForm({
      prenom: user.prenom ?? '',
      teint: user.teint ?? '',
      peau: user.peau ?? '',
      is_premium: user.is_premium,
      is_admin: user.is_admin,
      analyses_count_month: user.analyses_count_month,
      premium_until: user.premium_until ? user.premium_until.split('T')[0] : ''
    })
    setModal('edit')
  }


  async function adminAction(action: string, id: string, data?: object) {
    const res = await fetch('/api/admin/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id, data })
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Erreur serveur')
    }
    return res.json()
  }

  async function saveEdit() {
    if (!selectedUser) return
    setSaving(true)
    try {
      await adminAction('update_profile', selectedUser.id, {
        prenom: editForm.prenom || null,
        teint: editForm.teint || null,
        peau: editForm.peau || null,
        is_premium: editForm.is_premium,
        is_admin: editForm.is_admin,
        analyses_count_month: editForm.analyses_count_month,
        premium_until: editForm.premium_until ? new Date(editForm.premium_until).toISOString() : null,
      })
      showToast('Profil mis à jour')
      setModal(null)
      loadAll()
    } catch (e: any) { showToast('Erreur : ' + e.message, 'err') }
    setSaving(false)
  }

  async function resetAnalyses(userId: string) {
    try {
      await adminAction('reset_analyses', userId)
      showToast('Compteur réinitialisé')
      loadAll()
    } catch { showToast('Erreur', 'err') }
  }

  async function deleteUserAnalyses(userId: string) {
    try {
      await adminAction('delete_analyses', userId)
      showToast('Analyses supprimées')
      setUserAnalyses([])
      loadAll()
    } catch { showToast('Erreur', 'err') }
  }

  async function deleteUser(userId: string) {
    try {
      await adminAction('delete_user', userId)
      showToast('Utilisateur supprimé')
      setModal(null)
      loadAll()
    } catch { showToast('Erreur suppression', 'err') }
  }

  async function addUser() {
    if (!addForm.email || !addForm.password) { showToast('Email et mot de passe requis', 'err'); return }
    setSaving(true)
    const { data, error } = await supabase.auth.signUp({
      email: addForm.email,
      password: addForm.password,
      options: { data: { prenom: addForm.prenom } }
    })
    if (error) { showToast('Erreur : ' + error.message, 'err'); setSaving(false); return }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: addForm.email,
        prenom: addForm.prenom || null,
      })
    }
    setSaving(false)
    showToast('Utilisateur créé')
    setModal(null)
    setAddForm({ email: '', prenom: '', password: '' })
    loadAll()
  }

  async function deleteAnalyse(analyseId: string) {
    try {
      await adminAction('delete_analyse', analyseId)
      showToast('Analyse supprimée')
      setUserAnalyses(prev => prev.filter(a => a.id !== analyseId))
      setAllAnalyses(prev => prev.filter(a => a.id !== analyseId))
      loadAll()
    } catch { showToast('Erreur', 'err') }
  }

  function askConfirm(label: string, fn: () => Promise<void>) {
    setConfirmAction({ label, fn })
    setModal('confirm')
  }

  const S = {
    card: { background: '#120D1A', border: '1px solid #2a1f35', borderRadius: '12px' } as React.CSSProperties,
    btn: (color = '#C59FD8', fill = false) => ({
      padding: '0.45rem 0.9rem', borderRadius: '7px', cursor: 'pointer',
      fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.15s',
      background: fill ? color : 'transparent',
      color: fill ? '#0A0709' : color,
      border: `1px solid ${color}`,
    } as React.CSSProperties),
    input: {
      width: '100%', background: '#0A0709', border: '1px solid #2a1f35',
      borderRadius: '8px', padding: '0.6rem 0.9rem', color: '#e8e0f0',
      fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const
    } as React.CSSProperties,
    label: { fontSize: '0.72rem', color: '#6b5a7e', textTransform: 'uppercase' as const, letterSpacing: '0.05em', display: 'block', marginBottom: '0.3rem' },
  }

  const badge = (text: string, color: string, bg: string) => (
    <span style={{ background: bg, color, border: `1px solid ${color}33`, borderRadius: '4px', padding: '0.15rem 0.5rem', fontSize: '0.7rem', fontWeight: '600' }}>{text}</span>
  )


  async function activatePremium(email: string) {
    const res = await fetch('/api/admin/activate-premium', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    if (res.ok) {
      showToast('Premium 30j activé pour ' + email, 'ok')
    } else {
      showToast('Erreur activation premium', 'err')
    }
  }

  return (
    <div style={{ background: '#0A0709', minHeight: '100vh', color: '#e8e0f0', fontFamily: 'DM Sans, sans-serif' }}>

      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100,
          background: toast.type === 'ok' ? '#1a2e20' : '#2e1a1a',
          border: `1px solid ${toast.type === 'ok' ? '#5DCAA5' : '#E87FA0'}`,
          color: toast.type === 'ok' ? '#5DCAA5' : '#E87FA0',
          padding: '0.8rem 1.4rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '500'
        }}>{toast.msg}</div>
      )}

      <div style={{ borderBottom: '1px solid #2a1f35', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', color: '#C59FD8', margin: 0 }}>NYLVA Admin</h1>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {(['dashboard', 'users', 'analyses', 'waitlist'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '0.4rem 1rem', borderRadius: '7px', cursor: 'pointer', fontSize: '0.85rem',
                background: tab === t ? '#1A1020' : 'transparent',
                color: tab === t ? '#C59FD8' : '#6b5a7e',
                border: tab === t ? '1px solid #2a1f35' : '1px solid transparent',
              }}>
                {t === 'dashboard' ? 'Dashboard' : t === 'users' ? 'Utilisateurs' : t === 'analyses' ? 'Analyses' : `Waitlist (${waitlist.length})`}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={loadAll} style={S.btn('#6b5a7e')}>↻ Refresh</button>
          <button onClick={() => router.push('/app')} style={S.btn('#C59FD8')}>← App</button>
        </div>
      </div>

      <div style={{ padding: '2rem', maxWidth: '1300px', margin: '0 auto' }}>

        {tab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Utilisateurs', value: stats.totalUsers, sub: `+${stats.newUsersWeek} cette semaine`, color: '#C59FD8' },
                { label: 'Premium', value: stats.totalPremium, sub: `${stats.totalUsers ? Math.round(stats.totalPremium / stats.totalUsers * 100) : 0}% du total`, color: '#C8A96E' },
                { label: 'Analyses total', value: stats.totalAnalyses, sub: `${stats.analysesSemaine} cette semaine`, color: '#5DCAA5' },
                { label: "Aujourd'hui", value: stats.analysesToday, sub: `${stats.newUsersToday} nouveaux users`, color: '#EF9F27' },
              ].map(s => (
                <div key={s.label} style={{ ...S.card, padding: '1.5rem' }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: '700', color: s.color, fontFamily: 'Cormorant Garamond, serif' }}>{s.value}</div>
                  <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>{s.label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6b5a7e', marginTop: '0.2rem' }}>{s.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ ...S.card, padding: '1.5rem' }}>
              <div style={{ fontWeight: '600', marginBottom: '1rem', color: '#C59FD8' }}>Derniers inscrits</div>
              {users.slice(0, 8).map(u => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #1a1025' }}>
                  <div>
                    <span style={{ fontWeight: '500' }}>{u.prenom || '—'}</span>
                    <span style={{ color: '#6b5a7e', fontSize: '0.85rem', marginLeft: '0.5rem' }}>{u.email}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {u.is_admin && badge('Admin', '#C59FD8', '#1a0f2a')}
                    {u.is_premium && badge('Premium', '#C8A96E', '#2a1f0a')}
                    <span style={{ fontSize: '0.78rem', color: '#6b5a7e' }}>{new Date(u.created_at).toLocaleDateString('fr-FR')}</span>
                    <button onClick={() => openEdit(u)} style={S.btn('#C8A96E')}>Éditer</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher email / prénom..."
                style={{ ...S.input, flex: 1, minWidth: '200px', width: 'auto' }}
              />
              {(['all', 'premium', 'admin', 'free'] as const).map(f => (
                <button key={f} onClick={() => setFilterStatus(f)} style={{
                  padding: '0.5rem 1rem', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem',
                  background: filterStatus === f ? '#C59FD8' : 'transparent',
                  color: filterStatus === f ? '#0A0709' : '#C59FD8',
                  border: '1px solid #C59FD8', fontWeight: filterStatus === f ? '600' : '400'
                }}>
                  {f === 'all' ? 'Tous' : f === 'premium' ? 'Premium' : f === 'admin' ? 'Admins' : 'Gratuit'}
                </button>
              ))}
              <button onClick={() => setModal('add')} style={S.btn('#5DCAA5', true)}>+ Ajouter</button>
            </div>

            <div style={{ ...S.card, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a1f35' }}>
                    {['Prénom', 'Email', 'Analyses/mois', 'Statut', 'Inscrit le', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.72rem', color: '#6b5a7e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#6b5a7e' }}>Chargement...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#6b5a7e' }}>Aucun résultat</td></tr>
                  ) : filtered.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #1a1025' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>{user.prenom || '—'}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#9b8aad' }}>{user.email}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ color: '#C59FD8', fontWeight: '600' }}>{user.analyses_count_month}</span>
                        <button onClick={() => askConfirm(`Réinitialiser le compteur de ${user.prenom || user.email} ?`, () => resetAnalyses(user.id))}
                          style={{ marginLeft: '0.5rem', background: 'transparent', border: 'none', color: '#6b5a7e', cursor: 'pointer', fontSize: '0.75rem' }}>
                          reset
                        </button>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {user.is_admin && badge('Admin', '#C59FD8', '#1a0f2a')}
                          {user.is_premium && badge('Premium', '#C8A96E', '#2a1f0a')}
                          {!user.is_premium && !user.is_admin && badge('Gratuit', '#6b5a7e', '#1a1025')}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#6b5a7e' }}>{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={() => openDetail(user)} style={S.btn('#C59FD8')}>Voir</button>
                          <button onClick={() => openEdit(user)} style={S.btn('#C8A96E')}>Éditer</button>
                          <button onClick={() => { setSelectedUser(user); askConfirm(`Supprimer ${user.prenom || user.email} et toutes ses données ?`, () => deleteUser(user.id)) }}
                            style={S.btn('#E87FA0')}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {tab === 'waitlist' && (
          <div>
            <div style={{ marginBottom: '1rem', color: '#6b5a7e', fontSize: '0.85rem' }}>{waitlist.length} inscrits</div>
            <div style={{ ...S.card, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a1f35' }}>
                    {['Email', 'Source', 'Date', 'Action'].map(h => (
                      <th key={h} style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.72rem', color: '#6b5a7e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {waitlist.map(w => (
                    <tr key={w.id} style={{ borderBottom: '1px solid #1a1025' }}>
                      <td style={{ padding: '0.7rem 1rem', fontSize: '0.85rem' }}>{w.email}</td>
                      <td style={{ padding: '0.7rem 1rem', fontSize: '0.85rem', color: '#9b8aad' }}>{w.source || '—'}</td>
                      <td style={{ padding: '0.7rem 1rem', fontSize: '0.8rem', color: '#6b5a7e' }}>{new Date(w.created_at).toLocaleDateString('fr-FR')}</td>
                      <td style={{ padding: '0.7rem 1rem' }}>
                        <button onClick={() => activatePremium(w.email)} style={S.btn('#C8A96E')}>✦ 30j Premium</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'analyses' && (
          <div>
            <div style={{ marginBottom: '1rem', color: '#6b5a7e', fontSize: '0.85rem' }}>{allAnalyses.length} analyses au total</div>
            <div style={{ ...S.card, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a1f35' }}>
                    {['Type', 'Titre', 'Score', 'Date', 'Action'].map(h => (
                      <th key={h} style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.72rem', color: '#6b5a7e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allAnalyses.slice(0, 100).map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #1a1025' }}>
                      <td style={{ padding: '0.7rem 1rem', fontSize: '0.85rem' }}>{a.type}</td>
                      <td style={{ padding: '0.7rem 1rem', fontSize: '0.85rem', color: '#9b8aad', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titre || '—'}</td>
                      <td style={{ padding: '0.7rem 1rem', color: '#5DCAA5', fontWeight: '600' }}>{a.score}/10</td>
                      <td style={{ padding: '0.7rem 1rem', fontSize: '0.8rem', color: '#6b5a7e' }}>{new Date(a.created_at).toLocaleDateString('fr-FR')}</td>
                      <td style={{ padding: '0.7rem 1rem' }}>
                        <button onClick={() => askConfirm('Supprimer cette analyse ?', () => deleteAnalyse(a.id))} style={S.btn('#E87FA0')}>✕ Suppr.</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modal === 'detail' && selectedUser && (
        <ModalWrapper onClose={() => setModal(null)}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #2a1f35', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: '#C59FD8', margin: 0 }}>{selectedUser.prenom || 'Utilisateur'}</h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#6b5a7e' }}>{selectedUser.email}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => { setModal(null); setTimeout(() => openEdit(selectedUser), 50) }} style={S.btn('#C8A96E')}>Éditer</button>
              <button onClick={() => setModal(null)} style={{ background: 'transparent', border: 'none', color: '#6b5a7e', cursor: 'pointer', fontSize: '1.4rem', lineHeight: '1' }}>×</button>
            </div>
          </div>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {selectedUser.is_admin && badge('Admin', '#C59FD8', '#1a0f2a')}
              {selectedUser.is_premium && badge('Premium', '#C8A96E', '#2a1f0a')}
              {!selectedUser.is_premium && !selectedUser.is_admin && badge('Gratuit', '#6b5a7e', '#1a1025')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#0A0709', borderRadius: '8px', padding: '1rem' }}>
              {([
                ['Teint', selectedUser.teint || '—'],
                ['Peau', selectedUser.peau || '—'],
                ['Analyses ce mois', selectedUser.analyses_count_month],
                ['Premium jusqu\'au', selectedUser.premium_until ? new Date(selectedUser.premium_until).toLocaleDateString('fr-FR') : '—'],
                ['Stripe ID', selectedUser.stripe_customer_id || '—'],
                ['Inscrit le', new Date(selectedUser.created_at).toLocaleDateString('fr-FR')],
              ] as [string, string | number][]).map(([l, v]) => (
                <div key={l}>
                  <div style={S.label}>{l}</div>
                  <div style={{ fontSize: '0.9rem', color: '#e8e0f0', fontWeight: '500', wordBreak: 'break-all' }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => askConfirm(`Réinitialiser le compteur d'analyses ?`, () => resetAnalyses(selectedUser.id))} style={S.btn('#EF9F27')}>Reset compteur</button>
              <button onClick={() => askConfirm(`Supprimer TOUTES les analyses de ${selectedUser.prenom || selectedUser.email} ?`, () => deleteUserAnalyses(selectedUser.id))} style={S.btn('#E87FA0')}>Suppr. toutes analyses</button>
              <button onClick={() => { setModal(null); askConfirm(`Supprimer définitivement ${selectedUser.prenom || selectedUser.email} ?`, () => deleteUser(selectedUser.id)) }} style={{ ...S.btn('#E87FA0'), background: '#2e1a1a' }}>Suppr. compte</button>
            </div>
            <div>
              <div style={{ ...S.label, marginBottom: '0.6rem' }}>Analyses ({userAnalyses.length})</div>
              {userAnalyses.length === 0 ? (
                <div style={{ color: '#6b5a7e', fontSize: '0.85rem' }}>Aucune analyse</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '220px', overflowY: 'auto' }}>
                  {userAnalyses.map(a => (
                    <div key={a.id} style={{ background: '#0A0709', borderRadius: '7px', padding: '0.6rem 0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.85rem' }}>{a.type}</span>
                        <span style={{ color: '#6b5a7e', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{new Date(a.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ color: '#5DCAA5', fontWeight: '600', fontSize: '0.9rem' }}>{a.score}/10</span>
                        <button onClick={() => askConfirm('Supprimer cette analyse ?', () => deleteAnalyse(a.id))} style={{ background: 'transparent', border: 'none', color: '#E87FA0', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ModalWrapper>
      )}

      {modal === 'edit' && selectedUser && (
        <ModalWrapper onClose={() => setModal(null)}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #2a1f35', display: 'flex', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: '#C8A96E', margin: 0 }}>Éditer le profil</h2>
            <button onClick={() => setModal(null)} style={{ background: 'transparent', border: 'none', color: '#6b5a7e', cursor: 'pointer', fontSize: '1.4rem' }}>×</button>
          </div>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { label: 'Prénom', key: 'prenom', type: 'text' },
                { label: 'Teint', key: 'teint', type: 'text' },
                { label: 'Type de peau', key: 'peau', type: 'text' },
                { label: 'Analyses ce mois', key: 'analyses_count_month', type: 'number' },
                { label: 'Premium jusqu\'au', key: 'premium_until', type: 'date' },
              ].map(f => (
                <div key={f.key}>
                  <label style={S.label}>{f.label}</label>
                  <input
                    type={f.type}
                    value={(editForm as any)[f.key]}
                    onChange={e => setEditForm(prev => ({ ...prev, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    style={S.input}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {[
                { label: 'Premium', key: 'is_premium', color: '#C8A96E' },
                { label: 'Admin', key: 'is_admin', color: '#C59FD8' },
              ].map(f => (
                <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={(editForm as any)[f.key]}
                    onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.checked }))}
                    style={{ width: '16px', height: '16px', accentColor: f.color }}
                  />
                  <span style={{ color: f.color, fontWeight: '600', fontSize: '0.9rem' }}>{f.label}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={() => setModal(null)} style={S.btn('#6b5a7e')}>Annuler</button>
              <button onClick={saveEdit} disabled={saving} style={S.btn('#5DCAA5', true)}>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {modal === 'add' && (
        <ModalWrapper onClose={() => setModal(null)}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #2a1f35', display: 'flex', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: '#5DCAA5', margin: 0 }}>Ajouter un utilisateur</h2>
            <button onClick={() => setModal(null)} style={{ background: 'transparent', border: 'none', color: '#6b5a7e', cursor: 'pointer', fontSize: '1.4rem' }}>×</button>
          </div>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {[
              { label: 'Email *', key: 'email', type: 'email' },
              { label: 'Prénom', key: 'prenom', type: 'text' },
              { label: 'Mot de passe *', key: 'password', type: 'password' },
            ].map(f => (
              <div key={f.key}>
                <label style={S.label}>{f.label}</label>
                <input type={f.type} value={(addForm as any)[f.key]}
                  onChange={e => setAddForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={S.input} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={() => setModal(null)} style={S.btn('#6b5a7e')}>Annuler</button>
              <button onClick={addUser} disabled={saving} style={S.btn('#5DCAA5', true)}>{saving ? 'Création...' : 'Créer'}</button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {modal === 'confirm' && confirmAction && (
        <ModalWrapper onClose={() => setModal(null)} small>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
            <p style={{ color: '#e8e0f0', marginBottom: '1.5rem', lineHeight: '1.5' }}>{confirmAction.label}</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setModal(null)} style={S.btn('#6b5a7e')}>Annuler</button>
              <button onClick={async () => { setModal(null); await confirmAction.fn() }} style={S.btn('#E87FA0', true)}>Confirmer</button>
            </div>
          </div>
        </ModalWrapper>
      )}
    </div>
  )
}

function ModalWrapper({ children, onClose, small }: { children: React.ReactNode; onClose: () => void; small?: boolean }) {
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,7,9,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
      <div style={{
        background: '#120D1A', border: '1px solid #2a1f35', borderRadius: '16px',
        width: '100%', maxWidth: small ? '420px' : '600px',
        maxHeight: '90vh', overflow: 'auto'
      }}>
        {children}
      </div>
    </div>
  )
}
