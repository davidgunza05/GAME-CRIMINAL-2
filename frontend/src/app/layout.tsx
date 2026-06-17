import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import Providers from '@/components/layout/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Crime Game', template: '%s — Crime Game' },
  description: 'Plataforma imersiva de investigação criminal. Resolve casos, descobre culpados, domina o crime.',
  keywords: ['crime', 'jogo', 'investigação', 'mistério', 'murder mystery', 'escape room'],
  themeColor: '#0A0A0F',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className="dark">
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#111116',
                color: '#F0F0EB',
                border: '1px solid #222228',
                borderRadius: '6px',
                fontFamily: 'Georgia, serif',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#C0392B', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
