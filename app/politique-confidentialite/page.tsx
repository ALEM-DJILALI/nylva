import Link from 'next/link'
export const metadata = { title: 'Confidentialité — NYLVA' }
export default function P() {
  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'40px 20px', fontFamily:'DM Sans,sans-serif', color:'#1C1410' }}>
      <div style={{ marginBottom:32 }}><Link href="/" style={{ color:'#C4758A', fontSize:13, textDecoration:'none' }}>← Retour</Link></div>
      <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:36, marginBottom:8 }}>Politique de confidentialité</h1>
      <p style={{ color:'#9B8070', fontSize:13, marginBottom:40 }}>Dernière mise à jour : avril 2025</p>
      
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, marginBottom:12, color:'#1C1410' }}>1. Responsable</h2>
        <p style={{{{fontSize:14,lineHeight:1.8,color:"#4A3728"}}}}>OCCIMAITRISE — Djilali Alem, Montauban 82000. <a href="mailto:contact@nylva.fr" style={{{{color:"#C4758A"}}}}>contact@nylva.fr</a></p>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, marginBottom:12, color:'#1C1410' }}>2. Données collectées</h2>
        <ul style={{{{fontSize:14,lineHeight:2,color:"#4A3728",paddingLeft:20}}}}><li>Compte : email, prénom</li><li>Profil beauté : teint, peau, sous-tons, saison, produits</li><li>Photos : traitées en temps réel, non stockées durablement</li><li>Paiement : géré par Stripe uniquement</li><li>Miroir IA : traitement 100% local, aucune donnée envoyée</li></ul>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, marginBottom:12, color:'#1C1410' }}>3. Sous-traitants</h2>
        <ul style={{{{fontSize:14,lineHeight:2,color:"#4A3728",paddingLeft:20}}}}><li>Supabase (BDD, EU)</li><li>Vercel (hébergement, USA — SCC)</li><li>Anthropic Claude (analyse IA, USA — SCC)</li><li>Stripe (paiement, USA — SCC)</li></ul>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, marginBottom:12, color:'#1C1410' }}>4. Vos droits</h2>
        <p style={{{{fontSize:14,lineHeight:1.8,color:"#4A3728"}}}}>Accès, rectification, effacement : <a href="mailto:contact@nylva.fr" style={{{{color:"#C4758A"}}}}>contact@nylva.fr</a>. Litige : <a href="https://www.cnil.fr" target="_blank" rel="noopener" style={{{{color:"#C4758A"}}}}>CNIL</a></p>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, marginBottom:12, color:'#1C1410' }}>5. Cookies</h2>
        <p style={{{{fontSize:14,lineHeight:1.8,color:"#4A3728"}}}}>Uniquement cookies techniques d'authentification Supabase. Aucun cookie publicitaire.</p>
      </section>
    </div>
  )
}
