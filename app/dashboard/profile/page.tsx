'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Camera, Save, Sun, Moon, User, Mail, Loader } from 'lucide-react'

export default function ProfilePage() {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    // Load saved theme
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

    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single()

    if (data) {
      setFullName(data.full_name || '')
      setAvatarUrl(data.avatar_url || '')
      setAvatarPreview(data.avatar_url || '')
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

    // Show local preview instantly
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
    } catch (e: any) {
      toast.error(e?.message || 'Failed to upload photo')
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

  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.[0]?.toUpperCase() || '?'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Loader size={28} style={{ color: 'var(--accent-green)', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 40px)', maxWidth: '640px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>My Profile</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
        Manage your account settings
      </p>

      {/* Avatar Section */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: isMobile ? '24px 20px' : '32px',
        marginBottom: '20px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        gap: '20px',
        textAlign: isMobile ? 'center' : 'left',
      }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: '88px', height: '88px', borderRadius: '50%',
            background: avatarPreview ? 'transparent' : 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', fontWeight: 800, color: '#000',
            overflow: 'hidden',
            border: '3px solid rgba(16,185,129,0.3)',
            boxShadow: '0 0 24px rgba(16,185,129,0.15)',
          }}>
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials
            }
          </div>

          {/* Upload button overlay */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'var(--accent-green)', border: '2px solid var(--bg-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#000',
            }}
          >
            {uploading
              ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />
              : <Camera size={13} />
            }
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
        </div>

        <div>
          <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
            {fullName || 'Your Name'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>{email}</div>
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              padding: '6px 14px', borderRadius: '8px',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              color: 'var(--accent-green)', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Change Photo
          </button>
        </div>
      </div>

      {/* Name & Email */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '28px',
        marginBottom: '20px',
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Personal Info</h3>

        {/* Full Name */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '13px', fontWeight: 600,
            color: 'var(--text-secondary)', marginBottom: '8px',
          }}>
            <User size={13} /> Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Enter your full name"
            style={{
              width: '100%', padding: '12px 16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              color: 'var(--text-primary)',
              fontSize: '15px', outline: 'none',
            }}
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '13px', fontWeight: 600,
            color: 'var(--text-secondary)', marginBottom: '8px',
          }}>
            <Mail size={13} /> Email Address
          </label>
          <input
            type="email"
            value={email}
            disabled
            style={{
              width: '100%', padding: '12px 16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              color: 'var(--text-secondary)',
              fontSize: '15px', outline: 'none',
              opacity: 0.6, cursor: 'not-allowed',
            }}
          />
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Email cannot be changed
          </p>
        </div>
      </div>

      {/* Theme Toggle */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '28px',
        marginBottom: '24px',
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>Appearance</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Choose your preferred theme
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Dark */}
          <button
            onClick={() => handleThemeToggle('dark')}
            style={{
              padding: '16px',
              borderRadius: '14px',
              border: theme === 'dark' ? '2px solid var(--accent-green)' : '2px solid var(--border)',
              background: theme === 'dark' ? 'rgba(16,185,129,0.07)' : 'var(--bg-secondary)',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
              transition: 'all 0.2s',
            }}
          >
            {/* Dark preview */}
            <div style={{
              width: '100%', height: '60px', borderRadius: '8px',
              background: '#0a0a0f',
              border: '1px solid #2a2a3a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '4px', padding: '8px',
              overflow: 'hidden',
            }}>
              <div style={{ flex: 1, height: '100%', background: '#111018', borderRadius: '4px' }} />
              <div style={{ flex: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ background: '#1a1a2a', borderRadius: '3px', height: '40%' }} />
                <div style={{ background: '#1a1a2a', borderRadius: '3px', height: '40%' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Moon size={14} style={{ color: theme === 'dark' ? 'var(--accent-green)' : 'var(--text-secondary)' }} />
              <span style={{
                fontSize: '13px', fontWeight: 600,
                color: theme === 'dark' ? 'var(--accent-green)' : 'var(--text-secondary)',
              }}>Dark</span>
              {theme === 'dark' && (
                <span style={{
                  fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                  background: 'rgba(16,185,129,0.15)', color: 'var(--accent-green)', fontWeight: 700,
                }}>DEFAULT</span>
              )}
            </div>
          </button>

          {/* Light */}
          <button
            onClick={() => handleThemeToggle('light')}
            style={{
              padding: '16px',
              borderRadius: '14px',
              border: theme === 'light' ? '2px solid var(--accent-green)' : '2px solid var(--border)',
              background: theme === 'light' ? 'rgba(16,185,129,0.07)' : 'var(--bg-secondary)',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
              transition: 'all 0.2s',
            }}
          >
            {/* Light preview */}
            <div style={{
              width: '100%', height: '60px', borderRadius: '8px',
              background: '#f0f0ea',
              border: '1px solid #d5d5ce',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '4px', padding: '8px',
              overflow: 'hidden',
            }}>
              <div style={{ flex: 1, height: '100%', background: '#e5e5df', borderRadius: '4px' }} />
              <div style={{ flex: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ background: '#ffffff', borderRadius: '3px', height: '40%' }} />
                <div style={{ background: '#ffffff', borderRadius: '3px', height: '40%' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sun size={14} style={{ color: theme === 'light' ? 'var(--accent-green)' : 'var(--text-secondary)' }} />
              <span style={{
                fontSize: '13px', fontWeight: 600,
                color: theme === 'light' ? 'var(--accent-green)' : 'var(--text-secondary)',
              }}>Light</span>
            </div>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%', padding: '15px',
          borderRadius: '14px',
          background: saving ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))',
          border: 'none', color: '#000',
          fontSize: '16px', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          boxShadow: '0 0 30px rgba(16,185,129,0.25)',
        }}
      >
        {saving
          ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
          : <><Save size={16} /> Save Changes</>
        }
      </button>

      <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
