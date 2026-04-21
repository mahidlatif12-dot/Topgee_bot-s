'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Camera, Save, Sun, Moon, User, Mail, Loader, Shield, ShieldCheck, ShieldOff, KeyRound, CheckCircle, XCircle } from 'lucide-react'

type Tab = 'profile' | 'security'

export default function ProfilePage() {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<Tab>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [userId, setUserId] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  // Security state
  const [emailVerified, setEmailVerified] = useState(false)
  const [kycStatus, setKycStatus] = useState<string>('none')
  const [twoFaEnabled, setTwoFaEnabled] = useState(false)
  const [totpFactorId, setTotpFactorId] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [totpSecret, setTotpSecret] = useState('')
  const [newFactorId, setNewFactorId] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('tc-theme') as 'dark' | 'light' | null
    const t = saved || 'dark'
    setTheme(t)
    document.documentElement.setAttribute('data-theme', t)
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    setEmail(user.email || '')
    setEmailVerified(!!user.email_confirmed_at)

    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, kyc_status, two_fa_enabled')
      .eq('id', user.id)
      .single()

    if (data) {
      setFullName(data.full_name || '')
      setAvatarUrl(data.avatar_url || '')
      setAvatarPreview(data.avatar_url || '')
      setKycStatus(data.kyc_status || 'none')
      setTwoFaEnabled(data.two_fa_enabled || false)
    }

    // Check enrolled TOTP factors
    const { data: assuranceData } = await supabase.auth.mfa.listFactors()
    const totp = assuranceData?.totp?.find(f => f.status === 'verified')
    if (totp) {
      setTotpFactorId(totp.id)
      setTwoFaEnabled(true)
    }

    setLoading(false)
  }

  function handleThemeToggle(newTheme: 'dark' | 'light') {
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('tc-theme', newTheme)
    toast.success(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode activated`)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) return toast.error('Image must be under 3MB')

    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const form = new FormData()
      form.append('userId', userId)
      form.append('avatar', file)

      const res = await fetch('/api/profile/upload-avatar', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setAvatarUrl(data.url)
      toast.success('Photo updated!')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!fullName.trim()) return toast.error('Name cannot be empty')
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), avatar_url: avatarUrl })
        .eq('id', userId)
      if (error) throw error
      toast.success('Profile saved!')
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleEnroll2FA() {
    setEnrolling(true)
    try {
      const res = await fetch('/api/auth/totp-enroll', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQrCode(data.qrCode)
      setTotpSecret(data.secret)
      setNewFactorId(data.factorId)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to start 2FA setup')
    } finally {
      setEnrolling(false)
    }
  }

  async function handleVerify2FA() {
    if (otpCode.length !== 6) return toast.error('Enter the 6-digit code from your authenticator app')
    setVerifying(true)
    try {
      const res = await fetch('/api/auth/totp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factorId: newFactorId, code: otpCode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('✅ Google Authenticator enabled!')
      setTwoFaEnabled(true)
      setTotpFactorId(newFactorId)
      setQrCode('')
      setTotpSecret('')
      setOtpCode('')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Invalid code — try again')
    } finally {
      setVerifying(false)
    }
  }

  async function handleDisable2FA() {
    if (!totpFactorId) return
    if (!confirm('Are you sure you want to disable Google Authenticator? This will reduce your account security.')) return
    try {
      const res = await fetch('/api/auth/totp-unenroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factorId: totpFactorId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('2FA disabled')
      setTwoFaEnabled(false)
      setTotpFactorId(null)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to disable 2FA')
    }
  }

  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.[0]?.toUpperCase() || '?'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Loader size={28} style={{ color: 'var(--accent-green)', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )

  const securityItems = [
    {
      icon: emailVerified ? <CheckCircle size={20} color="#10b981" /> : <XCircle size={20} color="#ef4444" />,
      title: 'Email Verified',
      desc: emailVerified ? 'Your email address is verified' : 'Please verify your email address',
      status: emailVerified ? 'done' : 'required',
      action: emailVerified ? null : { label: 'Verify Email', href: '/auth/verify-email?email=' + encodeURIComponent(email) + '&type=login' },
    },
    {
      icon: kycStatus === 'verified' ? <CheckCircle size={20} color="#10b981" /> : kycStatus === 'pending' ? <Loader size={20} color="#f59e0b" /> : <XCircle size={20} color="#ef4444" />,
      title: 'KYC Identity Verification',
      desc: kycStatus === 'verified' ? 'Identity verified' : kycStatus === 'pending' ? 'Under review — usually within 24h' : 'Complete identity verification',
      status: kycStatus === 'verified' ? 'done' : kycStatus === 'pending' ? 'pending' : 'required',
      action: kycStatus === 'verified' || kycStatus === 'pending' ? null : { label: 'Verify Identity', href: '/dashboard/kyc' },
    },
    {
      icon: twoFaEnabled ? <ShieldCheck size={20} color="#10b981" /> : <ShieldOff size={20} color="#ef4444" />,
      title: 'Google Authenticator (2FA)',
      desc: twoFaEnabled ? '2FA is active — your account is protected' : 'Add an extra layer of security',
      status: twoFaEnabled ? 'done' : 'required',
      action: null, // handled inline below
    },
  ]

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 40px)', maxWidth: '640px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>My Profile</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
        Manage your account settings and security
      </p>

      {/* Tab Switcher */}
      <div style={{
        display: 'flex', background: 'var(--bg-card)',
        border: '1px solid var(--border)', borderRadius: '12px',
        padding: '4px', marginBottom: '24px', gap: '4px',
      }}>
        {[
          { key: 'profile', label: '👤 Profile', },
          { key: 'security', label: '🔐 Security', },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as Tab)} style={{
            flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            background: tab === t.key ? 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))' : 'transparent',
            color: tab === t.key ? 'white' : 'var(--text-secondary)',
            transition: 'all 0.2s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {tab === 'profile' && (
        <>
          {/* Avatar */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '20px', padding: isMobile ? '24px 20px' : '32px',
            marginBottom: '20px',
            display: 'flex', flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center', gap: '20px',
            textAlign: isMobile ? 'center' : 'left',
          }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: '88px', height: '88px', borderRadius: '50%',
                background: avatarPreview ? 'transparent' : 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', fontWeight: 800, color: '#000',
                overflow: 'hidden', border: '3px solid rgba(16,185,129,0.3)',
                boxShadow: '0 0 24px rgba(16,185,129,0.15)',
              }}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials}
              </div>
              <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
                position: 'absolute', bottom: 0, right: 0,
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'var(--accent-green)', border: '2px solid var(--bg-card)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#000',
              }}>
                {uploading ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={13} />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{fullName || 'Your Name'}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>{email}</div>
              <button onClick={() => fileRef.current?.click()} style={{
                padding: '6px 14px', borderRadius: '8px',
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                color: 'var(--accent-green)', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              }}>Change Photo</button>
            </div>
          </div>

          {/* Personal Info */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Personal Info</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <User size={13} /> Full Name
              </label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name"
                style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '15px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <Mail size={13} /> Email Address
              </label>
              <input type="email" value={email} disabled
                style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-secondary)', fontSize: '15px', outline: 'none', opacity: 0.6, cursor: 'not-allowed' }} />
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>Email cannot be changed</p>
            </div>
          </div>

          {/* Appearance */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>Appearance</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Choose your preferred theme</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {['dark', 'light'].map(t => (
                <button key={t} onClick={() => handleThemeToggle(t as 'dark' | 'light')} style={{
                  padding: '16px', borderRadius: '14px',
                  border: theme === t ? '2px solid var(--accent-green)' : '2px solid var(--border)',
                  background: theme === t ? 'rgba(16,185,129,0.07)' : 'var(--bg-secondary)',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', transition: 'all 0.2s',
                }}>
                  <div style={{ width: '100%', height: '50px', borderRadius: '8px', background: t === 'dark' ? '#0a0a0f' : '#f0f0ea', border: `1px solid ${t === 'dark' ? '#2a2a3a' : '#d5d5ce'}` }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {t === 'dark' ? <Moon size={14} style={{ color: theme === t ? 'var(--accent-green)' : 'var(--text-secondary)' }} /> : <Sun size={14} style={{ color: theme === t ? 'var(--accent-green)' : 'var(--text-secondary)' }} />}
                    <span style={{ fontSize: '13px', fontWeight: 600, color: theme === t ? 'var(--accent-green)' : 'var(--text-secondary)' }}>{t === 'dark' ? 'Dark' : 'Light'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', padding: '15px', borderRadius: '14px',
            background: saving ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))',
            border: 'none', color: '#000', fontSize: '16px', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: '0 0 30px rgba(16,185,129,0.25)',
          }}>
            {saving ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Save size={16} /> Save Changes</>}
          </button>
        </>
      )}

      {/* ── SECURITY TAB ── */}
      {tab === 'security' && (
        <>
          {/* Security Overview */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Shield size={20} style={{ color: 'var(--accent-green)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Account Security</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 20px' }}>
              Complete all 3 steps below to unlock withdrawals
            </p>

            {/* Progress bar */}
            {(() => {
              const done = [emailVerified, kycStatus === 'verified', twoFaEnabled].filter(Boolean).length
              return (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Security level</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: done === 3 ? '#10b981' : done === 2 ? '#f59e0b' : '#ef4444' }}>
                      {done === 3 ? '🛡️ Maximum' : done === 2 ? '⚠️ Medium' : '❌ Low'} ({done}/3)
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(done / 3) * 100}%`, background: done === 3 ? 'linear-gradient(90deg,#10b981,#059669)' : done === 2 ? '#f59e0b' : '#ef4444', borderRadius: '10px', transition: 'width 0.5s' }} />
                  </div>
                </div>
              )
            })()}

            {/* Steps */}
            {securityItems.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '16px', borderRadius: '12px', marginBottom: '10px',
                background: item.status === 'done' ? 'rgba(16,185,129,0.06)' : item.status === 'pending' ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)',
                border: `1px solid ${item.status === 'done' ? 'rgba(16,185,129,0.2)' : item.status === 'pending' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                <div style={{ flexShrink: 0 }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.desc}</div>
                </div>
                {item.status === 'done' && <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: '20px' }}>✓ Done</span>}
                {item.status === 'pending' && <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '3px 10px', borderRadius: '20px' }}>Pending</span>}
                {item.status === 'required' && item.action && (
                  <a href={item.action.href} style={{ fontSize: '12px', fontWeight: 700, color: 'white', background: 'linear-gradient(135deg,#10b981,#059669)', padding: '6px 14px', borderRadius: '8px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    {item.action.label}
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Google Authenticator Setup */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <KeyRound size={18} style={{ color: 'var(--accent-green)' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Google Authenticator</h3>
              {twoFaEnabled && <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: '20px', marginLeft: 'auto' }}>✓ Enabled</span>}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 20px' }}>
              Use Google Authenticator, Authy, or any TOTP app for extra security.
            </p>

            {twoFaEnabled && !qrCode && (
              <button onClick={handleDisable2FA} style={{
                padding: '10px 20px', borderRadius: '8px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              }}>
                Disable 2FA
              </button>
            )}

            {!twoFaEnabled && !qrCode && (
              <button onClick={handleEnroll2FA} disabled={enrolling} style={{
                width: '100%', padding: '13px', borderRadius: '10px',
                background: enrolling ? '#4a4a6a' : 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))',
                border: 'none', color: 'white', fontSize: '14px', fontWeight: 700, cursor: enrolling ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                {enrolling ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Setting up...</> : '🔐 Set Up Google Authenticator'}
              </button>
            )}

            {qrCode && (
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
                  Step 1 — Scan this QR code with Google Authenticator:
                </p>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <img src={qrCode} alt="QR Code" style={{ width: '180px', height: '180px', borderRadius: '12px', border: '4px solid rgba(16,185,129,0.3)', background: 'white', padding: '8px' }} />
                </div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Manual entry key</p>
                  <code style={{ fontSize: '13px', color: 'var(--accent-green)', fontFamily: 'monospace', letterSpacing: '2px', wordBreak: 'break-all' }}>{totpSecret}</code>
                </div>
                <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
                  Step 2 — Enter the 6-digit code from the app:
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    style={{
                      flex: 1, padding: '13px 16px',
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      borderRadius: '10px', color: 'var(--text-primary)',
                      fontSize: '22px', fontWeight: 800, letterSpacing: '6px',
                      outline: 'none', textAlign: 'center', fontFamily: 'monospace',
                    }}
                  />
                  <button onClick={handleVerify2FA} disabled={verifying || otpCode.length !== 6} style={{
                    padding: '13px 20px', borderRadius: '10px',
                    background: (verifying || otpCode.length !== 6) ? '#4a4a6a' : 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))',
                    border: 'none', color: 'white', fontSize: '14px', fontWeight: 700,
                    cursor: (verifying || otpCode.length !== 6) ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}>
                    {verifying ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                <button onClick={() => { setQrCode(''); setTotpSecret(''); setOtpCode('') }} style={{
                  background: 'none', border: 'none', color: 'var(--text-secondary)',
                  fontSize: '13px', cursor: 'pointer', marginTop: '12px', padding: 0,
                }}>Cancel</button>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
