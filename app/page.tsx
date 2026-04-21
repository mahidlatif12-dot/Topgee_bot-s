'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, TrendingUp, Shield, Zap, Users, DollarSign, BarChart2, Lock, Clock, ChevronDown } from 'lucide-react'

const CandlestickAnimation = dynamic(() => import('../components/CandlestickAnimation'), { ssr: false })
const Scene3D              = dynamic(() => import('../components/Scene3D'),              { ssr: false })
const CountUp              = dynamic(() => import('../components/CountUp'),              { ssr: false })
const EmeraldParticles     = dynamic(() => import('../components/EmeraldParticles'),     { ssr: false })

// ── Colors ───────────────────────────────────────────────────────────────────
const C = {
  bg:      '#141414',   // deep charcoal
  bgCard:  '#1a1a1a',
  bgHover: '#202020',
  border:  'rgba(255,255,255,0.07)',
  white:   '#ffffff',
  offWhite:'rgba(255,255,255,0.55)',
  em:      '#10b981',   // emerald
  emD:     '#059669',   // emerald dark
  emL:     '#34d399',   // emerald light
  emGlow:  'rgba(16,185,129,0.35)',
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true) }, { threshold: 0.1 })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  return { ref, v }
}

function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, v } = useReveal()
  return (
    <div ref={ref} style={{
      opacity: v ? 1 : 0,
      transform: v ? 'none' : 'translateY(40px)',
      transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      ...style,
    }}>{children}</div>
  )
}

// Live gold price ticker
function GoldTicker() {
  const [price, setPrice] = useState(3327.45)
  const [change, setChange] = useState(+12.30)
  const [pct, setPct] = useState(+0.37)
  useEffect(() => {
    const iv = setInterval(() => {
      const delta = (Math.random() - 0.48) * 1.5
      setPrice(p => +(p + delta).toFixed(2))
      setChange(c => +(c + delta).toFixed(2))
      setPct(p => +(p + (Math.random() - 0.5) * 0.02).toFixed(2))
    }, 2000)
    return () => clearInterval(iv)
  }, [])
  const up = change >= 0
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '16px',
      padding: '10px 20px', borderRadius: '12px',
      background: C.bgCard, border: `1px solid ${C.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: C.em, boxShadow: `0 0 8px ${C.em}`, animation: 'pulse 2s infinite' }} />
        <span style={{ fontSize: '12px', color: C.offWhite, fontWeight: 600, letterSpacing: '1px' }}>XAU/USD</span>
      </div>
      <span style={{ fontSize: '18px', fontWeight: 900, color: C.white, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px' }}>
        ${price.toLocaleString('en', { minimumFractionDigits: 2 })}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: up ? C.em : '#f87171' }}>
          {up ? '+' : ''}{change.toFixed(2)}
        </span>
        <span style={{ fontSize: '11px', color: up ? C.emL : '#fca5a5' }}>
          {up ? '+' : ''}{pct.toFixed(2)}%
        </span>
      </div>
    </div>
  )
}

// Animated profit counter
function ProfitCounter() {
  const [val, setVal] = useState(4812430)
  useEffect(() => {
    const iv = setInterval(() => {
      setVal(v => v + Math.floor(Math.random() * 300 + 50))
    }, 1200)
    return () => clearInterval(iv)
  }, [])
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
      ${val.toLocaleString()}
    </span>
  )
}

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    const onResize = () => setIsMobile(window.innerWidth < 768)
    onResize()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize) }
  }, [])

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.white, overflowX: 'hidden' }}>

      <EmeraldParticles />

      {/* Subtle background texture */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `radial-gradient(circle at 20% 20%, rgba(16,185,129,0.06) 0%, transparent 50%),
                          radial-gradient(circle at 80% 80%, rgba(16,185,129,0.04) 0%, transparent 50%)`,
      }} />

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        height: isMobile ? '60px' : '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 20px' : '0 48px',
        background: scrollY > 10 ? 'rgba(20,20,20,0.95)' : 'transparent',
        backdropFilter: scrollY > 10 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 10 ? `1px solid ${C.border}` : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: C.em, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 16px ${C.emGlow}`,
          }}>
          <img src='/logo.jpeg' alt='Topgee Capital' style={{ width: isMobile ? '36px' : '42px', height: isMobile ? '36px' : '42px', borderRadius: '10px', objectFit: 'cover', boxShadow: '0 0 14px rgba(16,185,129,0.25)' }} />
          </div>
          <span style={{ fontSize: isMobile ? '17px' : '19px', fontWeight: 800, color: C.white, letterSpacing: '-0.5px' }}>
            Topgee<span style={{ color: C.em }}>.</span>Capital
          </span>
        </div>

        {!isMobile && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link href="/auth/login" style={{
              padding: '8px 20px', borderRadius: '8px', border: `1px solid ${C.border}`,
              color: C.offWhite, textDecoration: 'none', fontSize: '14px', fontWeight: 500,
              transition: 'all 0.2s',
            }}>Login</Link>
            <Link href="/auth/signup" style={{
              padding: '9px 22px', borderRadius: '8px',
              background: C.em, color: '#000',
              textDecoration: 'none', fontSize: '14px', fontWeight: 700,
              boxShadow: `0 0 20px ${C.emGlow}`,
            }}>Get Started</Link>
          </div>
        )}

        {isMobile && (
          <button onClick={() => setMenuOpen(v => !v)} style={{ background: 'none', border: 'none', color: C.white, cursor: 'pointer', padding: '8px', fontSize: '20px' }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        )}
      </nav>

      {/* Mobile menu */}
      {isMobile && menuOpen && (
        <div style={{
          position: 'fixed', top: '60px', left: 0, right: 0, zIndex: 190,
          background: 'rgba(20,20,20,0.98)', backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${C.border}`, padding: '20px',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <Link href="/auth/login" onClick={() => setMenuOpen(false)} style={{ padding: '13px', borderRadius: '10px', border: `1px solid ${C.border}`, color: C.white, textDecoration: 'none', fontSize: '15px', textAlign: 'center' }}>Login</Link>
          <Link href="/auth/signup" onClick={() => setMenuOpen(false)} style={{ padding: '13px', borderRadius: '10px', background: C.em, color: '#000', textDecoration: 'none', fontSize: '15px', fontWeight: 700, textAlign: 'center' }}>Get Started →</Link>
        </div>
      )}

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '80px 20px 40px' : '80px 48px 40px',
        textAlign: 'center',
        transform: `translateY(${Math.min(scrollY / 600, 1) * -20}px)`,
        opacity: 1 - Math.min(scrollY / 600, 1) * 0.3,
      }}>
        {/* Live ticker */}
        <div style={{ marginBottom: '32px', animation: 'fadeUp 0.8s ease both' }}>
          <GoldTicker />
        </div>

        {/* Main headline */}
        <h1 style={{
          fontSize: isMobile ? '42px' : 'clamp(52px, 7vw, 96px)',
          fontWeight: 900, lineHeight: 1.0,
          letterSpacing: isMobile ? '-1.5px' : '-3px',
          marginBottom: '20px',
          animation: 'fadeUp 0.9s ease 0.1s both',
        }}>
          <span style={{ color: C.white }}>Your Money.</span><br />
          <span style={{
            color: C.em,
            textShadow: `0 0 60px ${C.emGlow}`,
          }}>Working 24/7.</span>
        </h1>

        <p style={{
          fontSize: isMobile ? '15px' : '19px',
          color: C.offWhite, maxWidth: '520px',
          lineHeight: 1.75, marginBottom: '36px',
          animation: 'fadeUp 0.9s ease 0.2s both',
        }}>
          Professional Gold (XAUUSD) trading managed by experts.
          Transparent returns, real withdrawals, no hidden fees.
        </p>

        {/* CTAs */}
        <div style={{
          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
          gap: '12px', width: isMobile ? '100%' : 'auto',
          maxWidth: isMobile ? '320px' : 'none',
          animation: 'fadeUp 0.9s ease 0.3s both',
        }}>
          <Link href="/auth/signup" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '15px 36px', borderRadius: '10px',
            background: C.em, color: '#000', textDecoration: 'none',
            fontSize: '16px', fontWeight: 800,
            boxShadow: `0 0 40px ${C.emGlow}, 0 8px 24px rgba(0,0,0,0.4)`,
          }}>
            Start Investing <ArrowRight size={18} />
          </Link>
          <Link href="/auth/login" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '15px 36px', borderRadius: '10px',
            border: `1px solid ${C.border}`,
            color: C.offWhite, textDecoration: 'none',
            fontSize: '16px', fontWeight: 500,
            background: 'rgba(255,255,255,0.03)',
          }}>
            View Dashboard
          </Link>
        </div>

        {/* Trust row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: isMobile ? '16px' : '32px',
          marginTop: '40px', flexWrap: 'wrap', justifyContent: 'center',
          animation: 'fadeUp 0.9s ease 0.4s both',
        }}>
          {[
            { icon: <Shield size={14} />, text: 'KYC Verified' },
            { icon: <Lock size={14} />, text: 'Secure Payments' },
            { icon: <Clock size={14} />, text: '24h Withdrawals' },
            { icon: <Zap size={14} />, text: '99.9% Uptime' },
          ].map((b, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', color: C.offWhite, fontWeight: 500,
            }}>
              <span style={{ color: C.em }}>{b.icon}</span>
              {b.text}
            </div>
          ))}
        </div>

        {/* ── Live Candlestick Chart ── */}
        <div style={{
          width: '100%', maxWidth: '900px',
          marginTop: '56px', position: 'relative',
          animation: 'fadeUp 1s ease 0.5s both',
        }}>
          {/* Chart container */}
          <div style={{
            borderRadius: '16px', overflow: 'hidden',
            border: `1px solid ${C.border}`,
            background: C.bgCard,
            position: 'relative',
          }}>
            {/* Chart header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: `1px solid ${C.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: C.white }}>XAU/USD</span>
                <span style={{ fontSize: '11px', color: C.offWhite, background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}>M15</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.em, boxShadow: `0 0 6px ${C.em}`, animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '11px', color: C.em, fontWeight: 600 }}>LIVE</span>
              </div>
            </div>

            {/* Chart */}
            <div style={{ height: isMobile ? '160px' : '220px' }}>
              <CandlestickAnimation />
            </div>

            {/* Fade bottom */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', pointerEvents: 'none',
              background: `linear-gradient(to top, ${C.bgCard}, transparent)`,
            }} />
          </div>
        </div>

        {/* Scroll cue */}
        {!isMobile && (
          <div style={{
            position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            color: 'rgba(255,255,255,0.2)', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase',
            animation: 'float 3s ease-in-out infinite',
          }}>
            Scroll <ChevronDown size={14} />
          </div>
        )}
      </section>

      {/* ── LIVE STATS TICKER ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: isMobile ? '0 16px 72px' : '0 48px 90px' }}>
        <Reveal>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            {/* Live profit counter */}
            <div style={{
              background: C.bgCard, border: `1px solid ${C.border}`,
              borderRadius: '16px', padding: isMobile ? '24px' : '32px 40px',
              marginBottom: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '16px',
            }}>
              <div>
                <div style={{ fontSize: '12px', color: C.offWhite, fontWeight: 600, marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Total Profits Distributed</div>
                <div style={{
                  fontSize: isMobile ? '28px' : '42px', fontWeight: 900,
                  color: C.em, letterSpacing: '-1.5px',
                  textShadow: `0 0 30px ${C.emGlow}`,
                }}>
                  <ProfitCounter />
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', borderRadius: '8px',
                background: 'rgba(16,185,129,0.08)', border: `1px solid rgba(16,185,129,0.15)`,
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: C.em, boxShadow: `0 0 8px ${C.em}`, animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '13px', color: C.em, fontWeight: 700 }}>Live Counter</span>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
              gap: '12px',
            }}>
              {[
                { icon: <Users size={18} />, label: 'Active Investors', value: 1200, suffix: '+' },
                { icon: <DollarSign size={18} />, label: 'Volume Traded', value: 4.8, suffix: 'M+', prefix: '$', decimals: 1 },
                { icon: <TrendingUp size={18} />, label: 'Avg Monthly ROI', value: 8, suffix: '–15%' },
                { icon: <Shield size={18} />, label: 'Uptime', value: 99.9, suffix: '%', decimals: 1 },
              ].map((s, i) => (
                <div key={i} style={{
                  background: C.bgCard, border: `1px solid ${C.border}`,
                  borderRadius: '12px', padding: isMobile ? '20px 16px' : '28px 20px',
                  textAlign: 'center',
                }}>
                  <div style={{ color: C.em, display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>{s.icon}</div>
                  <div style={{ fontSize: isMobile ? '26px' : '34px', fontWeight: 900, color: C.white, letterSpacing: '-1px', marginBottom: '4px' }}>
                    <CountUp end={s.value} suffix={s.suffix} prefix={s.prefix || ''} decimals={(s as any).decimals ?? 0} />
                  </div>
                  <div style={{ fontSize: '11px', color: C.offWhite }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: isMobile ? '0 16px 72px' : '0 48px 90px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <Reveal style={{ marginBottom: isMobile ? '40px' : '60px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px',
            }}>
              <div style={{ height: '1px', background: C.em, width: '32px' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: C.em, letterSpacing: '2px', textTransform: 'uppercase' }}>How It Works</span>
            </div>
            <h2 style={{
              fontSize: isMobile ? '32px' : 'clamp(32px,4vw,52px)',
              fontWeight: 900, letterSpacing: '-1.5px', color: C.white,
            }}>Simple. Fast. Profitable.</h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: '12px' }}>
            {[
              { n: '01', icon: <DollarSign size={22} />, title: 'Deposit', desc: 'Send via EasyPaisa, JazzCash, Bank Transfer, or USDT. Credited and ready within hours.' },
              { n: '02', icon: <BarChart2 size={22} />, title: 'We Trade', desc: 'Our team trades XAUUSD Gold around the clock using professional strategies.' },
              { n: '03', icon: <Zap size={22} />, title: 'Withdraw', desc: 'Request withdrawals any time. Funds sent to your account within 24 hours.' },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 100}>
                <div style={{
                  background: C.bgCard, border: `1px solid ${C.border}`,
                  borderRadius: '14px', padding: isMobile ? '24px 20px' : '32px 28px',
                  position: 'relative', overflow: 'hidden',
                  display: isMobile ? 'flex' : 'block', gap: '16px',
                  alignItems: isMobile ? 'flex-start' : 'initial',
                  transition: 'border-color 0.3s, transform 0.4s cubic-bezier(0.16,1,0.3,1)',
                }}
                  onMouseEnter={e => {
                    if (!isMobile) {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)'
                      ;(e.currentTarget as HTMLDivElement).style.borderColor = `rgba(16,185,129,0.3)`
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isMobile) {
                      (e.currentTarget as HTMLDivElement).style.transform = 'none'
                      ;(e.currentTarget as HTMLDivElement).style.borderColor = C.border
                    }
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '16px', right: '20px',
                    fontSize: '64px', fontWeight: 900, color: 'rgba(16,185,129,0.06)', lineHeight: 1,
                  }}>{item.n}</div>
                  <div style={{
                    width: '46px', height: '46px', borderRadius: '12px', flexShrink: 0,
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: C.em, marginBottom: isMobile ? '0' : '20px',
                  }}>{item.icon}</div>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: C.white }}>{item.title}</h3>
                    <p style={{ fontSize: '14px', color: C.offWhite, lineHeight: 1.7 }}>{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY TOPGEE ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: isMobile ? '0 16px 72px' : '0 48px 90px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <Reveal style={{ marginBottom: isMobile ? '40px' : '60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ height: '1px', background: C.em, width: '32px' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: C.em, letterSpacing: '2px', textTransform: 'uppercase' }}>Why Choose Us</span>
            </div>
            <h2 style={{ fontSize: isMobile ? '32px' : 'clamp(32px,4vw,52px)', fontWeight: 900, letterSpacing: '-1.5px', color: C.white }}>
              Built on trust.
            </h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: '12px' }}>
            {[
              { icon: <Lock size={20} />, title: 'Fully Transparent', desc: 'Every trade visible on your dashboard. No black boxes, no surprises.' },
              { icon: <Clock size={20} />, title: 'Fast Withdrawals', desc: 'Withdraw any time. Funds in your account within 24 hours, guaranteed.' },
              { icon: <BarChart2 size={20} />, title: 'Expert Trading', desc: 'Professional traders. Consistent 8–15% monthly returns on XAUUSD.' },
              { icon: <Users size={20} />, title: 'Pakistan-First', desc: 'EasyPaisa, JazzCash, Bank Transfer, USDT — local methods that work.' },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 80}>
                <div style={{
                  background: C.bgCard, border: `1px solid ${C.border}`,
                  borderRadius: '14px', padding: isMobile ? '20px' : '28px',
                  display: 'flex', gap: '16px', alignItems: 'flex-start',
                  transition: 'transform 0.3s, border-color 0.3s',
                }}
                  onMouseEnter={e => {
                    if (!isMobile) {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'
                      ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(16,185,129,0.25)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isMobile) {
                      (e.currentTarget as HTMLDivElement).style.transform = 'none'
                      ;(e.currentTarget as HTMLDivElement).style.borderColor = C.border
                    }
                  }}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                    background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: C.em,
                  }}>{f.icon}</div>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: C.white }}>{f.title}</h4>
                    <p style={{ fontSize: '14px', color: C.offWhite, lineHeight: 1.65 }}>{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: isMobile ? '0 16px 80px' : '0 48px 100px' }}>
        <Reveal>
          <div style={{
            maxWidth: '800px', margin: '0 auto',
            background: C.bgCard, border: `1px solid rgba(16,185,129,0.2)`,
            borderRadius: '20px', padding: isMobile ? '48px 24px' : '72px 60px',
            textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}>
            {/* Emerald glow */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              width: '500px', height: '250px',
              background: `radial-gradient(ellipse, rgba(16,185,129,0.1) 0%, transparent 70%)`,
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative' }}>
              <h2 style={{
                fontSize: isMobile ? '30px' : 'clamp(30px,4vw,52px)',
                fontWeight: 900, letterSpacing: '-1.5px', color: C.white, marginBottom: '12px',
              }}>Ready to start earning?</h2>
              <p style={{
                fontSize: isMobile ? '14px' : '17px', color: C.offWhite,
                marginBottom: '36px', lineHeight: 1.7, maxWidth: '400px', margin: '0 auto 36px',
              }}>
                Join 1,200+ investors already growing their capital with Topgee Capital.
              </p>
              <Link href="/auth/signup" style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                padding: isMobile ? '15px 32px' : '16px 44px',
                width: isMobile ? '100%' : 'auto', maxWidth: isMobile ? '320px' : 'none',
                borderRadius: '10px', background: C.em,
                color: '#000', textDecoration: 'none',
                fontSize: isMobile ? '15px' : '17px', fontWeight: 800,
                boxShadow: `0 0 50px ${C.emGlow}`,
              }}>
                Create Free Account <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: `1px solid ${C.border}`,
        padding: isMobile ? '32px 20px' : '40px 48px',
        display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center', justifyContent: 'space-between',
        gap: '16px', textAlign: isMobile ? 'center' : 'left',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: C.em, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src='/logo.jpeg' alt='Topgee Capital' style={{ width: '36px', height: '36px', borderRadius: '9px', objectFit: 'cover' }} />
          </div>
          <span style={{ fontSize: '15px', fontWeight: 800, color: C.white }}>
            Topgee<span style={{ color: C.em }}>.</span>Capital
          </span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>
          © 2025 Topgee Capital. All rights reserved. Trading involves risk.
        </p>
      </footer>

      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes float   { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(8px)} }
        * { box-sizing:border-box; margin:0; padding:0; }
        html { scroll-behavior:smooth; }
        body { -webkit-tap-highlight-color:transparent; }
      `}</style>
    </div>
  )
}
