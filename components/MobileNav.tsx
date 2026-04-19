'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, ArrowDownCircle, ArrowUpCircle, ShieldCheck, Settings, LogOut, Menu, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'

interface Profile {
  full_name: string
  email: string
  balance: number
  is_admin: boolean
  kyc_status: string
}

export default function MobileNav({ profile: initialProfile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('full_name, email, balance, is_admin, kyc_status').eq('id', user.id).single()
      if (data) setProfile(data)
    }
    loadProfile()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Logged out')
    router.push('/')
    router.refresh()
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/dashboard/deposit', label: 'Deposit', icon: <ArrowDownCircle size={20} /> },
    { href: '/dashboard/withdraw', label: 'Withdraw', icon: <ArrowUpCircle size={20} /> },
    { href: '/dashboard/kyc', label: 'KYC', icon: <ShieldCheck size={20} /> },
  ]

  return (
    <>
      {/* Mobile Top Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: '56px',
        background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '20px' }}>🤖</span>
          <span style={{
            fontSize: '16px', fontWeight: 800,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Topgee Capital</span>
        </Link>
        <button onClick={() => setMenuOpen(!menuOpen)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-primary)', display: 'flex', padding: '8px',
        }}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Slide-out Menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: '56px', left: 0, right: 0, bottom: 0,
          background: 'var(--bg-secondary)', zIndex: 99,
          padding: '16px', overflowY: 'auto',
        }}>
          {/* User Info */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '16px', marginBottom: '16px',
          }}>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>{profile?.full_name || '...'}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Balance: <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>${(profile?.balance || 0).toFixed(2)}</span>
            </div>
            <div style={{ marginTop: '6px' }}>
              <span style={{
                fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px',
                background: profile?.kyc_status === 'verified' ? 'rgba(0,212,160,0.15)' : 'rgba(245,158,11,0.15)',
                color: profile?.kyc_status === 'verified' ? 'var(--accent-green)' : '#f59e0b',
              }}>
                {profile?.kyc_status === 'verified' ? '✅ KYC Verified' : '⚠️ KYC Required'}
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
            {navItems.map(item => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 16px', borderRadius: '10px', textDecoration: 'none',
                  fontSize: '15px', fontWeight: active ? 600 : 400,
                  color: active ? '#f59e0b' : 'var(--text-primary)',
                  background: active ? 'rgba(245,158,11,0.12)' : 'var(--bg-card)',
                  border: '1px solid var(--border)',
                }}>
                  {item.icon} {item.label}
                </Link>
              )
            })}

            {profile?.is_admin && (
              <Link href="/admin" onClick={() => setMenuOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 16px', borderRadius: '10px', textDecoration: 'none',
                fontSize: '15px', fontWeight: 600,
                color: '#f59e0b', background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.2)',
              }}>
                <Settings size={20} /> Admin Panel
              </Link>
            )}
          </div>

          {/* Logout */}
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '14px 16px',
            background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)',
            borderRadius: '10px', color: '#ff6666', fontSize: '15px', fontWeight: 500, cursor: 'pointer',
          }}>
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)',
        display: 'flex', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {navItems.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '10px 4px 8px', textDecoration: 'none', gap: '3px',
              color: active ? '#f59e0b' : 'var(--text-secondary)',
              borderTop: active ? '2px solid #f59e0b' : '2px solid transparent',
            }}>
              {item.icon}
              <span style={{ fontSize: '10px', fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </>
  )
}
