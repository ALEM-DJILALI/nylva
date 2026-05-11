'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Camera, Sparkles, MessageCircle, Tag, User, Download, X, Palette, History } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'

const tabs = [
  { href: '/app',           label: 'Analyse',  icon: Camera },
  { href: '/app/miroir',    label: 'Miroir',   icon: Sparkles },
  { href: '/app/saison',    label: 'Saison',   icon: Palette },
  { href: '/app/coach',     label: 'Coach',    icon: MessageCircle },
  { href: '/app/marques',   label: 'Marques',  icon: Tag },
  { href: '/app/historique',label: 'Historique', icon: History },
  { href: '/app/profil',    label: 'Profil',   icon: User },
]

type InstallState =
  | 'unknown'        // chargement initial
  | 'installed'      // app déjà installée (standalone)
  | 'ios-installable'// Safari iOS — ajout manuel via partage
  | 'android-ready'  // beforeinstallprompt reçu, prêt à installer
  | 'android-waiting'// Android/Chrome mais event pas encore reçu
  | 'unsupported'    // navigateur ne supporte pas la PWA

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [installState, setInstallState] = useState<InstallState>('unknown')
  const [showIOSBanner, setShowIOSBanner] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  // ──── Service Worker registration ────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    // Enregistrement après load pour ne pas ralentir la première peinture
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .catch(err => console.warn('SW register failed:', err))
    }
    if (document.readyState === 'complete') onLoad()
    else window.addEventListener('load', onLoad, { once: true })
    return () => window.removeEventListener('load', onLoad)
  }, [])

  // ──── Détection état installation ────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return

    const ua = navigator.userAgent
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    if (isStandalone) {
      setInstallState('installed')
      return
    }

    const isIOS = /iphone|ipad|ipod/i.test(ua)
    const isAndroid = /android/i.test(ua)
    const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua)

    if (isIOS) {
      setInstallState('ios-installable')
      return
    }

    // Android / Chrome desktop : on attend l'event beforeinstallprompt
    if (isAndroid || (!isSafari && 'BeforeInstallPromptEvent' in window)) {
      setInstallState('android-waiting')
    } else {
      setInstallState('unsupported')
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setInstallState('android-ready')
    }
    const onInstalled = () => {
      setInstallState('installed')
      setDeferredPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const handleInstallClick = useCallback(async () => {
    if (installState === 'android-ready' && deferredPrompt) {
      try {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
          setInstallState('installed')
        }
        setDeferredPrompt(null)
      } catch (err) {
        setShowHelp(true)
      }
      return
    }

    if (installState === 'ios-installable') {
      setShowIOSBanner(true)
      return
    }

    // android-waiting ou unsupported → ouvre l'aide
    setShowHelp(true)
  }, [deferredPrompt, installState])

  const showInstallBtn = installState !== 'installed' && installState !== 'unknown'

  return (
    <>
      <header className="app-header" style={{ justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 22, letterSpacing: 3, color: 'var(--text)' }}>
          N<span style={{ color: 'var(--accent)' }}>Y</span>LVA
        </span>
        {showInstallBtn && (
          <button
            onClick={handleInstallClick}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(196,117,138,0.1)',
              border: '1px solid rgba(196,117,138,0.28)',
              color: 'var(--accent)',
              borderRadius: 20, padding: '5px 12px',
              fontSize: 12, cursor: 'pointer',
            }}
          >
            <Download size={12} /> Installer
          </button>
        )}
      </header>

      {/* Banner iOS — instructions Safari "Sur l'écran d'accueil" */}
      {showIOSBanner && (
        <div style={{
          position: 'fixed', bottom: 80, left: 12, right: 12, zIndex: 50,
          background: '#FFFFFF', border: '1px solid var(--border)',
          borderRadius: 16, padding: '14px 16px', boxShadow: 'var(--shadow-lg)',
        }}>
          <button onClick={() => setShowIOSBanner(false)} style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 26 }}>📲</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Installer NYLVA sur iPhone</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                1. Ouvre cette page dans <strong>Safari</strong> (pas Chrome).<br />
                2. Touche le bouton <strong style={{ color: 'var(--accent)' }}>Partager</strong> ⬆️ en bas.<br />
                3. Choisis <strong style={{ color: 'var(--accent)' }}>« Sur l'écran d'accueil »</strong>.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal aide générique pour cas non-installable */}
      {showHelp && (
        <div
          onClick={() => setShowHelp(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(20,10,5,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#FFF', borderRadius: 20, padding: 24, maxWidth: 360, width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative',
            }}
          >
            <button onClick={() => setShowHelp(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
              <X size={18} />
            </button>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📲</div>
            <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 400, fontSize: 22, marginBottom: 10 }}>
              Installer NYLVA
            </h3>
            {installState === 'android-waiting' && (
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 14 }}>
                L'installation n'est pas encore disponible. Reste quelques secondes sur la page, puis réessaie. Si rien ne se passe :
                <br /><br />
                Sur <strong>Chrome Android</strong> : touche le menu <strong>⋮</strong> puis <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.
              </p>
            )}
            {installState === 'unsupported' && (
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 14 }}>
                Ton navigateur ne supporte pas l'installation. Ouvre la page dans <strong>Chrome</strong> (Android) ou <strong>Safari</strong> (iPhone) pour pouvoir installer NYLVA sur ton écran d'accueil.
              </p>
            )}
            <button
              onClick={() => setShowHelp(false)}
              className="nylva-btn-primary"
              style={{ width: '100%' }}
            >
              Compris
            </button>
          </div>
        </div>
      )}

      <main className="app-content">{children}</main>

      <nav className="tab-bar">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === '/app' ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={`tab-item ${active ? 'active' : ''}`}>
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
