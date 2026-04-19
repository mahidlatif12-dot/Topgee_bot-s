import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TradingViewChart from '@/components/TradingViewChart'
import RealtimeDashboard from '@/components/RealtimeDashboard'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const adminSupabase = await createAdminClient()

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: transactions } = await adminSupabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const balance = profile?.balance || 0
  const deposited = profile?.total_deposited || 0
  const profit = profile?.total_profit || 0
  const kycStatus = profile?.kyc_status || 'none'
  const isAdmin = profile?.is_admin || false
  const kycVerified = kycStatus === 'verified' || isAdmin

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Investor'} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Here&apos;s your portfolio overview
          </p>
        </div>
        <Link href="/dashboard/kyc" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 14px', borderRadius: '100px', textDecoration: 'none', fontSize: '12px', fontWeight: 600,
          background: kycVerified ? 'rgba(0,212,160,0.15)' : kycStatus === 'pending' ? 'rgba(245,158,11,0.15)' : 'rgba(255,68,68,0.15)',
          color: kycVerified ? 'var(--accent-green)' : kycStatus === 'pending' ? '#f59e0b' : 'var(--accent-red)',
          border: `1px solid ${kycVerified ? 'rgba(0,212,160,0.3)' : kycStatus === 'pending' ? 'rgba(245,158,11,0.3)' : 'rgba(255,68,68,0.3)'}`,
        }}>
          {kycVerified ? '✅ KYC Verified' : kycStatus === 'pending' ? '⏳ KYC Pending' : '⚠️ KYC Required'}
        </Link>
      </div>

      {/* KYC Warning Banner */}
      {!kycVerified && (
        <Link href="/dashboard/kyc" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', textDecoration: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🔒</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b' }}>Identity Verification Required</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Complete KYC to unlock deposits and withdrawals</div>
            </div>
          </div>
          <span style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 600 }}>Verify Now →</span>
        </Link>
      )}

      {/* Real-time Stats + Transactions */}
      <RealtimeDashboard
        userId={user.id}
        initialProfile={{
          balance,
          total_deposited: deposited,
          total_profit: profit,
          total_withdrawn: profile?.total_withdrawn || 0,
          kyc_status: kycStatus,
        }}
        initialTransactions={transactions || []}
      />

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '12px', margin: '28px 0' }}>
        <Link href="/dashboard/deposit" style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px', background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          borderRadius: '8px', color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 600,
        }}>
          <ArrowDownCircle size={16} /> Deposit Funds
        </Link>
        <Link href="/dashboard/withdraw" style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '8px', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '14px', fontWeight: 600,
        }}>
          <ArrowUpCircle size={16} /> Withdraw
        </Link>
      </div>

      {/* TradingView Chart */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '20px', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700 }}>XAUUSD — Gold Chart</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Live market data</p>
          </div>
          <div style={{
            padding: '4px 10px', borderRadius: '100px',
            background: 'rgba(0,212,160,0.15)', color: 'var(--accent-green)',
            fontSize: '12px', fontWeight: 600,
          }}>● LIVE</div>
        </div>
        <TradingViewChart />
      </div>
    </div>
  )
}
