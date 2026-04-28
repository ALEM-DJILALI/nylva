import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NYLVA — Beauty Intelligence',
    short_name: 'NYLVA',
    description: 'Analyse beauté personnalisée par IA',
    start_url: '/app',
    display: 'standalone',
    background_color: '#FBF7F4',
    theme_color: '#C4758A',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
