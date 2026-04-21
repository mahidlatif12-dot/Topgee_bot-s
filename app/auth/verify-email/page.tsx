'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react'

function VerifyEmailContent() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const type = searchParams.get('type') || 'signup' // 'signup' or 'login'
  const supabase = createClient()

  useEffect(() => {
    if (!email) {
      router.push('/auth/login')
      return
    }
    // Start countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [email, router])

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    const code = otp.join('')
    if (code.length !== 6) return toast.error('Please enter the 6-digit code')

    setLoading(true)
    const otpType = type === 'signup' ? 'email' : 'email'
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: otpType as 'email',
    })
    setLoading(false)

    if (error) {
      toast.error(error.message || 'Invalid or expired code')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
      return
    }

    toast.success(type === 'signup' ? '✅ Email verified! Welcome to Topgee Capital.' : '✅ Signed in successfully!')
    router.push('/dashboard')
    router.refresh()
  }

  async function handleResend() {
    setResending(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })
    setResending(false)

    if (error) {
      toast.error('Failed to resend code: ' + error.message)
      return
    }

    toast.success('New code sent! Check your email.')
    setOtp(['', '', '', '', '', ''])
    setCanResend(false)
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); setCanResend(true); return 0 }
        return prev - 1
      })
    }, 1000)
    inputRefs.current[0]?.focus()
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
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '32px',
          textAlign: 'center',
        }}>
          {/* Icon */}
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Mail size={32} color="var(--accent-green)" />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Check your email
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '8px' }}>
            We sent a 6-digit verification code to
          </p>
          <p style={{ color: 'var(--accent-green)', fontWeight: 700, fontSize: '15px', marginBottom: '28px' }}>
            {email}
          </p>

          <form onSubmit={handleVerify}>
            {/* OTP Input boxes */}
            <style>{`
              .otp-box { width: 48px; height: 56px; font-size: 22px; }
              @media (max-width: 400px) { .otp-box { width: 38px; height: 48px; font-size: 18px; } }
            `}</style>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}
              onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  autoFocus={i === 0}
                  className="otp-box"
                  style={{
                    textAlign: 'center', fontWeight: 800,
                    background: digit ? 'rgba(16,185,129,0.1)' : 'var(--bg-secondary)',
                    border: digit ? '2px solid var(--accent-green)' : '1px solid var(--border)',
                    borderRadius: '10px',
                    color: digit ? 'var(--accent-green)' : 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.15s',
                    caretColor: 'var(--accent-green)',
                  }}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              style={{
                width: '100%', padding: '13px',
                background: (loading || otp.join('').length !== 6) ? '#4a4a6a' : 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))',
                border: 'none', borderRadius: '8px', color: 'white',
                fontSize: '15px', fontWeight: 700,
                cursor: (loading || otp.join('').length !== 6) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          {/* Resend */}
          <div style={{ marginTop: '20px' }}>
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={resending}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--accent-green)', fontSize: '14px', fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                }}
              >
                <RefreshCw size={14} className={resending ? 'spin' : ''} />
                {resending ? 'Sending...' : 'Resend code'}
              </button>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Resend code in <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{countdown}s</span>
              </p>
            )}
          </div>

          {/* Back link */}
          <div style={{ marginTop: '16px' }}>
            <Link
              href={type === 'signup' ? '/auth/signup' : '/auth/login'}
              style={{ color: 'var(--text-secondary)', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <ArrowLeft size={13} /> Back to {type === 'signup' ? 'sign up' : 'sign in'}
            </Link>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
          Didn&apos;t receive the email? Check your spam folder.
        </p>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
