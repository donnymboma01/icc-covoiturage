import { Metadata } from 'next'

export const metadata: Metadata = {
  manifest: '/manifest.json',
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "ICC Covoiturage",
  },
  icons: {
    apple: '/icon-192x192.png',
  }
}
