'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import './landing.css'

export default function LandingPage() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistDone, setWaitlistDone] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.1 })
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  async function submitWaitlist(e: React.FormEvent) {
    e.preventDefault()
    try {
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()
      await supabase.from('waitlist').insert({ email: waitlistEmail })
    } catch (_) {}
    setWaitlistDone(true)
  }

  const features = [
    { n:'01', badge:'free', title:'Analyse visage temps réel', desc:'MediaPipe détecte 468 points de ton visage instantanément. Symétrie, zones, scores.' },
    { n:'02', badge:'free', title:'Scan produit', desc:'Scanne le code-barres d\'un produit cosmétique. NYLVA vérifie la compatibilité avec ton profil teint.' },
    { n:'03', badge:'premium', title:'Feedback IA détaillé', desc:'Claude Vision analyse ta photo et génère un rapport précis zone par zone avec corrections personnalisées.' },
    { n:'04', badge:'free', title:'Profil beauté', desc:'Renseigne tes marques, teintes et type de peau. Toutes les analyses sont personnalisées à ton profil.' },
    { n:'05', badge:'free', title:'Catalogue marques', desc:'12 grandes marques, des centaines de références. Compatibilité calculée selon ton profil.' },
    { n:'06', badge:'premium', title:'Check avant de sortir', desc:'Feu vert ou corrections précises en 30 secondes. L\'IA dit exactement ce qui ne va pas.' },
  ]

  return (
    <>
      <nav className={scrolled ? 'scrolled' : ''}>
        <a href="#" className="nav-logo">N<em>Y</em>LVA</a>
        <div className="nav-links">
          <a href="#features">Fonctionnalités</a>
          <a href="/pricing">Tarifs</a>
          <button className="nav-cta" onClick={() => router.push('/auth')}>Commencer</button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grain" />
        <div className="hero-content">
          <div className="eyebrow reveal">Beauty Intelligence · France</div>
          <h1 className="reveal reveal-d1">L'app qui dit<br />la <em>vérité</em></h1>
          <p className="hero-sub reveal reveal-d2">NYLVA analyse ton maquillage en temps réel. Pas pour te flatter — pour que tu sois au top.</p>
          <div className="hero-actions reveal reveal-d3">
            <button className="btn-primary" onClick={() => router.push('/auth')}>Essayer gratuitement</button>
            <a href="#features" className="btn-ghost">Découvrir</a>
          </div>
        </div>
      </section>

      <div className="stats reveal">
        <div className="stat"><div className="stat-n">94<em>%</em></div><div className="stat-l">Précision analyse</div></div>
        <div className="stat"><div className="stat-n"><em>&lt;</em>3s</div><div className="stat-l">Temps d'analyse</div></div>
        <div className="stat"><div className="stat-n">12<em>+</em></div><div className="stat-l">Zones analysées</div></div>
        <div className="stat"><div className="stat-n">0<em>€</em></div><div className="stat-l">Pour commencer</div></div>
      </div>

      <section className="features" id="features">
        <div className="section-eyebrow reveal">Ce que NYLVA fait</div>
        <h2 className="reveal">Six fonctionnalités.<br />Une <em>promesse</em>.</h2>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={f.n} className={`feat reveal${i % 3 === 1 ? ' reveal-d1' : i % 3 === 2 ? ' reveal-d2' : ''}`}>
              <div className="feat-n">{f.n}</div>
              <div className={f.badge === 'free' ? 'free-badge' : 'premium-badge'}>{f.badge === 'free' ? 'GRATUIT' : 'PREMIUM'}</div>
              <h3 className="feat-title">{f.title}</h3>
              <p className="feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pricing" id="pricing">
        <div className="section-eyebrow reveal">Tarifs</div>
        <h2 className="reveal">Simple et <em>transparent</em></h2>
        <p className="reveal" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 14, marginTop: -8, marginBottom: 32, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.55 }}>
          Annulable à tout moment, sans engagement.
        </p>
        <div className="pricing-grid">
          <div className="price-card reveal">
            <div className="price-label">Gratuit</div>
            <div className="price-amount">0<em>€</em></div>
            <div className="price-period">pour toujours</div>
            <ul className="price-features">
              <li>3 analyses IA / mois</li>
              <li>Miroir visage MediaPipe</li>
              <li>Catalogue marques (consultation)</li>
              <li>Profil beauté complet</li>
            </ul>
            <button className="btn-ghost btn-full" onClick={() => router.push('/auth')}>Commencer</button>
          </div>
          <div className="price-card reveal reveal-d1">
            <div className="price-label">Essentiel</div>
            <div className="price-amount">6,99<em>€</em></div>
            <div className="price-period">par mois · ou 59€/an (−30%)</div>
            <ul className="price-features">
              <li>Analyses IA illimitées</li>
              <li>Saison chromatique</li>
              <li>Coach IA texte (30 messages/jour)</li>
              <li>Recommandations marques personnalisées</li>
              <li>Historique 3 mois</li>
            </ul>
            <button className="btn-ghost btn-full" onClick={() => router.push('/pricing')}>Choisir Essentiel</button>
          </div>
          <div className="price-card featured reveal reveal-d2">
            <div className="price-label">Signature</div>
            <div className="price-amount">14,99<em>€</em></div>
            <div className="price-period">par mois · ou 129€/an (−28%)</div>
            <ul className="price-features">
              <li>Tout l'Essentiel</li>
              <li>Coach IA vocal (voix naturelle)</li>
              <li>Miroir IA temps réel</li>
              <li>Analyse morphologie du visage</li>
              <li>Historique illimité + progression</li>
              <li>Saison chromatique illimitée</li>
            </ul>
            <button className="btn-primary btn-full" onClick={() => router.push('/pricing')}>7 jours d'essai gratuit</button>
          </div>
        </div>
      </section>

      <section className="waitlist-section" id="waitlist">
        <div className="waitlist-inner">
          <div className="section-eyebrow reveal">Accès anticipé</div>
          <h2 className="reveal waitlist-h2">Sois parmi les<br /><em>premiers·ères</em></h2>
          <p className="waitlist-sub reveal">Rejoins la liste et reçois 1 mois d'abonnement Essentiel offert au lancement.</p>
          <div className="reveal reveal-d1">
            {waitlistDone ? (
              <div className="success-msg">Tu es sur la liste ! On t'envoie ton accès dès l'ouverture.</div>
            ) : (
              <form className="email-form" onSubmit={submitWaitlist}>
                <input type="email" className="email-input" placeholder="ton@email.com" required value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)} />
                <button type="submit" className="email-submit">Rejoindre</button>
              </form>
            )}
            <p className="waitlist-note">Aucune carte bancaire · RGPD compliant · Désabonnement en 1 clic</p>
          </div>
          <div className="waitlist-cta reveal reveal-d2">
            <button className="btn-primary" onClick={() => router.push('/auth')}>
              Tester l'app maintenant — gratuit
            </button>
            <p className="waitlist-beta">BETA · Fonctionne dans le navigateur · Aucune installation</p>
          </div>
        </div>
      </section>

      <footer>
        <span className="footer-logo">NYLVA</span>
        <span className="footer-copy">2025 NYLVA · OCCIMAITRISE · Montauban, France</span>
        <div className="footer-links">
          <a href="mailto:contact@nylva.fr">Contact</a>
          <a href="/pricing">Tarifs</a>
          <a href="#features">Fonctionnalités</a>
        </div>
      </footer>
    </>
  )
}
