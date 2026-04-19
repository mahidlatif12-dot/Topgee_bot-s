import Link from 'next/link'
import { TrendingUp, Shield, Zap, Users, DollarSign, BarChart2 } from 'lucide-react'

export default function HomePage() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🤖</span>
          <span style={{
            fontSize: '20px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #6366f1, #00d4a0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Topgee Capital</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/auth/login" style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
          }}>Login</Link>
          <Link href="/auth/signup" style={{
            padding: '8px 20px',
            borderRadius: '8px',
            background: 'var(--accent-indigo)',
            color: 'white',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
          }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        textAlign: 'center',
        padding: '100px 24px 80px',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          borderRadius: '100px',
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.3)',
          color: '#a5b4fc',
          fontSize: '13px',
          fontWeight: 500,
          marginBottom: '24px',
        }}>
          🚀 Professional Automated Trading
        </div>
        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 900,
          lineHeight: 1.1,
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #f0f0f5 0%, #9090a0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Your Capital.<br />
          <span style={{
            background: 'linear-gradient(135deg, #6366f1, #00d4a0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Our Expertise.</span>
        </h1>
        <p style={{
          fontSize: '18px',
          color: 'var(--text-secondary)',
          marginBottom: '40px',
          lineHeight: 1.7,
        }}>
          Topgee Capital manages your investment through professional Forex & Gold (XAUUSD) trading.
          Transparent performance. Real withdrawals. No hidden fees.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/signup" style={{
            padding: '14px 32px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #4f51e0)',
            color: 'white',
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: 700,
            boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
          }}>Start Investing</Link>
          <Link href="/auth/login" style={{
            padding: '14px 32px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: 500,
          }}>Login to Dashboard</Link>
        </div>
      </section>

      {/* Stats */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        maxWidth: '900px',
        margin: '0 auto 80px',
        padding: '0 24px',
      }}>
        {[
          { icon: <Users size={20} />, label: 'Active Investors', value: '1,200+' },
          { icon: <DollarSign size={20} />, label: 'Total Volume Traded', value: '$4.8M+' },
          { icon: <TrendingUp size={20} />, label: 'Avg Monthly Return', value: '8–15%' },
          { icon: <Shield size={20} />, label: 'Uptime', value: '99.9%' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
          }}>
            <div style={{ color: 'var(--accent-indigo)', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{stat.label}</div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section style={{
        maxWidth: '900px',
        margin: '0 auto 80px',
        padding: '0 24px',
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '32px',
          fontWeight: 800,
          marginBottom: '48px',
          color: 'var(--text-primary)',
        }}>How It Works</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
        }}>
          {[
            {
              step: '01',
              icon: <DollarSign size={28} />,
              title: 'Deposit Funds',
              desc: 'Send via EasyPaisa, JazzCash, Bank Transfer, or USDT. Your account is credited after verification.',
            },
            {
              step: '02',
              icon: <BarChart2 size={28} />,
              title: 'We Trade For You',
              desc: 'Our professional team trades Forex & Gold on your behalf. Track live performance on your dashboard.',
            },
            {
              step: '03',
              icon: <Zap size={28} />,
              title: 'Withdraw Anytime',
              desc: 'Request withdrawals anytime. Funds are sent back to your account within 24 hours.',
            },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '32px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '20px',
                fontSize: '48px',
                fontWeight: 900,
                color: 'rgba(99,102,241,0.08)',
              }}>{item.step}</div>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                background: 'rgba(99,102,241,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-indigo)',
                marginBottom: '16px',
              }}>{item.icon}</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>{item.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{
        maxWidth: '900px',
        margin: '0 auto 80px',
        padding: '0 24px',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(0,212,160,0.1))',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '20px',
          padding: '48px',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>Ready to grow your capital?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>Join hundreds of investors already earning with Topgee Capital.</p>
          <Link href="/auth/signup" style={{
            padding: '14px 40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #4f51e0)',
            color: 'white',
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: 700,
            boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
          }}>Create Free Account</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '32px 24px',
        textAlign: 'center',
        color: 'var(--text-secondary)',
        fontSize: '14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '18px' }}>🤖</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Topgee Capital</span>
        </div>
        <p>© 2025 Topgee Capital. All rights reserved. Trading involves risk.</p>
      </footer>
    </div>
  )
}
