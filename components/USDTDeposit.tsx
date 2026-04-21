'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Loader, CheckCircle, XCircle } from 'lucide-react'

export default function USDTDeposit() {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id || null))
    if (status === 'success') toast.success('Payment submitted! Balance will update once confirmed.')
    if (status === 'cancel') toast.error('Payment cancelled.')
  }, [status])

  async function createPayment() {
    const amt = parseFloat(amount)
    if (!amt || amt < 10) return toast.error('Minimum deposit is $10')
    setLoading(true)
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, userId }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || 'Failed to create payment')
      // Redirect to NOWPayments hosted page
      window.location.href = data.invoiceUrl
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      {status === 'success' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(0,212,160,0.1)', border: '1px solid rgba(0,212,160,0.3)',
          borderRadius: '10px', padding: '14px', marginBottom: '16px',
        }}>
          <CheckCircle size={20} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-green)' }}>Payment Submitted!</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Your balance will update automatically once blockchain confirms (1-3 min).</div>
          </div>
        </div>
      )}

      {status === 'cancel' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)',
          borderRadius: '10px', padding: '14px', marginBottom: '16px',
        }}>
          <XCircle size={20} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />
          <div style={{ fontSize: '13px', color: 'var(--accent-red)', fontWeight: 600 }}>Payment cancelled. Try again below.</div>
        </div>
      )}

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
        background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.1)',
        borderRadius: '8px', padding: '12px', fontSize: '12px', color: 'var(--text-secondary)',
        marginBottom: '16px', lineHeight: 1.6,
      }}>
        💎 You will be redirected to NOWPayments secure page to complete your USDT payment.
        Your balance will be credited <strong style={{ color: 'var(--accent-green)' }}>automatically</strong> after confirmation.
      </div>

      <button
        onClick={createPayment}
        disabled={loading}
        style={{
          width: '100%', padding: '13px',
          background: loading ? '#4a4a6a' : 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))',
          border: 'none', borderRadius: '8px', color: 'white',
          fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}
      >
        {loading
          ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Redirecting...</>
          : '💎 Pay with USDT'}
      </button>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
