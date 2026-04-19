import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TradingViewChart from '@/components/TradingViewChart'
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, DollarSign } from 'lucide-react'

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
  const roi = deposited > 0 ? ((profit / deposited) * 100).toFixed(2) : '0.00'

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Investor'} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Here&apos;s your portfolio overview
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
      }}>
        {[
          {
            label: 'Current Balance',
            value: `$${balance.toFixed(2)}`,
            icon: <DollarSign size={20} />,
            color: 'var(--accent-green)',
            bg: 'rgba(0,212,160,0.1)',
          },
          {
            label: 'Total Deposited',
            value: `$${deposited.toFixed(2)}`,
            icon: <ArrowDownCircle size={20} />,
            color: 'var(--accent-indigo)',
            bg: 'rgba(99,102,241,0.1)',
          },
          {
            label: 'Total Profit',
            value: `$${profit.toFixed(2)}`,
            icon: <TrendingUp size={20} />,
            color: 'var(--accent-green)',
            bg: 'rgba(0,212,160,0.1)',
          },
          {
            label: 'ROI',
            value: `${roi}%`,
            icon: <TrendingUp size={20} />,
            color: Number(roi) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
            bg: Number(roi) >= 0 ? 'rgba(0,212,160,0.1)' : 'rgba(255,68,68,0.1)',
          },
        ].map((card, i) => (
          <div key={i} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: card.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: card.color,
              marginBottom: '12px',
            }}>{card.icon}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: card.color, marginBottom: '4px' }}>
              {card.value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
        <Link href="/dashboard/deposit" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          background: 'linear-gradient(135deg, #6366f1, #4f51e0)',
          borderRadius: '8px',
          color: 'white',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 600,
        }}>
          <ArrowDownCircle size={16} /> Deposit Funds
        </Link>
        <Link href="/dashboard/withdraw" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          color: 'var(--text-primary)',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 600,
        }}>
          <ArrowUpCircle size={16} /> Withdraw
        </Link>
      </div>

      {/* TradingView Chart */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '28px',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700 }}>XAUUSD — Gold Chart</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Live market data</p>
          </div>
          <div style={{
            padding: '4px 10px',
            borderRadius: '100px',
            background: 'rgba(0,212,160,0.15)',
            color: 'var(--accent-green)',
            fontSize: '12px',
            fontWeight: 600,
          }}>● LIVE</div>
        </div>
        <TradingViewChart />
      </div>

      {/* Recent Transactions */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '20px',
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Recent Transactions</h2>
        {(!transactions || transactions.length === 0) ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--text-secondary)',
            fontSize: '14px',
          }}>
            No transactions yet. <Link href="/dashboard/deposit" style={{ color: 'var(--accent-indigo)' }}>Make your first deposit →</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Type', 'Amount', 'Description', 'Date'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '12px',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx: { id: string; type: string; amount: number; description: string; created_at: string }) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(42,42,58,0.5)' }}>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: tx.type === 'deposit' ? 'rgba(99,102,241,0.15)' :
                          tx.type === 'profit' ? 'rgba(0,212,160,0.15)' : 'rgba(255,68,68,0.15)',
                        color: tx.type === 'deposit' ? 'var(--accent-indigo)' :
                          tx.type === 'profit' ? 'var(--accent-green)' : 'var(--accent-red)',
                      }}>
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{
                      padding: '12px',
                      fontWeight: 600,
                      color: tx.type === 'withdrawal' ? 'var(--accent-red)' : 'var(--accent-green)',
                    }}>
                      {tx.type === 'withdrawal' ? '-' : '+'}${tx.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{tx.description}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {new Date(tx.created_at).toLocaleDateString('en-PK', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
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
