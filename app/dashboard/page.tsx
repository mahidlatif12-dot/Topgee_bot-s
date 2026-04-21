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
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Investor'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Here&apos;s your portfolio overview
          </p>
        </div>
        <Link href="/dashboard/kyc" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 14px', borderRadius: '100px', textDecoration: 'none', fontSize: '12px', fontWeight: 600,
          background: kycVerified ? 'rgba(0,212,160,0.15)' : kycStatus === 'pending' ? 'rgba(16,185,129,0.1)' : 'rgba(255,68,68,0.15)',
          color: kycVerified ? 'var(--accent-green)' : kycStatus === 'pending' ? 'var(--accent-green)' : 'var(--accent-red)',
          border: `1px solid ${kycVerified ? 'rgba(0,212,160,0.3)' : kycStatus === 'pending' ? 'rgba(16,185,129,0.25)' : 'rgba(255,68,68,0.3)'}`,
        }}>
          {kycVerified ? 'KYC Verified' : kycStatus === 'pending' ? 'KYC Pending' : 'KYC Required'}
        </Link>
      </div>

      {/* KYC Warning Banner */}
      {!kycVerified && (
        <Link href="/dashboard/kyc" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', textDecoration: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: 'var(--accent-green)', fontWeight: 700 }}>!</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-green)' }}>Identity Verification Required</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Complete KYC to unlock deposits and withdrawals</div>
            </div>
          </div>
          <span style={{ color: 'var(--accent-green)', fontSize: '13px', fontWeight: 600 }}>Verify Now →</span>
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
          padding: '10px 20px', background: 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))',
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
      <div style={{ position: 'relative' }}>
        {/* Header row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '12px', flexWrap: 'wrap', gap: '8px',
        }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.3px' }}>XAU / USD</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Gold &middot; Spot Price</div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px', borderRadius: '100px',
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.15)',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#22c55e', boxShadow: '0 0 6px #22c55e',
              display: 'inline-block',
              animation: 'livePulse 2s infinite',
            }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#22c55e' }}>LIVE</span>
          </div>
        </div>

        {/* Chart — faded edges */}
        <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
          <TradingViewChart />
          {/* Fade top */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '60px', pointerEvents: 'none',
            background: 'linear-gradient(to bottom, var(--bg-primary) 0%, transparent 100%)',
            zIndex: 3,
          }} />
          {/* Fade bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', pointerEvents: 'none',
            background: 'linear-gradient(to top, var(--bg-primary) 0%, transparent 100%)',
            zIndex: 3,
          }} />
          {/* Fade left */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: '60px', pointerEvents: 'none',
            background: 'linear-gradient(to right, var(--bg-primary) 0%, transparent 100%)',
            zIndex: 3,
          }} />
          {/* Fade right */}
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: '60px', pointerEvents: 'none',
            background: 'linear-gradient(to left, var(--bg-primary) 0%, transparent 100%)',
            zIndex: 3,
          }} />
        </div>

        <style>{`
          @keyframes livePulse {
            0%,100%{opacity:1;box-shadow:0 0 6px #22c55e}
            50%{opacity:0.5;box-shadow:0 0 2px #22c55e}
          }
          /* Hide TradingView branding bar */
          .tradingview-widget-copyright { display: none !important; }
        `}</style>
      </div>
    </div>
  )
}
