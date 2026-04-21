'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Eye, EyeOff, UserPlus } from 'lucide-react'

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

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refCode, setRefCode] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Pre-fill referral code from URL or localStorage
    const params = new URLSearchParams(window.location.search)
    const urlRef = params.get('ref')
    const storedRef = localStorage.getItem('ref_code')
    if (urlRef) setRefCode(urlRef)
    else if (storedRef) setRefCode(storedRef)
  }, [])

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://topgeecapital.com/auth/callback' },
    })
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName || !email || !password || !confirm) return toast.error('Please fill in all fields')
    if (password !== confirm) return toast.error('Passwords do not match')
    if (password.length < 6) return toast.error('Password must be at least 6 characters')

    setLoading(true)

    // Step 1: Create the account with password
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: undefined, // we handle OTP ourselves
      },
    })
    if (error) {
      setLoading(false)
      return toast.error(error.message)
    }

    // Step 2: Create profile row with referral code
    if (data.user) {
      const newCode = (fullName.split(' ')[0].toUpperCase().slice(0, 6) + Math.random().toString(36).substring(2, 6).toUpperCase())

      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        email: email,
        balance: 0,
        total_deposited: 0,
        total_withdrawn: 0,
        total_profit: 0,
        is_admin: false,
        referral_code: newCode,
        referral_balance: 0,
        referred_by: refCode.trim().toUpperCase() || null,
      })

      if (refCode.trim()) {
        const { data: referrer } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', refCode.trim().toUpperCase())
          .single()

        if (referrer) {
          await supabase.from('referrals').insert({
            referrer_id: referrer.id,
            referred_id: data.user.id,
            commission_earned: 0,
          })
        }
      }

      localStorage.removeItem('ref_code')
    }

    setLoading(false)

    // If email already confirmed (e.g. Supabase auto-confirm disabled), go to verify
    // Otherwise redirect to verify page with email
    toast.success('Account created! Check your email for the verification code.')
    router.push(`/auth/verify-email?email=${encodeURIComponent(email)}&type=signup`)
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
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <img src='/logo.jpeg' alt='Topgee Capital' style={{ width: '60px', height: '60px', borderRadius: '14px', objectFit: 'cover' }} />
            <span style={{
              fontSize: '22px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Topgee Capital</span>
          </Link>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>Create your investor account</p>
        </div>

        <form onSubmit={handleSignup} style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '32px',
        }}>
          {[
            { label: 'Full Name', value: fullName, set: setFullName, type: 'text', placeholder: 'Ahmed Khan' },
            { label: 'Email Address', value: email, set: setEmail, type: 'email', placeholder: 'you@example.com' },
          ].map(field => (
            <div key={field.label} style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                {field.label}
              </label>
              <input
                type={field.type}
                value={field.value}
                onChange={e => field.set(e.target.value)}
                placeholder={field.placeholder}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '15px',
                  outline: 'none',
                }}
              />
            </div>
          ))}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                style={{
                  width: '100%',
                  padding: '12px 48px 12px 16px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '15px',
                  outline: 'none',
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

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat password"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '15px',
                outline: 'none',
              }}
            />
          </div>

          {/* Referral Code */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
              🔗 Referral Code <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '11px' }}>(optional)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={refCode}
                onChange={e => setRefCode(e.target.value.toUpperCase())}
                placeholder="e.g. AHMED1K2"
                maxLength={12}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: refCode ? 'rgba(16,185,129,0.07)' : 'var(--bg-secondary)',
                  border: refCode ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border)',
                  borderRadius: '8px',
                  color: refCode ? 'var(--accent-green)' : 'var(--text-primary)',
                  fontSize: '15px', outline: 'none',
                  fontFamily: 'monospace', letterSpacing: '2px', fontWeight: refCode ? 700 : 400,
                  transition: 'all 0.2s',
                }}
              />
              {refCode && (
                <div style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '11px', color: '#22c55e', fontWeight: 700,
                }}>✓ Applied</div>
              )}
            </div>
            {refCode && (
              <p style={{ fontSize: '11px', color: '#22c55e', marginTop: '6px' }}>
                🎉 Referral code applied! Your friend will earn 0.5% of your deposits.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: loading ? '#4a4a6a' : 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '15px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {loading ? 'Creating account...' : <><UserPlus size={18} /> Create Account</>}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            style={{
              width: '100%', padding: '12px',
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '8px', color: 'var(--text-primary)',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            }}
          >
            <GoogleIcon /> Continue with Google
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--accent-green)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
