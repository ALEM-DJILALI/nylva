import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-cormorant',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm',
})

export const metadata: Metadata = {
  title: 'NYLVA — Beauty Intelligence',
  description: 'Analyse beauté personnalisée par intelligence artificielle. Teint, peau, morphologie.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NYLVA',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192' }],
  },
  openGraph: {
    title: 'NYLVA — Beauty Intelligence',
    description: 'Analyse beauté personnalisée par IA',
    url: 'https://nylva.vercel.app',
    siteName: 'NYLVA',
    images: [{ url: '/icons/og-image.png', width: 1200, height: 630 }],
    locale: 'fr_FR',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#FBF7F4',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${dmSans.variable}`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#FBF7F4" />
        <meta name="msapplication-TileImage" content="/icons/icon-192.png" />
      </head>
      <body style={{ margin: 0, background: 'var(--bg)' }}>
        {children}
      </body>
    </html>
  )
}
