'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Clock, XCircle, Shield } from 'lucide-react'

export default function KYCPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [kycStatus, setKycStatus] = useState<string>('none')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('kyc_status').eq('id', user.id).single()
    setKycStatus(data?.kyc_status || 'none')
    setLoading(false)

    if (data?.kyc_status === 'none' || data?.kyc_status === 'rejected') {
      loadSumsub()
    }
  }

  async function loadSumsub() {
    try {
      const res = await fetch('/api/kyc/token')
      const { token } = await res.json()
      if (!token || !containerRef.current) return

      // Load Sumsub WebSDK
      const script = document.createElement('script')
      script.src = 'https://static.sumsub.com/idensic/static/sns-websdk-builder.js'
      script.onload = () => {
        // @ts-expect-error Sumsub global
        const snsWebSdkInstance = window.snsWebSdk
          .init(token, () => fetch('/api/kyc/token').then(r => r.json()).then(d => d.token))
          .withConf({ lang: 'en' })
          .withOptions({ addViewportTag: false, adaptIframeHeight: true })
          .on('idCheck.onStepCompleted', () => {
            setKycStatus('pending')
          })
          .on('idCheck.onApplicantSubmitted', () => {
            setKycStatus('pending')
            // Update DB
            supabase.auth.getUser().then(({ data: { user } }) => {
              if (user) supabase.from('profiles').update({ kyc_status: 'pending' }).eq('id', user.id)
            })
            // Redirect to dashboard after 2 sec
            setTimeout(() => router.push('/dashboard'), 2000)
          })
          .on('idCheck.onApplicantStatusChanged', (payload: { reviewResult?: { reviewAnswer: string } }) => {
            if (payload?.reviewResult?.reviewAnswer === 'GREEN') {
              setKycStatus('verified')
              supabase.auth.getUser().then(({ data: { user } }) => {
                if (user) supabase.from('profiles').update({ kyc_status: 'verified' }).eq('id', user.id)
              })
              setTimeout(() => router.push('/dashboard/deposit'), 2000)
            }
            if (payload?.reviewResult?.reviewAnswer === 'RED') setKycStatus('rejected')
          })
          .build()

        if (containerRef.current) {
          snsWebSdkInstance.launch('#sumsub-websdk-container')
        }
      }
      document.head.appendChild(script)
    } catch (e) {
      console.error('Sumsub load error:', e)
    }
  }

  if (loading) return (
    <div style={{ padding: '32px', color: 'var(--text-secondary)' }}>Loading...</div>
  )

  return (
    <div style={{ padding: '32px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Identity Verification (KYC)</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Verify your identity to unlock deposits and withdrawals
        </p>
      </div>

      {/* Status Banner */}
      {kycStatus === 'verified' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'rgba(0,212,160,0.1)', border: '1px solid rgba(0,212,160,0.3)',
          borderRadius: '12px', padding: '20px', marginBottom: '24px',
        }}>
          <CheckCircle size={32} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-green)' }}>✅ Identity Verified</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Your account is fully verified. You can deposit and withdraw freely.
            </div>
          </div>
        </div>
      )}

      {kycStatus === 'pending' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: '12px', padding: '20px', marginBottom: '24px',
        }}>
          <Clock size={32} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b' }}>⏳ Verification In Progress</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Your documents are being reviewed. This usually takes a few minutes.
            </div>
          </div>
        </div>
      )}

      {kycStatus === 'rejected' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)',
          borderRadius: '12px', padding: '20px', marginBottom: '24px',
        }}>
          <XCircle size={32} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-red)' }}>❌ Verification Failed</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Your verification was rejected. Please try again with clear documents.
            </div>
          </div>
        </div>
      )}

      {kycStatus === 'none' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: '12px', padding: '20px', marginBottom: '24px',
        }}>
          <Shield size={32} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b' }}>Verify Your Identity</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Complete KYC to unlock deposits and withdrawals. Takes 2-3 minutes.
            </div>
          </div>
        </div>
      )}

      {/* Sumsub Widget */}
      {(kycStatus === 'none' || kycStatus === 'rejected') && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', overflow: 'hidden',
        }}>
          <div id="sumsub-websdk-container" ref={containerRef} style={{ minHeight: '600px' }} />
        </div>
      )}
    </div>
  )
}
