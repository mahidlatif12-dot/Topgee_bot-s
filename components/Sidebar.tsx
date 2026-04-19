'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, ArrowDownCircle, ArrowUpCircle, LogOut, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'

interface Profile {
  full_name: string
  email: string
  balance: number
  is_admin: boolean
}

export default function Sidebar({ profile: initialProfile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(initialProfile)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, balance, is_admin')
        .eq('id', user.id)
        .single()
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
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { href: '/dashboard/deposit', label: 'Deposit', icon: <ArrowDownCircle size={18} /> },
    { href: '/dashboard/withdraw', label: 'Withdraw', icon: <ArrowUpCircle size={18} /> },
  ]

  return (
    <aside style={{
      width: '240px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '22px' }}>🤖</span>
          <span style={{
            fontSize: '18px', fontWeight: 800,
            background: 'linear-gradient(135deg, #6366f1, #00d4a0)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Topgee Capital</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {navItems.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '8px', marginBottom: '4px',
              textDecoration: 'none', fontSize: '14px',
              fontWeight: active ? 600 : 400,
              color: active ? 'var(--accent-indigo)' : 'var(--text-secondary)',
              background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
            }}>
              {item.icon} {item.label}
            </Link>
          )
        })}

        {profile?.is_admin && (
          <Link href="/admin" style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '8px', marginTop: '8px',
            textDecoration: 'none', fontSize: '14px',
            fontWeight: pathname.startsWith('/admin') ? 600 : 400,
            color: pathname.startsWith('/admin') ? '#f59e0b' : 'var(--text-secondary)',
            background: pathname.startsWith('/admin') ? 'rgba(245,158,11,0.12)' : 'transparent',
          }}>
            <Settings size={18} /> Admin Panel
          </Link>
        )}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {profile?.full_name || '...'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Balance: <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
              ${(profile?.balance || 0).toFixed(2)}
            </span>
          </div>
        </div>
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          width: '100%', padding: '9px 12px',
          background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)',
          borderRadius: '8px', color: '#ff6666', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
        }}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </aside>
  )
}
