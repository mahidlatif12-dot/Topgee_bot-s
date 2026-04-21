'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { CheckCircle, Clock, XCircle } from 'lucide-react'
import USDTDeposit from '@/components/USDTDeposit'

const METHODS = ['EasyPaisa', 'JazzCash', 'Bank Transfer']

const METHOD_DETAILS: Record<string, React.ReactNode> = {
  'EasyPaisa': (
    <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '16px', fontSize: '14px', lineHeight: 1.8 }}>
      <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--accent-green)' }}>📱 EasyPaisa Details</div>
      <div>Account Name: <strong>Muhammad Ahmed</strong></div>
      <div>Account Number: <strong>0300-1234567</strong></div>
      <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>Send the exact amount and upload a screenshot as proof.</div>
    </div>
  ),
  'JazzCash': (
    <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '16px', fontSize: '14px', lineHeight: 1.8 }}>
      <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--accent-green)' }}>📱 JazzCash Details</div>
      <div>Account Name: <strong>Muhammad Ahmed</strong></div>
      <div>Account Number: <strong>0311-7654321</strong></div>
      <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>Send the exact amount and upload a screenshot as proof.</div>
    </div>
  ),
  'Bank Transfer': (
    <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '16px', fontSize: '14px', lineHeight: 1.8 }}>
      <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--accent-green)' }}>🏦 Bank Transfer Details</div>
      <div>Bank: <strong>Meezan Bank</strong></div>
      <div>Account Title: <strong>Muhammad Ahmed</strong></div>
      <div>Account Number: <strong>0123456789012345</strong></div>
      <div>IBAN: <strong>PK36MEZN0001234567890123</strong></div>
      <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>Upload deposit slip or screenshot as proof.</div>
    </div>
  ),
  'USDT (TRC20)': (
    <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '16px', fontSize: '14px', lineHeight: 1.8 }}>
      <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--accent-green)' }}>💎 USDT TRC20 Wallet</div>
      <div style={{ fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all', background: 'var(--bg-secondary)', padding: '10px', borderRadius: '6px', marginTop: '4px' }}>
        TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      </div>
      <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>Send USDT on TRC20 network only. Upload transaction hash screenshot as proof.</div>
    </div>
  ),
}

interface Deposit {
  id: string
  amount: number
  method: string
  status: string
  created_at: string
}

export default function DepositPage() {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('EasyPaisa')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [activeTab, setActiveTab] = useState('USDT (Auto)')
  const supabase = createClient()

  useEffect(() => {
    fetchDeposits()
  }, [])

  async function fetchDeposits() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setDeposits(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt < 10) return toast.error('Minimum deposit is $10')
    if (!proofFile) return toast.error('Please upload proof of payment')

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return toast.error('Not logged in') }

    const form = new FormData()
    form.append('userId', user.id)
    form.append('amount', String(amt))
    form.append('method', method)
    form.append('proof', proofFile)

    const res = await fetch('/api/deposits/upload-proof', { method: 'POST', body: form })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) return toast.error(data.error || 'Failed to submit deposit')
    toast.success('Deposit request submitted! We will verify within 24 hours.')
    setAmount('')
    setProofFile(null)
    fetchDeposits()
  }

  function statusBadge(status: string) {
    const map: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
      pending: { color: 'var(--accent-green)', bg: 'rgba(16,185,129,0.1)', icon: <Clock size={12} /> },
      approved: { color: 'var(--accent-green)', bg: 'rgba(0,212,160,0.15)', icon: <CheckCircle size={12} /> },
      rejected: { color: 'var(--accent-red)', bg: 'rgba(255,68,68,0.15)', icon: <XCircle size={12} /> },
    }
    const s = map[status] || map.pending
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
        color: s.color, background: s.bg,
      }}>
        {s.icon} {status.toUpperCase()}
      </span>
    )
  }

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 32px)', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Deposit Funds</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
        Choose your deposit method
      </p>

      {/* Method Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {['USDT (Auto)', 'Manual Payment'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 18px', borderRadius: '8px', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600,
            background: activeTab === tab ? 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))' : 'var(--bg-card)',
            color: activeTab === tab ? 'white' : 'var(--text-secondary)',
            border: activeTab === tab ? 'none' : '1px solid var(--border)',
          }}>{tab}</button>
        ))}
      </div>

      {/* USDT Auto Tab */}
      {activeTab === 'USDT (Auto)' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', marginBottom: '32px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>💎 USDT Deposit (Automatic)</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Balance credited automatically after blockchain confirmation</div>
          </div>
          <USDTDeposit />
        </div>
      )}

      {/* Manual Payment Tab */}
      {activeTab === 'Manual Payment' && (<>
      <style>{`@media(max-width:767px){.deposit-grid{grid-template-columns:1fr!important}}`}</style>
      <div className="deposit-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
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
              step="0.01"
              required
              style={{
                width: '100%', padding: '12px 16px',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '8px', color: 'var(--text-primary)', fontSize: '15px', outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Payment Method
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
              Proof of Payment
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={e => setProofFile(e.target.files?.[0] || null)}
              required
              style={{
                width: '100%', padding: '10px',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '13px',
              }}
            />
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Upload screenshot or receipt
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px',
              background: loading ? '#4a4a6a' : 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))',
              border: 'none', borderRadius: '8px', color: 'white',
              fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Submitting...' : 'Submit Deposit Request'}
          </button>
        </form>

        {/* Payment Instructions */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>
            Payment Instructions
          </h3>
          {METHOD_DETAILS[method]}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(16,185,129,0.07)',
            border: '1px solid rgba(16,185,129,0.15)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--accent-green)',
          }}>
            ⚠️ Deposits are verified within 24 hours. Your balance will be updated once confirmed.
          </div>
        </div>
      </div>

      </>)}

      {/* Deposit History */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Deposit History</h3>
        {deposits.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '24px' }}>
            No deposits yet
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Amount', 'Method', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '12px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deposits.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid rgba(42,42,58,0.5)' }}>
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--accent-green)' }}>${d.amount.toFixed(2)}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{d.method}</td>
                    <td style={{ padding: '12px' }}>{statusBadge(d.status)}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {new Date(d.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
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
