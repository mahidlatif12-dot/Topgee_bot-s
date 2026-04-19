import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Topgee Capital — Professional Forex & Gold Trading',
  description: 'Professional automated trading platform for Forex & Gold (XAUUSD)',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#16161f',
              color: '#f0f0f5',
              border: '1px solid #2a2a3a',
            },
            success: {
              iconTheme: { primary: '#00d4a0', secondary: '#16161f' },
            },
            error: {
              iconTheme: { primary: '#ff4444', secondary: '#16161f' },
            },
          }}
        />
      </body>
    </html>
  )
}
