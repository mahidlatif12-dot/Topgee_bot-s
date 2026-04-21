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

type TabType = 'overview' | 'users' | 'deposits' | 'withdrawals' | 'profit' | 'kyc' | 'support'

interface SupportRequest {
  id: string
  name: string
  email: string
  message: string
  status: string
  admin_reply: string | null
  created_at: string
}

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
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([])
  const [kycSubmissions, setKycSubmissions] = useState<any[]>([])
  const [kycNotes, setKycNotes] = useState<Record<string, string>>({})
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [replyLoading, setReplyLoading] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    checkAdmin()
    fetchSupport()
    fetchKycSubmissions()
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
      <Link href="/dashboard" style={{ color: 'var(--accent-green)', marginTop: '16px', display: 'inline-block' }}>← Back to Dashboard</Link>
    </div>
  )

  const pendingDeposits = deposits.filter(d => d.status === 'pending').length
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length
  const totalDeposited = users.reduce((s, u) => s + (u.total_deposited || 0), 0)

  const pendingKyc = users.filter(u => (u as Profile & { kyc_status: string }).kyc_status === 'pending').length

  async function fetchKycSubmissions() {
    const { data } = await supabase
      .from('kyc_submissions')
      .select('*, profiles(full_name, email)')
      .order('submitted_at', { ascending: false })
    setKycSubmissions(data || [])
  }

  async function handleKycAction(userId: string, submissionId: string, status: 'verified' | 'rejected') {
    const note = kycNotes[submissionId] || ''
    if (status === 'rejected' && !note.trim()) return toast.error('Add a note explaining why it was rejected')

    // Update profile kyc_status
    await supabase.from('profiles').update({
      kyc_status: status,
      kyc_admin_note: note.trim() || null,
    }).eq('id', userId)

    // Update submission status
    await supabase.from('kyc_submissions').update({
      status,
      admin_note: note.trim() || null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', submissionId)

    toast.success(status === 'verified' ? 'KYC Verified!' : 'KYC Rejected')
    fetchKycSubmissions()
    loadUsers()
  }

  async function fetchSupport() {
    const { data } = await supabase
      .from('support_requests')
      .select('*')
      .order('created_at', { ascending: false })
    setSupportRequests(data || [])
  }

  async function replyToTicket(id: string, status: string) {
    const reply = replyText[id] || ''
    if (!reply.trim()) return toast.error('Write a reply first')
    setReplyLoading(id)
    const { error } = await supabase
      .from('support_requests')
      .update({ admin_reply: reply.trim(), status: 'replied' })
      .eq('id', id)
    setReplyLoading(null)
    if (error) return toast.error('Failed to send reply')
    toast.success('Reply sent!')
    setReplyText(prev => ({ ...prev, [id]: '' }))
    fetchSupport()
  }

  async function closeTicket(id: string) {
    await supabase.from('support_requests').update({ status: 'closed' }).eq('id', id)
    toast.success('Ticket closed')
    fetchSupport()
  }

  const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <TrendingUp size={16} /> },
    { key: 'kyc', label: `KYC ${pendingKyc > 0 ? `(${pendingKyc})` : ''}`, icon: <CheckCircle size={16} /> },
    { key: 'users', label: 'Users', icon: <Users size={16} /> },
    { key: 'deposits', label: `Deposits ${pendingDeposits > 0 ? `(${pendingDeposits})` : ''}`, icon: <ArrowDownCircle size={16} /> },
    { key: 'withdrawals', label: `Withdrawals ${pendingWithdrawals > 0 ? `(${pendingWithdrawals})` : ''}`, icon: <ArrowUpCircle size={16} /> },
    { key: 'profit', label: 'Profit & Balance', icon: <Settings size={16} /> },
    { key: 'support', label: `Support ${supportRequests.filter(r => r.status === 'open').length > 0 ? `(${supportRequests.filter(r => r.status === 'open').length})` : ''}`, icon: <span>MSG</span> },
  ]

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Settings size={20} style={{ color: 'var(--accent-green)' }} />
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
            { label: 'Total Users', value: users.length, color: 'var(--accent-green)' },
            { label: 'Pending Deposits', value: pendingDeposits, color: 'var(--accent-green)' },
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
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700 }}>KYC Submissions ({kycSubmissions.length})</h2>
            <button onClick={fetchKycSubmissions} style={{ padding: '6px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}>Refresh</button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '24px' }}>
            {[
              { label: 'Pending', count: kycSubmissions.filter(k => k.status === 'pending').length, color: 'var(--accent-green)', bg: 'rgba(16,185,129,0.08)' },
              { label: 'Verified', count: kycSubmissions.filter(k => k.status === 'verified').length, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
              { label: 'Rejected', count: kycSubmissions.filter(k => k.status === 'rejected').length, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
              { label: 'Total', count: kycSubmissions.length, color: 'var(--text-primary)', bg: 'var(--bg-card)' },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 900, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {kycSubmissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)', fontSize: '14px' }}>No KYC submissions yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {kycSubmissions.map(k => {
                const statusColor = k.status === 'pending' ? 'var(--accent-green)' : k.status === 'verified' ? '#22c55e' : '#ef4444'
                const statusBg = k.status === 'pending' ? 'rgba(16,185,129,0.1)' : k.status === 'verified' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'
                return (
                  <div key={k.id} style={{ background: 'var(--bg-card)', border: `1px solid ${k.status === 'pending' ? 'rgba(245,158,11,0.35)' : 'var(--border)'}`, borderRadius: '20px', padding: '24px' }}>

                    {/* Header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '16px', marginBottom: '2px' }}>{k.full_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{k.profiles?.email}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Submitted: {new Date(k.submitted_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: statusColor, background: statusBg }}>
                        {k.status === 'pending' ? 'Pending Review' : k.status === 'verified' ? 'Verified' : 'Rejected'}
                      </span>
                    </div>

                    {/* Personal Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '10px', marginBottom: '20px' }}>
                      {[
                        { label: 'Full Name', value: k.full_name },
                        { label: 'Date of Birth', value: k.date_of_birth },
                        { label: 'ID Type', value: k.id_type },
                        { label: 'ID Number', value: k.id_number },
                        { label: 'Address', value: k.address },
                      ].map((f, i) => (
                        <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '12px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>{f.label}</div>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>{f.value || '—'}</div>
                        </div>
                      ))}
                    </div>

                    {/* Photos side by side */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>ID Document</div>
                        {k.document_url
                          ? <a href={k.document_url} target="_blank" rel="noreferrer">
                              <img src={k.document_url} alt="Document" style={{ width: '100%', borderRadius: '10px', border: '1px solid var(--border)', maxHeight: '200px', objectFit: 'cover', cursor: 'pointer' }} />
                            </a>
                          : <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>No document</div>
                        }
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>Selfie</div>
                        {k.selfie_url
                          ? <a href={k.selfie_url} target="_blank" rel="noreferrer">
                              <img src={k.selfie_url} alt="Selfie" style={{ width: '100%', borderRadius: '10px', border: '1px solid var(--border)', maxHeight: '200px', objectFit: 'cover', cursor: 'pointer' }} />
                            </a>
                          : <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>No selfie</div>
                        }
                      </div>
                    </div>

                    {/* Admin note */}
                    {k.status === 'pending' && (
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>Note to client (required if rejecting)</label>
                        <textarea
                          value={kycNotes[k.id] || ''}
                          onChange={e => setKycNotes(prev => ({ ...prev, [k.id]: e.target.value }))}
                          placeholder="e.g. Your selfie is blurry, please retake in better lighting..."
                          rows={2}
                          style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                        />
                      </div>
                    )}

                    {/* Previous admin note */}
                    {k.admin_note && k.status !== 'pending' && (
                      <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-green)', marginBottom: '4px' }}>Admin Note Sent</div>
                        <div style={{ fontSize: '13px' }}>{k.admin_note}</div>
                      </div>
                    )}

                    {/* Actions */}
                    {k.status === 'pending' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button onClick={() => handleKycAction(k.user_id, k.id, 'verified')} style={{
                          padding: '11px', borderRadius: '10px',
                          background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                          color: '#22c55e', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                        }}>Verify Identity</button>
                        <button onClick={() => handleKycAction(k.user_id, k.id, 'rejected')} style={{
                          padding: '11px', borderRadius: '10px',
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                          color: '#ef4444', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                        }}>Reject & Notify</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
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
                    <td style={{ padding: '12px', fontWeight: 600 }}>{u.full_name}{u.is_admin && <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--accent-green)', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '4px' }}>ADMIN</span>}</td>
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
                      {d.proof_url ? <a href={d.proof_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-green)', fontSize: '12px' }}>View</a> : <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>None</span>}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                        color: d.status === 'approved' ? 'var(--accent-green)' : d.status === 'rejected' ? 'var(--accent-red)' : 'var(--accent-green)',
                        background: d.status === 'approved' ? 'rgba(0,212,160,0.15)' : d.status === 'rejected' ? 'rgba(255,68,68,0.15)' : 'rgba(16,185,129,0.1)',
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
                        color: w.status === 'paid' ? 'var(--accent-green)' : w.status === 'rejected' ? 'var(--accent-red)' : 'var(--accent-green)',
                        background: w.status === 'paid' ? 'rgba(0,212,160,0.15)' : w.status === 'rejected' ? 'rgba(255,68,68,0.15)' : 'rgba(16,185,129,0.1)',
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
            <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '8px', fontSize: '12px', color: 'var(--accent-green)' }}>
              Warning: This will add {profitPct || 'X'}% to the balance of ALL {users.length} investors.
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
              width: '100%', padding: '10px', background: 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))',
              border: 'none', borderRadius: '8px', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            }}>
              {loading ? 'Updating...' : 'Update Balance'}
            </button>
          </div>
        </div>
      )}

      {/* ── SUPPORT ── */}
      {tab === 'support' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Support Requests ({supportRequests.length})</h2>
            <button onClick={fetchSupport} style={{
              padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
              background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer',
            }}>Refresh</button>
          </div>

          {supportRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              No support requests yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {supportRequests.map(r => {
                const statusColor = r.status === 'open' ? 'var(--accent-green)' : r.status === 'replied' ? '#22c55e' : '#6366f1'
                const statusBg = r.status === 'open' ? 'rgba(16,185,129,0.1)' : r.status === 'replied' ? 'rgba(34,197,94,0.12)' : 'rgba(99,102,241,0.12)'
                return (
                  <div key={r.id} style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${r.status === 'open' ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`,
                    borderRadius: '16px', padding: '20px',
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '2px' }}>{r.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{r.email}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                          color: statusColor, background: statusBg,
                        }}>{r.status.toUpperCase()}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {new Date(r.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Message */}
                    <div style={{
                      background: 'var(--bg-secondary)', borderRadius: '10px',
                      padding: '14px', fontSize: '14px', lineHeight: 1.7,
                      color: 'var(--text-primary)', marginBottom: '14px',
                    }}>
                      {r.message}
                    </div>

                    {/* Existing reply */}
                    {r.admin_reply && (
                      <div style={{
                        background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)',
                        borderRadius: '10px', padding: '12px', marginBottom: '14px',
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-green)', marginBottom: '4px' }}>Your Reply</div>
                        <div style={{ fontSize: '13px', lineHeight: 1.6 }}>{r.admin_reply}</div>
                      </div>
                    )}

                    {/* Reply box */}
                    {r.status !== 'closed' && (
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                        <textarea
                          value={replyText[r.id] || ''}
                          onChange={e => setReplyText(prev => ({ ...prev, [r.id]: e.target.value }))}
                          placeholder="Write your reply..."
                          rows={2}
                          style={{
                            flex: 1, padding: '10px 12px',
                            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                            borderRadius: '10px', color: 'var(--text-primary)',
                            fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                          }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <button
                            onClick={() => replyToTicket(r.id, r.status)}
                            disabled={replyLoading === r.id}
                            style={{
                              padding: '9px 16px', borderRadius: '8px',
                              background: 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))',
                              border: 'none', color: '#000', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {replyLoading === r.id ? '...' : 'Reply'}
                          </button>
                          <button
                            onClick={() => closeTicket(r.id)}
                            style={{
                              padding: '9px 16px', borderRadius: '8px',
                              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                              color: '#6366f1', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
