'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

const MARQUES = [
  { id: 1, nom: "L'Oréal Paris", segment: 'Grand public', gamme: 'Infaillible, True Match', couleur: '#C8A96E', compatible: true },
  { id: 2, nom: 'Maybelline', segment: 'Grand public', gamme: 'Fit Me, SuperStay', couleur: '#C59FD8', compatible: true },
  { id: 3, nom: 'NYX', segment: 'Grand public', gamme: 'Stay Matte, Born To Glow', couleur: '#5DCAA5', compatible: true },
  { id: 4, nom: 'Lancôme', segment: 'Luxe', gamme: 'Teint Idole, Absolue', couleur: '#E87FA0', compatible: true },
  { id: 5, nom: 'Dior', segment: 'Luxe', gamme: 'Diorskin Forever, Rouge Dior', couleur: '#C8A96E', compatible: false },
  { id: 6, nom: 'Chanel', segment: 'Luxe', gamme: 'Les Beiges, Vitalumière', couleur: '#9B8FA6', compatible: true },
  { id: 7, nom: 'NARS', segment: 'Prestige', gamme: 'Sheer Glow, Radiant Longwear', couleur: '#C59FD8', compatible: true },
  { id: 8, nom: 'MAC', segment: 'Prestige', gamme: 'Studio Fix, Pro Longwear', couleur: '#EF9F27', compatible: false },
  { id: 9, nom: 'Urban Decay', segment: 'Prestige', gamme: 'All Nighter, Stay Naked', couleur: '#5DCAA5', compatible: true },
  { id: 10, nom: 'Charlotte Tilbury', segment: 'Luxe', gamme: 'Airbrush Flawless, Pillow Talk', couleur: '#E87FA0', compatible: true },
  { id: 11, nom: 'Fenty Beauty', segment: 'Prestige', gamme: 'Pro Filt\'r, Gloss Bomb', couleur: '#C8A96E', compatible: true },
  { id: 12, nom: 'Too Faced', segment: 'Prestige', gamme: 'Born This Way, Better Than Sex', couleur: '#C59FD8', compatible: false },
]

const SEGMENTS = ['Tous', 'Grand public', 'Prestige', 'Luxe']

export default function PageMarques() {
  const [search, setSearch]   = useState('')
  const [segment, setSegment] = useState('Tous')
  const [selected, setSelected] = useState<typeof MARQUES[0] | null>(null)

  const filtered = MARQUES.filter(m => {
    const matchSearch  = m.nom.toLowerCase().includes(search.toLowerCase())
    const matchSegment = segment === 'Tous' || m.segment === segment
    return matchSearch && matchSegment
  })

  if (selected) return (
    <div style={{ padding: '20px', maxWidth: 480, margin: '0 auto' }}>
      <button
        onClick={() => setSelected(null)}
        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, marginBottom: 20, padding: 0 }}
      >
        ← Retour
      </button>

      <div className="nylva-card" style={{ marginBottom: 16, borderColor: selected.compatible ? 'rgba(93,202,165,0.3)' : 'rgba(232,127,160,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 26 }}>{selected.nom}</h2>
          <span style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            background: selected.compatible ? 'rgba(93,202,165,0.12)' : 'rgba(232,127,160,0.12)',
            color: selected.compatible ? 'var(--green)' : 'var(--red)',
          }}>
            {selected.compatible ? '✓ Compatible' : '✗ Non recommandé'}
          </span>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 4 }}>{selected.segment}</p>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>Gammes : {selected.gamme}</p>
      </div>

      <div className="nylva-card">
        <p style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Compatibilité profil
        </p>
        <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>
          {selected.compatible
            ? `${selected.nom} est compatible avec ton profil beauté. Les teintes de la gamme ${selected.gamme.split(',')[0]} correspondent à tes sous-tons.`
            : `${selected.nom} présente des gammes de teintes moins adaptées à ton profil. Les formules peuvent accentuer certaines imperfections selon ton type de peau.`
          }
        </p>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '20px', maxWidth: 480, margin: '0 auto' }}>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 28, marginBottom: 4 }}>
          Marques
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Compatibilité calculée selon ton profil</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input
          className="nylva-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une marque"
          style={{ paddingLeft: 40 }}
        />
      </div>

      {/* Filtres segment */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {SEGMENTS.map(s => (
          <button
            key={s}
            onClick={() => setSegment(s)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
              background: segment === s ? 'var(--accent)' : 'var(--bg2)',
              color: segment === s ? 'var(--bg)' : 'var(--text2)',
              border: segment === s ? 'none' : '1px solid var(--border)',
              fontWeight: segment === s ? 600 : 400,
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(m => (
          <div
            key={m.id}
            className="nylva-card"
            onClick={() => setSelected(m)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.couleur + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: m.couleur }} />
              </div>
              <div>
                <p style={{ fontWeight: 500, fontSize: 14 }}>{m.nom}</p>
                <p style={{ color: 'var(--muted)', fontSize: 12 }}>{m.segment}</p>
              </div>
            </div>
            <span style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 500,
              background: m.compatible ? 'rgba(93,202,165,0.12)' : 'rgba(232,127,160,0.12)',
              color: m.compatible ? 'var(--green)' : 'var(--red)',
            }}>
              {m.compatible ? '✓ OK' : '✗'}
            </span>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 40, fontSize: 14 }}>Aucune marque trouvée</p>
      )}
    </div>
  )
}
