'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowRight, Users, DollarSign, TrendingUp, Star, Zap, Gift } from 'lucide-react'

const GoldParticles = dynamic(() => import('@/components/GoldParticles'), { ssr: false })

function CountUpAnim({ end, duration = 2000, prefix = '', suffix = '' }: { end: number; duration?: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setVal(Math.floor(e * end))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [end, duration])
  return <span>{prefix}{val.toLocaleString()}{suffix}</span>
}

// Live referral feed ticker
const NAMES = ['Ali K.', 'Sara M.', 'Usman R.', 'Fatima A.', 'Hassan B.', 'Zara N.', 'Omar Q.', 'Ayesha T.']
function LiveFeed() {
  const [items, setItems] = useState<{ name: string; amount: string; time: string }[]>([
    { name: 'Ali K.', amount: '$12.50', time: '2 min ago' },
    { name: 'Sara M.', amount: '$8.00', time: '5 min ago' },
    { name: 'Hassan B.', amount: '$25.00', time: '12 min ago' },
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      const name = NAMES[Math.floor(Math.random() * NAMES.length)]
      const amount = `$${(Math.random() * 30 + 5).toFixed(2)}`
      setItems(prev => [{ name, amount, time: 'just now' }, ...prev.slice(0, 4)])
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '10px',
          animation: i === 0 ? 'slideIn 0.4s ease' : 'none',
          transition: 'all 0.3s',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'linear-gradient(135deg,var(--accent-green),var(--accent-green-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 800, color: '#000', flexShrink: 0,
          }}>{item.name[0]}</div>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 600, fontSize: '13px' }}>{item.name}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}> earned </span>
            <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '13px' }}>{item.amount}</span>
          </div>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{item.time}</span>
        </div>
      ))}
    </div>
  )
}

export default function ReferralLandingPage() {
  const { code } = useParams()
  const router = useRouter()
  const [scrollY, setScrollY] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    // Save referral code to localStorage
    if (code) localStorage.setItem('ref_code', code as string)
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [code])

  return (
    <div style={{ background: '#030305', minHeight: '100vh', color: '#fff', overflowX: 'hidden' }}>
      <GoldParticles />

      {/* Ambient glows */}
      <div style={{ position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '600px', background: 'radial-gradient(ellipse, rgba(16,185,129,0.1) 0%, transparent 65%)', pointerEvents: 'none', filter: 'blur(40px)', zIndex: 0 }} />

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px',
        background: scrollY > 20 ? 'rgba(3,3,5,0.95)' : 'transparent',
        backdropFilter: scrollY > 20 ? 'blur(24px)' : 'none',
        borderBottom: scrollY > 20 ? '1px solid rgba(16,185,129,0.08)' : '1px solid transparent',
        transition: 'all 0.3s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg,var(--accent-green),#92400e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>💰</div>
          <span style={{ fontSize: '18px', fontWeight: 800, background: 'linear-gradient(135deg,var(--accent-green-light),var(--accent-green))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Topgee Capital</span>
        </div>
        <Link href={`/auth/signup?ref=${code}`} style={{
          padding: '9px 22px', borderRadius: '10px',
          background: 'linear-gradient(135deg,var(--accent-green),var(--accent-green-dark))',
          color: '#000', textDecoration: 'none', fontSize: '14px', fontWeight: 700,
          boxShadow: '0 0 20px rgba(16,185,129,0.3)',
        }}>Join Now 🚀</Link>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '100px 24px 60px', textAlign: 'center',
        position: 'relative', zIndex: 1,
      }}>
        {/* Special invite badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '8px 20px', borderRadius: '100px',
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(245,158,11,0.35)',
          marginBottom: '28px',
          animation: 'fadeInDown 0.8s ease both',
        }}>
          <Gift size={15} style={{ color: 'var(--accent-green)' }} />
          <span style={{ fontSize: '13px', color: 'var(--accent-green-light)', fontWeight: 600 }}>
            🎉 You've been personally invited!
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(40px, 7vw, 88px)', fontWeight: 900,
          lineHeight: 1.0, letterSpacing: '-3px', marginBottom: '20px',
          animation: 'fadeInUp 1s ease 0.1s both',
        }}>
          <span style={{ color: '#fff' }}>Invest Smart.</span><br />
          <span style={{
            background: 'linear-gradient(135deg,var(--accent-green) 0%,var(--accent-green-light) 40%,var(--accent-green) 80%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundSize: '200% auto', animation: 'shimmer 4s linear infinite',
          }}>Earn Together.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(15px,2vw,20px)', color: 'rgba(255,255,255,0.5)',
          maxWidth: '540px', lineHeight: 1.8, marginBottom: '40px',
          animation: 'fadeInUp 1s ease 0.25s both',
        }}>
          Your friend invited you to Topgee Capital — where your money works for you 24/7 through professional Gold trading.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', animation: 'fadeInUp 1s ease 0.4s both', width: '100%', maxWidth: '380px' }}>
          <Link href={`/auth/signup?ref=${code}`} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            padding: '18px 40px', borderRadius: '14px', width: '100%',
            background: 'linear-gradient(135deg,var(--accent-green),var(--accent-green-dark))',
            color: '#000', textDecoration: 'none', fontSize: '18px', fontWeight: 800,
            boxShadow: '0 0 50px rgba(245,158,11,0.5)',
            letterSpacing: '-0.3px',
          }}>
            🚀 Claim Your Spot <ArrowRight size={20} />
          </Link>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
            Free to join · No hidden fees · Withdraw anytime
          </p>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: isMobile ? '16px' : '32px', marginTop: isMobile ? '36px' : '56px',
          animation: 'fadeInUp 1s ease 0.6s both',
        }}>
          {[
            { icon: <Users size={18} />, value: '1,200+', label: 'Active Investors' },
            { icon: <TrendingUp size={18} />, value: '8–15%', label: 'Monthly Return' },
            { icon: <DollarSign size={18} />, value: '$4.8M+', label: 'Volume Traded' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', color: 'var(--accent-green)', marginBottom: '4px' }}>{s.icon}</div>
              <div style={{ fontSize: '22px', fontWeight: 900, background: 'linear-gradient(135deg,var(--accent-green),var(--accent-green-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section style={{ position: 'relative', zIndex: 1, padding: isMobile ? '0 16px 60px' : '0 24px 100px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--accent-green)', marginBottom: '12px' }}>What You Get</p>
          <h2 style={{ fontSize: 'clamp(30px,5vw,56px)', fontWeight: 900, letterSpacing: '-1.5px', background: 'linear-gradient(180deg,#fff 0%,rgba(255,255,255,0.55) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Why join through a referral?
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '16px' }}>
          {[
            { icon: '💰', title: 'Instant Returns', desc: 'Start earning from day one. 8–15% monthly returns on your deposit.' },
            { icon: '🔗', title: 'Earn by Referring', desc: 'Get 0.5% of every deposit your referrals make — forever.' },
            { icon: '🏆', title: 'Referral Challenges', desc: 'Refer 100 people and earn a $100 cash bonus on top of commissions.' },
            { icon: '⚡', title: 'Withdraw Anytime', desc: 'Your money is always yours. Withdraw within 24 hours, any time.' },
          ].map((f, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px', padding: '28px', transition: 'transform 0.3s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'none'}
            >
              <div style={{ fontSize: '32px', marginBottom: '14px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LIVE EARNINGS FEED */}
      <section style={{ position: 'relative', zIndex: 1, padding: isMobile ? '0 16px 60px' : '0 24px 100px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '100px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', marginBottom: '16px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e', animation: 'pulse 2s infinite', display: 'inline-block' }} />
            <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>Live Referral Earnings</span>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px' }}>People are earning right now</h2>
        </div>
        <LiveFeed />
      </section>

      {/* CTA */}
      <section style={{ position: 'relative', zIndex: 1, padding: isMobile ? '0 16px 60px' : '0 24px 100px', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{
          borderRadius: '28px', padding: '64px 40px', textAlign: 'center',
          background: 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(3,3,5,0.95),rgba(217,119,6,0.08))',
          border: '1px solid rgba(16,185,129,0.15)', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '500px', height: '300px', background: 'radial-gradient(ellipse,rgba(16,185,129,0.1) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <h2 style={{ fontSize: 'clamp(28px,5vw,52px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: '12px', background: 'linear-gradient(135deg,#fff 0%,var(--accent-green-light) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Your friend is waiting 👋
            </h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.45)', marginBottom: '36px', lineHeight: 1.7 }}>
              Join through their referral link and both of you benefit.
            </p>
            <Link href={`/auth/signup?ref=${code}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '18px 48px', borderRadius: '14px',
              background: 'linear-gradient(135deg,var(--accent-green),var(--accent-green-dark))',
              color: '#000', textDecoration: 'none', fontSize: '18px', fontWeight: 800,
              boxShadow: '0 0 60px rgba(245,158,11,0.5)',
            }}>
              Create Free Account <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>© 2025 Topgee Capital. Trading involves risk.</p>
      </footer>

      <style>{`
        @keyframes fadeInDown { from{opacity:0;transform:translateY(-24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { from{background-position:0% center} to{background-position:200% center} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing:border-box; margin:0; padding:0; }
      `}</style>
    </div>
  )
}
