'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Camera, Sparkles, MessageCircle, Palette, User, Download, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const tabs = [
  { href: '/app',           label: 'Analyse',  icon: Camera },
  { href: '/app/miroir',    label: 'Miroir IA', icon: Sparkles },
  { href: '/app/coach',     label: 'Coach',    icon: MessageCircle },
  { href: '/app/saison',    label: 'Saison',   icon: Palette },
  { href: '/app/profil',    label: 'Profil',   icon: User },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner]         = useState(false)
  const [isIOS, setIsIOS]                   = useState(false)
  const [isInstalled, setIsInstalled]       = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) { setIsInstalled(true); return }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.navigator as any).standalone
    setIsIOS(ios)
    if (ios) { setShowBanner(true); return }
    const h = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); setShowBanner(true) }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') { setShowBanner(false); setIsInstalled(true) }
    setDeferredPrompt(null)
  }

  return (
    <>
      <header className="app-header" style={{ justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 22, letterSpacing: 3, color: 'var(--text)' }}>
          N<span style={{ color: 'var(--accent)' }}>Y</span>LVA
        </span>
        {!isInstalled && (
          <button onClick={isIOS ? () => setShowBanner(true) : install}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(196,117,138,0.1)', border: '1px solid rgba(196,117,138,0.28)', color: 'var(--accent)', borderRadius: 20, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>
            <Download size={12} /> Installer
          </button>
        )}
      </header>

      {showBanner && isIOS && (
        <div style={{ position: 'fixed', bottom: 80, left: 12, right: 12, zIndex: 50, background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 16px', boxShadow: 'var(--shadow-lg)' }}>
          <button onClick={() => setShowBanner(false)} style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 26 }}>📲</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Installer NYLVA</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                Safari → <strong style={{ color: 'var(--accent)' }}>Partager</strong> → <strong style={{ color: 'var(--accent)' }}>"Sur l'écran d'accueil"</strong>
              </div>
            </div>
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
