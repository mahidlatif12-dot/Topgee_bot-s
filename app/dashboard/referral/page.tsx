'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Copy, Users, DollarSign, TrendingUp, Trophy, Zap, Gift, Check } from 'lucide-react'

interface Referral {
  id: string
  full_name: string
  email: string
  total_deposited: number
  created_at: string
  commission_earned: number
}

const CHALLENGE_TARGET = 100
const CHALLENGE_BONUS = 100

export default function ReferralPage() {
  const supabase = createClient()
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [totalEarned, setTotalEarned] = useState(0)
  const [referralBalance, setReferralBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [liveCount, setLiveCount] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    loadReferralData()
  }, [])

  // Animate live counter
  useEffect(() => {
    if (referrals.length === 0) return
    const target = referrals.length
    let current = 0
    const interval = setInterval(() => {
      current = Math.min(current + 1, target)
      setLiveCount(current)
      if (current >= target) clearInterval(interval)
    }, 50)
    return () => clearInterval(interval)
  }, [referrals.length])

  async function loadReferralData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get profile + referral code
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code, referral_balance')
      .eq('id', user.id)
      .single()

    if (profile?.referral_code) {
      setCode(profile.referral_code)
      setReferralBalance(profile.referral_balance || 0)
    }

    // Get referrals
    const { data: refs } = await supabase
      .from('referrals')
      .select('*, referred:profiles!referrals_referred_id_fkey(full_name, email, total_deposited, created_at)')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    if (refs) {
      const mapped = refs.map((r: any) => ({
        id: r.id,
        full_name: r.referred?.full_name || 'Unknown',
        email: r.referred?.email || '',
        total_deposited: r.referred?.total_deposited || 0,
        created_at: r.created_at,
        commission_earned: r.commission_earned || 0,
      }))
      setReferrals(mapped)
      setTotalEarned(mapped.reduce((s: number, r: Referral) => s + r.commission_earned, 0))
    }

    setLoading(false)
  }

  function copyLink() {
    const link = `${window.location.origin}/ref/${code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/ref/${code}` : ''
  const challengeProgress = Math.min((referrals.length / CHALLENGE_TARGET) * 100, 100)
  const challengeDone = referrals.length >= CHALLENGE_TARGET

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
      Loading...
    </div>
  )

  return (
    <div style={{ padding: 'clamp(16px,4vw,40px)', maxWidth: '800px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '4px' }}>
          Referral Program
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Earn <strong style={{ color: 'var(--accent-green)' }}>0.5%</strong> of every deposit your referrals make — forever.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { icon: <Users size={20} />, label: 'Total Referrals', value: referrals.length, color: '#6366f1', suffix: '' },
          { icon: <DollarSign size={20} />, label: 'Total Earned', value: totalEarned.toFixed(2), color: '#22c55e', suffix: '$', prefix: '$' },
          { icon: <Gift size={20} />, label: 'Referral Balance', value: referralBalance.toFixed(2), color: 'var(--accent-green)', prefix: '$' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '20px', textAlign: 'center',
          }}>
            <div style={{ color: s.color, display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>{s.icon}</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: s.color, marginBottom: '4px' }}>
              {s.prefix || ''}{s.value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Your referral link */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '20px', padding: '24px', marginBottom: '20px',
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={16} style={{ color: 'var(--accent-green)' }} /> Your Referral Link
        </h3>

        {/* Code badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            padding: '8px 16px', borderRadius: '10px',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.25)',
            fontFamily: 'monospace', fontSize: '20px', fontWeight: 800,
            color: 'var(--accent-green)', letterSpacing: '3px',
          }}>{code}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>← Your unique code</div>
        </div>

        {/* Link box */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', alignItems: isMobile ? 'stretch' : 'center' }}>
          <div style={{
            flex: 1, padding: '12px 14px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '10px', fontSize: '13px', color: 'var(--text-secondary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: 'monospace',
          }}>
            {referralLink}
          </div>
          <button onClick={copyLink} style={{
            padding: '12px 20px', borderRadius: '10px',
            background: copied ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg,var(--accent-green),var(--accent-green-dark))',
            border: copied ? '1px solid rgba(34,197,94,0.3)' : 'none',
            color: copied ? '#22c55e' : '#000',
            fontWeight: 700, fontSize: '14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.2s', flexShrink: 0,
          }}>
            {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy</>}
          </button>
        </div>

        {/* Share buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          <a href={`https://wa.me/?text=Join%20Topgee%20Capital%20and%20earn%208-15%25%20monthly!%20${encodeURIComponent(referralLink)}`}
            target="_blank" rel="noreferrer" style={{
              padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
              background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
              color: '#22c55e', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
            }}>Share on WhatsApp</a>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=Join%20Topgee%20Capital%20and%20earn%208-15%25%20monthly!`}
            target="_blank" rel="noreferrer" style={{
              padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
              color: '#6366f1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
            }}>Share on Telegram</a>
        </div>
      </div>

      {/* Challenge Section */}
      <div style={{
        background: challengeDone
          ? 'linear-gradient(135deg,rgba(34,197,94,0.15),rgba(3,3,5,0.9))'
          : 'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(3,3,5,0.9))',
        border: `1px solid ${challengeDone ? 'rgba(34,197,94,0.4)' : 'rgba(16,185,129,0.25)'}`,
        borderRadius: '20px', padding: '24px', marginBottom: '20px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* BG glow */}
        <div style={{
          position: 'absolute', top: '-20px', right: '-20px',
          width: '150px', height: '150px',
          background: `radial-gradient(circle, ${challengeDone ? 'rgba(34,197,94,0.2)' : 'rgba(16,185,129,0.1)'} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Trophy size={22} style={{ color: challengeDone ? '#22c55e' : 'var(--accent-green)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 800 }}>
            {challengeDone ? 'Challenge Complete!' : 'Referral Challenge'}
          </h3>
          <span style={{
            marginLeft: 'auto', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
            background: challengeDone ? 'rgba(34,197,94,0.2)' : 'rgba(16,185,129,0.1)',
            color: challengeDone ? '#22c55e' : 'var(--accent-green)',
          }}>{challengeDone ? 'DONE' : 'ACTIVE'}</span>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
          Refer <strong style={{ color: '#fff' }}>{CHALLENGE_TARGET} people</strong> and earn a
          <strong style={{ color: 'var(--accent-green)' }}> ${CHALLENGE_BONUS} cash bonus</strong> on top of all your commissions!
        </p>

        {/* Live counter */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
          <span style={{
            fontSize: isMobile ? '36px' : '48px', fontWeight: 900, letterSpacing: '-2px',
            color: challengeDone ? '#22c55e' : 'var(--accent-green)',
            fontVariantNumeric: 'tabular-nums',
          }}>{liveCount}</span>
          <span style={{ fontSize: '20px', color: 'var(--text-secondary)', fontWeight: 500 }}>/ {CHALLENGE_TARGET}</span>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '4px' }}>people referred</span>
        </div>

        {/* Progress bar */}
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '100px', height: '10px', overflow: 'hidden', marginBottom: '10px' }}>
          <div style={{
            height: '100%', borderRadius: '100px',
            width: `${challengeProgress}%`,
            background: challengeDone
              ? 'linear-gradient(90deg,#22c55e,#16a34a)'
              : 'linear-gradient(90deg,var(--accent-green),var(--accent-green-light))',
            boxShadow: challengeDone ? '0 0 12px rgba(34,197,94,0.5)' : '0 0 12px rgba(245,158,11,0.5)',
            transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <span>{challengeProgress.toFixed(0)}% complete</span>
          <span>{CHALLENGE_TARGET - referrals.length > 0 ? `${CHALLENGE_TARGET - referrals.length} more to go` : 'Bonus unlocked!'}</span>
        </div>

        {challengeDone && (
          <div style={{
            marginTop: '16px', padding: '14px',
            background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: '12px', textAlign: 'center',
            fontSize: '15px', fontWeight: 700, color: '#22c55e',
          }}>
            Your $100 bonus has been added to your account!
          </div>
        )}
      </div>

      {/* Referral History */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '20px', padding: '24px',
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={16} style={{ color: '#6366f1' }} />
          My Referrals ({referrals.length})
        </h3>

        {referrals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <div style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}><svg width='40' height='40' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'><path d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101'/><path d='M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'/></svg></div>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>No referrals yet</div>
            <div style={{ fontSize: '13px' }}>Share your link to start earning!</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Name', 'Joined', 'Deposited', 'Earned'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referrals.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{r.full_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{r.email}</div>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {new Date(r.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>${r.total_deposited.toFixed(2)}</td>
                    <td style={{ padding: '12px', color: '#22c55e', fontWeight: 700 }}>+${r.commission_earned.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* How it works */}
      <div style={{
        background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(16,185,129,0.1)',
        borderRadius: '16px', padding: '20px', marginTop: '16px',
      }}>
        <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-green)', marginBottom: '12px' }}>How Referral Earnings Work</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <div>1. Share your unique link with friends</div>
          <div>2. Friend signs up using your link</div>
          <div>3. Every time they deposit, you earn <strong style={{ color: 'var(--accent-green)' }}>0.5%</strong> of their deposit amount</div>
          <div>4. Earnings go to your Referral Balance — withdraw anytime</div>
          <div>5. Refer 100 people → earn extra <strong style={{ color: 'var(--accent-green)' }}>$100 bonus</strong></div>
        </div>
      </div>
    </div>
  )
}
