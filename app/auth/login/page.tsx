'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn, Mail, ArrowRight } from 'lucide-react'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.5-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.2 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.7 35.7 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C41.7 35.7 44 30.2 44 24c0-1.2-.1-2.5-.4-3.5z"/>
    </svg>
  )
}

type LoginMode = 'password' | 'otp-request' | 'otp-verify'

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://topgeecapital.com/auth/callback' },
    })
  }

  // Standard password login
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill in all fields')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      // If email not confirmed, send OTP and redirect to verify
      if (error.message.toLowerCase().includes('email not confirmed')) {
        toast('Please verify your email first.', { icon: '📧' })
        await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}&type=login`)
        return
      }
      return toast.error(error.message)
    }
    toast.success('Welcome back!')
    router.push('/dashboard')
    router.refresh()
  }

  // Send OTP for magic code login
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return toast.error('Enter your email address')
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })
    setLoading(false)
    if (error) return toast.error(error.message)
    toast.success('Code sent! Check your email.')
    router.push(`/auth/verify-email?email=${encodeURIComponent(email)}&type=login`)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <img src='/logo.jpeg' alt='Topgee Capital' style={{ width: '60px', height: '60px', borderRadius: '14px', objectFit: 'cover' }} />
            <span style={{
              fontSize: '22px', fontWeight: 800,
              background: 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Topgee Capital</span>
          </Link>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>Sign in to your account</p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', background: 'var(--bg-card)',
          border: '1px solid var(--border)', borderRadius: '12px',
          padding: '4px', marginBottom: '16px', gap: '4px',
        }}>
          {[
            { key: 'password', label: '🔑 Password' },
            { key: 'otp-request', label: '📧 Email Code' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setMode(tab.key as LoginMode)}
              style={{
                flex: 1, padding: '10px 8px', border: 'none', borderRadius: '8px',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                background: mode === tab.key ? 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))' : 'transparent',
                color: mode === tab.key ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '32px',
        }}>
          {/* PASSWORD LOGIN */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordLogin}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  Email Address
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '15px', outline: 'none',
                  }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                    style={{
                      width: '100%', padding: '12px 48px 12px 16px',
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      borderRadius: '8px', color: 'var(--text-primary)', fontSize: '15px', outline: 'none',
                    }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex',
                  }}>
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px',
                background: loading ? '#4a4a6a' : 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))',
                border: 'none', borderRadius: '8px', color: 'white',
                fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                {loading ? 'Signing in...' : <><LogIn size={18} /> Sign In</>}
              </button>
            </form>
          )}

          {/* OTP / MAGIC CODE LOGIN */}
          {mode === 'otp-request' && (
            <form onSubmit={handleSendOtp}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                }}>
                  <Mail size={24} color="var(--accent-green)" />
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  We&apos;ll send a 6-digit code to your email. No password needed.
                </p>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  Email Address
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required autoFocus
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '15px', outline: 'none',
                  }}
                />
              </div>
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px',
                background: loading ? '#4a4a6a' : 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))',
                border: 'none', borderRadius: '8px', color: 'white',
                fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                {loading ? 'Sending...' : <><ArrowRight size={18} /> Send Code</>}
              </button>
            </form>
          )}

          {/* Divider + Google */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>
          <button type="button" onClick={handleGoogle} style={{
            width: '100%', padding: '12px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '8px', color: 'var(--text-primary)',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          }}>
            <GoogleIcon /> Continue with Google
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" style={{ color: 'var(--accent-green)', fontWeight: 600, textDecoration: 'none' }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
