import Link from 'next/link'

export const metadata = { title: 'Mentions légales — NYLVA' }

export default function PageMentionsLegales() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px', fontFamily: 'DM Sans, sans-serif', color: '#1C1410' }}>
      <div style={{ marginBottom: 32 }}>
        <Link href="/" style={{ color: '#C4758A', fontSize: 13, textDecoration: 'none' }}>← Retour</Link>
      </div>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 36, marginBottom: 8 }}>Mentions légales</h1>
      <p style={{ color: '#9B8070', fontSize: 13, marginBottom: 40 }}>Dernière mise à jour : avril 2025</p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 12 }}>Éditeur</h2>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: '#4A3728' }}>NYLVA est édité par <strong>OCCIMAITRISE</strong> — Djilali Alem, Montauban (82000), France.<br/>Contact : <a href="mailto:contact@nylva.fr" style={{ color: '#C4758A' }}>contact@nylva.fr</a></p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 12 }}>Hébergement</h2>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: '#4A3728' }}>Vercel Inc. — 440 N Barranca Ave, Covina CA 91723, USA.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 12 }}>Propriété intellectuelle</h2>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: '#4A3728' }}>Tout le contenu NYLVA appartient à OCCIMAITRISE. Reproduction interdite sans autorisation.</p>
      </section>

      <section>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 12 }}>Données personnelles</h2>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: '#4A3728' }}>Droits RGPD : <a href="mailto:contact@nylva.fr" style={{ color: '#C4758A' }}>contact@nylva.fr</a></p>
      </section>
    </div>
  )
}
