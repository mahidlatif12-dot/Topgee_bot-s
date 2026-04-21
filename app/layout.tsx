import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Topgee Capital — Professional Gold Trading',
  description: 'Professional Gold (XAUUSD) trading platform. Transparent returns, real withdrawals, no hidden fees.',
  icons: {
    icon: '/logo.jpeg',
    apple: '/logo.jpeg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Prevent theme flash on load */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var t = localStorage.getItem('tc-theme') || 'dark';
            document.documentElement.setAttribute('data-theme', t);
          })()
        ` }} />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e1e1e',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 500,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#1e1e1e' },
              style: { borderLeft: '3px solid #10b981' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#1e1e1e' },
              style: { borderLeft: '3px solid #f87171' },
            },
          }}
        />
      </body>
    </html>
  )
}
