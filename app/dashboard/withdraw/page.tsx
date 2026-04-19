'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { CheckCircle, Clock, XCircle, ArrowUpCircle } from 'lucide-react'

const METHODS = ['EasyPaisa', 'JazzCash', 'Bank Transfer', 'USDT (TRC20)']

interface Withdrawal {
  id: string
  amount: number
  method: string
  account_details: string
  status: string
  created_at: string
}

export default function WithdrawPage() {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('EasyPaisa')
  const [accountDetails, setAccountDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState(0)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [kycStatus, setKycStatus] = useState<string>('loading')
  const supabase = createClient()

  useEffect(() => { loadData(); checkKyc() }, [])

  async function checkKyc() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('kyc_status, is_admin').eq('id', user.id).single()
    if (data?.is_admin) { setKycStatus('verified'); return }
    setKycStatus(data?.kyc_status || 'none')
  }

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('balance').eq('id', user.id).single()
    setBalance(profile?.balance || 0)
    const { data } = await supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setWithdrawals(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt < 10) return toast.error('Minimum withdrawal is $10')
    if (amt > balance) return toast.error(`Insufficient balance. Available: $${balance.toFixed(2)}`)
    if (!accountDetails.trim()) return toast.error('Please enter your account details')

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return toast.error('Not logged in') }

    const { error } = await supabase.from('withdrawals').insert({
      user_id: user.id,
      amount: amt,
      method,
      account_details: accountDetails,
      status: 'pending',
    })

    setLoading(false)
    if (error) return toast.error('Failed to submit withdrawal request')
    toast.success('Withdrawal request submitted! Will be processed within 24 hours.')
    setAmount('')
    setAccountDetails('')
    loadData()
  }

  function statusBadge(status: string) {
    const map: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
      pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: <Clock size={12} />, label: 'PENDING' },
      processing: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: <Clock size={12} />, label: 'PROCESSING' },
      paid: { color: 'var(--accent-green)', bg: 'rgba(0,212,160,0.15)', icon: <CheckCircle size={12} />, label: 'PAID' },
      rejected: { color: 'var(--accent-red)', bg: 'rgba(255,68,68,0.15)', icon: <XCircle size={12} />, label: 'REJECTED' },
    }
    const s = map[status] || map.pending
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
        color: s.color, background: s.bg,
      }}>
        {s.icon} {s.label}
      </span>
    )
  }

  const placeholderMap: Record<string, string> = {
    'EasyPaisa': '03XX-XXXXXXX (your EasyPaisa number)',
    'JazzCash': '03XX-XXXXXXX (your JazzCash number)',
    'Bank Transfer': 'Bank name, account number, IBAN',
    'USDT (TRC20)': 'Your TRC20 USDT wallet address',
  }

  if (kycStatus !== 'loading' && kycStatus !== 'verified') {
    return (
      <div style={{ padding: '32px', maxWidth: '600px' }}>
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: '16px', padding: '40px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', color: '#f59e0b' }}>KYC Verification Required</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
            {kycStatus === 'pending'
              ? 'Your KYC is under review. Withdrawals will be unlocked once verified.'
              : 'You need to complete identity verification before making withdrawals.'}
          </p>
          {kycStatus !== 'pending' && (
            <a href="/dashboard/kyc" style={{
              display: 'inline-block', padding: '12px 28px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              borderRadius: '8px', color: 'white', textDecoration: 'none',
              fontSize: '14px', fontWeight: 700,
            }}>Complete KYC Now →</a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Withdraw Funds</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>
        Request a withdrawal — processed within 24 hours
      </p>

      {/* Balance Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,212,160,0.15), rgba(245,158,11,0.1))',
        border: '1px solid rgba(0,212,160,0.3)',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Available Balance</p>
          <p style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent-green)' }}>${balance.toFixed(2)}</p>
        </div>
        <ArrowUpCircle size={40} style={{ color: 'var(--accent-green)', opacity: 0.5 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Amount (USD)
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Minimum $10"
              min="10"
              max={balance}
              step="0.01"
              required
              style={{
                width: '100%', padding: '12px 16px',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '8px', color: 'var(--text-primary)', fontSize: '15px', outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => setAmount(balance.toString())}
              style={{
                marginTop: '6px',
                background: 'none',
                border: 'none',
                color: '#f59e0b',
                fontSize: '12px',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Withdraw all (${balance.toFixed(2)})
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Withdrawal Method
            </label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
              }}
            >
              {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Account Details
            </label>
            <textarea
              value={accountDetails}
              onChange={e => setAccountDetails(e.target.value)}
              placeholder={placeholderMap[method]}
              rows={3}
              required
              style={{
                width: '100%', padding: '12px 16px',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px',
              background: loading ? '#4a4a6a' : 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none', borderRadius: '8px', color: 'white',
              fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
          </button>
        </form>

        {/* Info */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Withdrawal Info</h3>
          {[
            { icon: '⏱️', title: 'Processing Time', desc: 'Withdrawals are processed within 24 hours on business days.' },
            { icon: '💰', title: 'Minimum Amount', desc: 'Minimum withdrawal amount is $10.' },
            { icon: '📋', title: 'Account Details', desc: 'Make sure to provide correct account details to avoid delays.' },
            { icon: '✅', title: 'Confirmation', desc: "You'll receive a notification once your withdrawal is processed." },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>{item.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Withdrawal History */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Withdrawal History</h3>
        {withdrawals.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '24px' }}>
            No withdrawals yet
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Amount', 'Method', 'Account', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '12px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(w => (
                  <tr key={w.id} style={{ borderBottom: '1px solid rgba(42,42,58,0.5)' }}>
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--accent-red)' }}>-${w.amount.toFixed(2)}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{w.method}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {w.account_details}
                    </td>
                    <td style={{ padding: '12px' }}>{statusBadge(w.status)}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {new Date(w.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
