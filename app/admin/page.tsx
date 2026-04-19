'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Users, ArrowDownCircle, ArrowUpCircle, TrendingUp, CheckCircle, XCircle, Settings } from 'lucide-react'
import Link from 'next/link'

interface Profile {
  id: string
  full_name: string
  email: string
  balance: number
  total_deposited: number
  total_profit: number
  total_withdrawn: number
  is_admin: boolean
  created_at: string
}

interface Deposit {
  id: string
  user_id: string
  amount: number
  method: string
  proof_url: string
  status: string
  created_at: string
  profiles?: { full_name: string; email: string }
}

interface Withdrawal {
  id: string
  user_id: string
  amount: number
  method: string
  account_details: string
  status: string
  created_at: string
  profiles?: { full_name: string; email: string }
}

type TabType = 'overview' | 'users' | 'deposits' | 'withdrawals' | 'profit' | 'kyc'

export default function AdminPage() {
  const [tab, setTab] = useState<TabType>('overview')
  const [users, setUsers] = useState<Profile[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [profitPct, setProfitPct] = useState('')
  const [adjustUserId, setAdjustUserId] = useState('')
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustType, setAdjustType] = useState<'add' | 'set'>('add')
  const [loading, setLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const supabase = createClient()

  useEffect(() => {
    checkAdmin()
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadUsers()
      loadDeposits()
      loadWithdrawals()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsAdmin(false); return }
    const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    setIsAdmin(data?.is_admin || false)
    if (data?.is_admin) {
      loadUsers()
      loadDeposits()
      loadWithdrawals()
    }
  }

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
  }

  async function loadDeposits() {
    const { data } = await supabase
      .from('deposits')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })
    setDeposits(data || [])
  }

  async function loadWithdrawals() {
    const { data } = await supabase
      .from('withdrawals')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })
    setWithdrawals(data || [])
  }

  async function approveDeposit(deposit: Deposit) {
    setLoading(true)
    const res = await fetch('/api/admin/approve-deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ depositId: deposit.id, userId: deposit.user_id, amount: deposit.amount }),
    })
    setLoading(false)
    if (!res.ok) return toast.error('Failed to approve deposit')
    toast.success('Deposit approved!')
    loadDeposits(); loadUsers()
  }

  async function rejectDeposit(depositId: string) {
    setLoading(true)
    const res = await fetch('/api/admin/reject-deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ depositId }),
    })
    setLoading(false)
    if (!res.ok) return toast.error('Failed to reject')
    toast.success('Deposit rejected')
    loadDeposits()
  }

  async function approveWithdrawal(w: Withdrawal) {
    setLoading(true)
    const res = await fetch('/api/admin/approve-withdrawal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ withdrawalId: w.id, userId: w.user_id, amount: w.amount }),
    })
    setLoading(false)
    if (!res.ok) return toast.error('Failed to process withdrawal')
    toast.success('Withdrawal marked as paid!')
    loadWithdrawals(); loadUsers()
  }

  async function distributeProfit() {
    const pct = parseFloat(profitPct)
    if (!pct || pct <= 0 || pct > 100) return toast.error('Enter a valid profit percentage (0-100)')
    setLoading(true)
    const res = await fetch('/api/admin/distribute-profit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profitPct: pct }),
    })
    setLoading(false)
    if (!res.ok) return toast.error('Failed to distribute profit')
    toast.success(`${pct}% profit distributed to all investors!`)
    setProfitPct('')
    loadUsers()
  }

  async function adjustBalance() {
    const amt = parseFloat(adjustAmount)
    if (!adjustUserId) return toast.error('Select a user')
    if (!amt) return toast.error('Enter an amount')
    setLoading(true)
    const res = await fetch('/api/admin/adjust-balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: adjustUserId, amount: amt, type: adjustType }),
    })
    setLoading(false)
    if (!res.ok) return toast.error('Failed to adjust balance')
    toast.success('Balance updated!')
    setAdjustAmount('')
    loadUsers()
  }

  if (isAdmin === null) return <div style={{ padding: '32px', color: 'var(--text-secondary)' }}>Loading...</div>
  if (isAdmin === false) return (
    <div style={{ padding: '32px', textAlign: 'center' }}>
      <h2 style={{ color: 'var(--accent-red)', marginBottom: '12px' }}>Access Denied</h2>
      <p style={{ color: 'var(--text-secondary)' }}>You don&apos;t have admin privileges.</p>
      <Link href="/dashboard" style={{ color: '#f59e0b', marginTop: '16px', display: 'inline-block' }}>← Back to Dashboard</Link>
    </div>
  )

  const pendingDeposits = deposits.filter(d => d.status === 'pending').length
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length
  const totalDeposited = users.reduce((s, u) => s + (u.total_deposited || 0), 0)

  const pendingKyc = users.filter(u => (u as Profile & { kyc_status: string }).kyc_status === 'pending').length

  const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <TrendingUp size={16} /> },
    { key: 'kyc', label: `KYC ${pendingKyc > 0 ? `(${pendingKyc})` : ''}`, icon: <CheckCircle size={16} /> },
    { key: 'users', label: 'Users', icon: <Users size={16} /> },
    { key: 'deposits', label: `Deposits ${pendingDeposits > 0 ? `(${pendingDeposits})` : ''}`, icon: <ArrowDownCircle size={16} /> },
    { key: 'withdrawals', label: `Withdrawals ${pendingWithdrawals > 0 ? `(${pendingWithdrawals})` : ''}`, icon: <ArrowUpCircle size={16} /> },
    { key: 'profit', label: 'Profit & Balance', icon: <Settings size={16} /> },
  ]

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Settings size={20} style={{ color: '#f59e0b' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>Admin Panel</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Manage investors, deposits & withdrawals</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '7px', border: 'none',
            background: tab === t.key ? 'var(--bg-hover)' : 'transparent',
            color: tab === t.key ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontSize: '13px', fontWeight: tab === t.key ? 600 : 400,
            cursor: 'pointer',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Total Users', value: users.length, color: '#f59e0b' },
            { label: 'Pending Deposits', value: pendingDeposits, color: '#f59e0b' },
            { label: 'Pending Withdrawals', value: pendingWithdrawals, color: 'var(--accent-red)' },
            { label: 'Total Deposited', value: `$${totalDeposited.toFixed(2)}`, color: 'var(--accent-green)' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: s.color, marginBottom: '8px' }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* KYC */}
      {tab === 'kyc' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>KYC Verification Status</h3>
            <button onClick={loadUsers} style={{
              padding: '6px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '7px', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer',
            }}>🔄 Refresh</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Verified', count: users.filter(u => (u as Profile & {kyc_status:string}).kyc_status === 'verified').length, color: 'var(--accent-green)', bg: 'rgba(0,212,160,0.1)' },
              { label: 'Pending', count: users.filter(u => (u as Profile & {kyc_status:string}).kyc_status === 'pending').length, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
              { label: 'Rejected', count: users.filter(u => (u as Profile & {kyc_status:string}).kyc_status === 'rejected').length, color: 'var(--accent-red)', bg: 'rgba(255,68,68,0.1)' },
              { label: 'Not Started', count: users.filter(u => (u as Profile & {kyc_status:string}).kyc_status === 'none' || !(u as Profile & {kyc_status:string}).kyc_status).length, color: 'var(--text-secondary)', bg: 'var(--bg-secondary)' },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, border: `1px solid ${s.color}30`, borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Name', 'Email', 'KYC Status', 'Balance', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '12px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const kyc = (u as Profile & {kyc_status:string}).kyc_status || 'none'
                  const kycColor = kyc === 'verified' ? 'var(--accent-green)' : kyc === 'pending' ? '#f59e0b' : kyc === 'rejected' ? 'var(--accent-red)' : 'var(--text-secondary)'
                  const kycBg = kyc === 'verified' ? 'rgba(0,212,160,0.15)' : kyc === 'pending' ? 'rgba(245,158,11,0.15)' : kyc === 'rejected' ? 'rgba(255,68,68,0.15)' : 'var(--bg-secondary)'
                  const kycLabel = kyc === 'verified' ? '✅ Verified' : kyc === 'pending' ? '⏳ Pending' : kyc === 'rejected' ? '❌ Rejected' : '— Not Started'
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(42,42,58,0.5)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{u.full_name}</td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: kycColor, background: kycBg }}>
                          {kycLabel}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--accent-green)', fontWeight: 600 }}>${(u.balance || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {kyc !== 'verified' && (
                            <button onClick={async () => {
                              await fetch('/api/admin/update-kyc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: u.id, status: 'verified' }) })
                              loadUsers()
                            }} style={{ padding: '4px 10px', background: 'rgba(0,212,160,0.15)', border: '1px solid rgba(0,212,160,0.3)', borderRadius: '6px', color: 'var(--accent-green)', fontSize: '11px', cursor: 'pointer' }}>
                              ✅ Verify
                            </button>
                          )}
                          {kyc !== 'rejected' && (
                            <button onClick={async () => {
                              await fetch('/api/admin/update-kyc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: u.id, status: 'rejected' }) })
                              loadUsers()
                            }} style={{ padding: '4px 10px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '6px', color: 'var(--accent-red)', fontSize: '11px', cursor: 'pointer' }}>
                              ❌ Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>All Users ({users.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Name', 'Email', 'Balance', 'Deposited', 'Profit', 'Joined'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '12px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(42,42,58,0.5)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{u.full_name}{u.is_admin && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#f59e0b', background: 'rgba(245,158,11,0.15)', padding: '2px 6px', borderRadius: '4px' }}>ADMIN</span>}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '12px', color: 'var(--accent-green)', fontWeight: 600 }}>${(u.balance || 0).toFixed(2)}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>${(u.total_deposited || 0).toFixed(2)}</td>
                    <td style={{ padding: '12px', color: 'var(--accent-green)' }}>${(u.total_profit || 0).toFixed(2)}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '11px' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deposits */}
      {tab === 'deposits' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>All Deposits</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['User', 'Amount', 'Method', 'Proof', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '12px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deposits.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid rgba(42,42,58,0.5)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{d.profiles?.full_name || 'Unknown'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{d.profiles?.email}</div>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--accent-green)', fontWeight: 700 }}>${d.amount.toFixed(2)}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{d.method}</td>
                    <td style={{ padding: '12px' }}>
                      {d.proof_url ? <a href={d.proof_url} target="_blank" rel="noreferrer" style={{ color: '#f59e0b', fontSize: '12px' }}>View</a> : <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>None</span>}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                        color: d.status === 'approved' ? 'var(--accent-green)' : d.status === 'rejected' ? 'var(--accent-red)' : '#f59e0b',
                        background: d.status === 'approved' ? 'rgba(0,212,160,0.15)' : d.status === 'rejected' ? 'rgba(255,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                      }}>{d.status.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '11px' }}>{new Date(d.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>
                      {d.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => approveDeposit(d)} disabled={loading} style={{
                            padding: '5px 10px', background: 'rgba(0,212,160,0.15)', border: '1px solid rgba(0,212,160,0.3)',
                            borderRadius: '6px', color: 'var(--accent-green)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                          }}><CheckCircle size={12} /> Approve</button>
                          <button onClick={() => rejectDeposit(d.id)} disabled={loading} style={{
                            padding: '5px 10px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)',
                            borderRadius: '6px', color: 'var(--accent-red)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                          }}><XCircle size={12} /> Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Withdrawals */}
      {tab === 'withdrawals' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>All Withdrawals</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['User', 'Amount', 'Method', 'Account', 'Status', 'Date', 'Action'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '12px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(w => (
                  <tr key={w.id} style={{ borderBottom: '1px solid rgba(42,42,58,0.5)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{w.profiles?.full_name || 'Unknown'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{w.profiles?.email}</div>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--accent-red)', fontWeight: 700 }}>${w.amount.toFixed(2)}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{w.method}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '12px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.account_details}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                        color: w.status === 'paid' ? 'var(--accent-green)' : w.status === 'rejected' ? 'var(--accent-red)' : '#f59e0b',
                        background: w.status === 'paid' ? 'rgba(0,212,160,0.15)' : w.status === 'rejected' ? 'rgba(255,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                      }}>{w.status.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '11px' }}>{new Date(w.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>
                      {w.status === 'pending' && (
                        <button onClick={() => approveWithdrawal(w)} disabled={loading} style={{
                          padding: '5px 10px', background: 'rgba(0,212,160,0.15)', border: '1px solid rgba(0,212,160,0.3)',
                          borderRadius: '6px', color: 'var(--accent-green)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                        }}><CheckCircle size={12} /> Mark Paid</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profit & Balance */}
      {tab === 'profit' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Profit Distribution */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Distribute Profit</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Apply a profit % to all investor balances at once.
            </p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Profit %</label>
                <input
                  type="number"
                  value={profitPct}
                  onChange={e => setProfitPct(e.target.value)}
                  placeholder="e.g. 5.5"
                  min="0.1"
                  max="100"
                  step="0.1"
                  style={{
                    width: '100%', padding: '10px 14px',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
                  }}
                />
              </div>
              <button onClick={distributeProfit} disabled={loading} style={{
                padding: '10px 20px', background: 'rgba(0,212,160,0.15)', border: '1px solid rgba(0,212,160,0.3)',
                borderRadius: '8px', color: 'var(--accent-green)', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}>
                {loading ? '...' : 'Apply'}
              </button>
            </div>
            <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', fontSize: '12px', color: '#f59e0b' }}>
              ⚠️ This will add {profitPct || 'X'}% to the balance of ALL {users.length} investors.
            </div>
          </div>

          {/* Manual Balance Adjust */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Adjust User Balance</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Manually add to or set a specific user&apos;s balance.
            </p>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Select User</label>
              <select
                value={adjustUserId}
                onChange={e => setAdjustUserId(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
                }}
              >
                <option value="">Select a user...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.full_name} — ${(u.balance || 0).toFixed(2)}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Amount ($)</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  placeholder="Amount"
                  step="0.01"
                  style={{
                    width: '100%', padding: '10px 14px',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Type</label>
                <select
                  value={adjustType}
                  onChange={e => setAdjustType(e.target.value as 'add' | 'set')}
                  style={{
                    padding: '10px 14px',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
                  }}
                >
                  <option value="add">Add</option>
                  <option value="set">Set</option>
                </select>
              </div>
            </div>
            <button onClick={adjustBalance} disabled={loading} style={{
              width: '100%', padding: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none', borderRadius: '8px', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            }}>
              {loading ? 'Updating...' : 'Update Balance'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
