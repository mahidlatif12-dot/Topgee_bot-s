'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Copy, CheckCircle, Loader } from 'lucide-react'

export default function USDTDeposit() {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [payment, setPayment] = useState<{
    payAddress: string
    payAmount: number
    payCurrency: string
    paymentId: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  async function createPayment() {
    const amt = parseFloat(amount)
    if (!amt || amt < 10) return toast.error('Minimum deposit is $10')
    setLoading(true)
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || 'Failed to create payment')
      setPayment(data)
      toast.success('Payment address generated!')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function copyAddress() {
    if (!payment) return
    navigator.clipboard.writeText(payment.payAddress)
    setCopied(true)
    toast.success('Address copied!')
    setTimeout(() => setCopied(false), 3000)
  }

  if (payment) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{
          background: 'rgba(0,212,160,0.08)', border: '1px solid rgba(0,212,160,0.25)',
          borderRadius: '12px', padding: '20px', marginBottom: '16px',
        }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Send exactly this amount:
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--accent-green)', marginBottom: '4px' }}>
            {payment.payAmount} USDT
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>TRC20 Network only</div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            To this wallet address:
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '12px 14px',
          }}>
            <span style={{ fontFamily: 'monospace', fontSize: '13px', flex: 1, wordBreak: 'break-all', color: 'var(--text-primary)' }}>
              {payment.payAddress}
            </span>
            <button onClick={copyAddress} style={{
              background: copied ? 'rgba(0,212,160,0.15)' : 'rgba(245,158,11,0.15)',
              border: 'none', borderRadius: '6px', padding: '6px 10px',
              cursor: 'pointer', color: copied ? 'var(--accent-green)' : '#f59e0b',
              display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600,
              flexShrink: 0,
            }}>
              {copied ? <><CheckCircle size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>
        </div>

        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#f59e0b', lineHeight: 1.6,
        }}>
          ⚠️ Send <strong>exactly {payment.payAmount} USDT</strong> on <strong>TRC20 network only</strong>.
          Your balance will be credited automatically once confirmed on blockchain (usually 1-3 minutes).
        </div>

        <button onClick={() => { setPayment(null); setAmount('') }} style={{
          marginTop: '16px', width: '100%', padding: '10px',
          background: 'transparent', border: '1px solid var(--border)',
          borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer',
        }}>
          ← Make another deposit
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
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
          style={{
            width: '100%', padding: '12px 16px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '8px', color: 'var(--text-primary)', fontSize: '15px', outline: 'none',
          }}
        />
      </div>

      <div style={{
        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)',
        borderRadius: '8px', padding: '12px', fontSize: '12px', color: 'var(--text-secondary)',
        marginBottom: '16px', lineHeight: 1.6,
      }}>
        💎 You will receive a unique USDT TRC20 address. Send the exact amount and your balance will be credited <strong style={{ color: '#f59e0b' }}>automatically</strong>.
      </div>

      <button
        onClick={createPayment}
        disabled={loading}
        style={{
          width: '100%', padding: '13px',
          background: loading ? '#4a4a6a' : 'linear-gradient(135deg, #f59e0b, #d97706)',
          border: 'none', borderRadius: '8px', color: 'white',
          fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}
      >
        {loading ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating address...</> : '💎 Generate USDT Address'}
      </button>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
