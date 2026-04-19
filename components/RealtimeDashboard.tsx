'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  balance: number
  total_deposited: number
  total_profit: number
  total_withdrawn: number
  kyc_status: string
}

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  created_at: string
}

interface Props {
  userId: string
  initialProfile: Profile
  initialTransactions: Transaction[]
}

export default function RealtimeDashboard({ userId, initialProfile, initialTransactions }: Props) {
  const [profile, setProfile] = useState<Profile>(initialProfile)
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const supabase = createClient()

  useEffect(() => {
    // Real-time subscription to profile changes
    const profileSub = supabase
      .channel('profile-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`,
      }, (payload) => {
        setProfile(prev => ({ ...prev, ...payload.new }))
      })
      .subscribe()

    // Real-time subscription to new transactions
    const txSub = supabase
      .channel('transaction-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setTransactions(prev => [payload.new as Transaction, ...prev.slice(0, 9)])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(profileSub)
      supabase.removeChannel(txSub)
    }
  }, [userId])

  const balance = profile?.balance || 0
  const deposited = profile?.total_deposited || 0
  const profit = profile?.total_profit || 0
  const roi = deposited > 0 ? ((profit / deposited) * 100).toFixed(2) : '0.00'

  return (
    <>
      {/* Live Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
      }}>
        {[
          { label: 'Current Balance', value: `$${balance.toFixed(2)}`, color: 'var(--accent-green)', bg: 'rgba(0,212,160,0.1)' },
          { label: 'Total Deposited', value: `$${deposited.toFixed(2)}`, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Total Profit', value: `$${profit.toFixed(2)}`, color: 'var(--accent-green)', bg: 'rgba(0,212,160,0.1)' },
          { label: 'ROI', value: `${roi}%`, color: Number(roi) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', bg: Number(roi) >= 0 ? 'rgba(0,212,160,0.1)' : 'rgba(255,68,68,0.1)' },
        ].map((card, i) => (
          <div key={i} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '20px',
          }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: card.color, marginBottom: '4px' }}>
              {card.value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '20px', marginTop: '28px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Recent Transactions</h2>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: 'var(--accent-green)',
            boxShadow: '0 0 6px var(--accent-green)',
            animation: 'pulse 2s infinite',
          }} />
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            No transactions yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Type', 'Amount', 'Description', 'Date'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '12px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(42,42,58,0.5)' }}>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                        background: tx.type === 'deposit' ? 'rgba(245,158,11,0.15)' : tx.type === 'profit' ? 'rgba(0,212,160,0.15)' : 'rgba(255,68,68,0.15)',
                        color: tx.type === 'deposit' ? '#f59e0b' : tx.type === 'profit' ? 'var(--accent-green)' : 'var(--accent-red)',
                      }}>
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600, color: tx.type === 'withdrawal' ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                      {tx.type === 'withdrawal' ? '-' : '+'}${tx.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{tx.description}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {new Date(tx.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
