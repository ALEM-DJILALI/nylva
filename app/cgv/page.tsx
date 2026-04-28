import Link from 'next/link'
export const metadata = { title: 'CGV — NYLVA' }
export default function P() {
  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'40px 20px', fontFamily:'DM Sans,sans-serif', color:'#1C1410' }}>
      <div style={{ marginBottom:32 }}><Link href="/" style={{ color:'#C4758A', fontSize:13, textDecoration:'none' }}>← Retour</Link></div>
      <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:36, marginBottom:8 }}>Conditions Générales de Vente</h1>
      <p style={{ color:'#9B8070', fontSize:13, marginBottom:40 }}>Dernière mise à jour : avril 2025</p>
      
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, marginBottom:12, color:'#1C1410' }}>1. Objet</h2>
        <p style={{{{fontSize:14,lineHeight:1.8,color:"#4A3728"}}}}>CGV régissant les ventes d'abonnements NYLVA par OCCIMAITRISE (Djilali Alem, Montauban 82000).</p>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, marginBottom:12, color:'#1C1410' }}>2. Service</h2>
        <ul style={{{{fontSize:14,lineHeight:2,color:"#4A3728",paddingLeft:20}}}}><li>Gratuit : 3 analyses/mois</li><li>Premium : analyses illimitées + Coach IA + Saison + Historique — 9€/mois</li></ul>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, marginBottom:12, color:'#1C1410' }}>3. Prix</h2>
        <p style={{{{fontSize:14,lineHeight:1.8,color:"#4A3728"}}}}>9€ TTC/mois prélevé via Stripe. TVA française applicable.</p>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, marginBottom:12, color:'#1C1410' }}>4. Résiliation</h2>
        <p style={{{{fontSize:14,lineHeight:1.8,color:"#4A3728"}}}}>Sans engagement. Résiliation depuis Profil ou <a href="mailto:contact@nylva.fr" style={{{{color:"#C4758A"}}}}>contact@nylva.fr</a>. Effet fin de période.</p>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, marginBottom:12, color:'#1C1410' }}>5. Droit applicable</h2>
        <p style={{{{fontSize:14,lineHeight:1.8,color:"#4A3728"}}}}>Droit français. Tribunal de Montauban (82). Médiation UE : ec.europa.eu/consumers/odr</p>
      </section>
    </div>
  )
}
