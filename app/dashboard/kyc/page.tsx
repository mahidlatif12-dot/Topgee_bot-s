'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { CheckCircle, Clock, XCircle, Shield, Camera, Upload, Loader, AlertCircle } from 'lucide-react'

type Step = 1 | 2 | 3 | 4

export default function KYCPage() {
  const supabase = createClient()
  const docRef = useRef<HTMLInputElement>(null)
  const selfieRef = useRef<HTMLInputElement>(null)

  const [kycStatus, setKycStatus] = useState<string>('loading')
  const [adminNote, setAdminNote] = useState<string>('')
  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Form fields
  const [fullName, setFullName] = useState('')
  const [dob, setDob] = useState('')
  const [idType, setIdType] = useState('CNIC')
  const [idNumber, setIdNumber] = useState('')
  const [address, setAddress] = useState('')

  // Files
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docPreview, setDocPreview] = useState('')
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState('')

  useEffect(() => { loadKyc() }, [])

  async function loadKyc() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    setFullName(user.user_metadata?.full_name || '')

    const { data } = await supabase
      .from('profiles')
      .select('kyc_status, kyc_admin_note, full_name')
      .eq('id', user.id)
      .single()

    setKycStatus(data?.kyc_status || 'none')
    setAdminNote(data?.kyc_admin_note || '')
    if (data?.full_name) setFullName(data.full_name)
  }

  function handleDocFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) return toast.error('File must be under 5MB')
    setDocFile(f)
    const reader = new FileReader()
    reader.onload = ev => setDocPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  function handleSelfieFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) return toast.error('File must be under 5MB')
    setSelfieFile(f)
    const reader = new FileReader()
    reader.onload = ev => setSelfiePreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  async function handleSubmit() {
    if (!fullName.trim()) return toast.error('Enter your full name')
    if (!dob) return toast.error('Enter your date of birth')
    if (!idNumber.trim()) return toast.error('Enter your ID number')
    if (!address.trim()) return toast.error('Enter your address')
    if (!docFile) return toast.error('Upload your ID document photo')
    if (!selfieFile) return toast.error('Upload your selfie')

    setSubmitting(true)
    try {
      const form = new FormData()
      form.append('userId', userId)
      form.append('fullName', fullName.trim())
      form.append('dob', dob)
      form.append('idType', idType)
      form.append('idNumber', idNumber.trim())
      form.append('address', address.trim())
      form.append('document', docFile)
      form.append('selfie', selfieFile)

      const res = await fetch('/api/kyc/submit', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Submission failed')
        return
      }

      toast.success('KYC submitted! We will review within 24 hours.')
      setKycStatus('pending')
    } catch (e: any) {
      toast.error(e?.message || 'Submission failed. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (kycStatus === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Loader size={28} style={{ color: 'var(--accent-green)', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ padding: 'clamp(16px,4vw,40px)', maxWidth: '680px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Identity Verification</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>
        Required to unlock withdrawals. Takes 2 minutes.
      </p>

      {/* ── STATUS BANNERS ── */}
      {kycStatus === 'verified' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: '16px', padding: '24px',
        }}>
          <CheckCircle size={36} style={{ color: '#22c55e', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#22c55e', marginBottom: '4px' }}>Identity Verified</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Your account is fully verified. You can withdraw freely.
            </div>
          </div>
        </div>
      )}

      {kycStatus === 'pending' && (
        <div style={{
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: '16px', padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Clock size={36} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--accent-green)', marginBottom: '4px' }}>Under Review</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Your documents are being reviewed. Usually within 24 hours.
              </div>
            </div>
          </div>
        </div>
      )}

      {kycStatus === 'rejected' && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: '16px', padding: '20px', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: adminNote ? '12px' : '0' }}>
              <XCircle size={32} style={{ color: '#ef4444', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#ef4444', marginBottom: '2px' }}>Verification Rejected</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Please resubmit with correct documents.</div>
              </div>
            </div>
            {adminNote && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '10px', padding: '12px', marginTop: '12px',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', marginBottom: '4px' }}>Admin Note:</div>
                <div style={{ fontSize: '13px', lineHeight: 1.6 }}>{adminNote}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FORM (none or rejected) ── */}
      {(kycStatus === 'none' || kycStatus === 'rejected') && (
        <>
          {/* Step indicators */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
            {([1, 2, 3] as const).map(s => (
              <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: step >= s ? 'linear-gradient(135deg,var(--accent-green),var(--accent-green-dark))' : 'var(--bg-secondary)',
                  border: step >= s ? 'none' : '2px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700,
                  color: step >= s ? '#000' : 'var(--text-secondary)',
                  transition: 'all 0.3s',
                }}>{s}</div>
                <div style={{ fontSize: '10px', color: step >= s ? 'var(--accent-green)' : 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>
                  {s === 1 ? 'Personal Info' : s === 2 ? 'ID Document' : 'Selfie'}
                </div>
              </div>
            ))}
          </div>

          {/* STEP 1 — Personal Info */}
          {step === 1 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Personal Information</h3>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Full Name (as on ID) *</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Muhammad Ali Khan"
                    style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Date of Birth *</label>
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>ID Type *</label>
                  <select value={idType} onChange={e => setIdType(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}>
                    <option>CNIC</option>
                    <option>Passport</option>
                    <option>Driving License</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>ID Number *</label>
                  <input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="e.g. 42101-1234567-1"
                    style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Home Address *</label>
                  <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="House #, Street, City, Province" rows={2}
                    style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
              </div>

              <button onClick={() => {
                if (!fullName.trim() || !dob || !idNumber.trim() || !address.trim()) return toast.error('Fill all fields')
                setStep(2)
              }} style={{
                width: '100%', padding: '13px', borderRadius: '12px',
                background: 'linear-gradient(135deg,var(--accent-green),var(--accent-green-dark))',
                border: 'none', color: '#000', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
              }}>Continue →</button>
            </div>
          )}

          {/* STEP 2 — ID Document */}
          {step === 2 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>ID Document Photo</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Take a clear photo of your {idType} (front side). Make sure all text is readable.
              </p>

              <input ref={docRef} type="file" accept="image/*" capture="environment" onChange={handleDocFile} style={{ display: 'none' }} />

              {docPreview ? (
                <div style={{ marginBottom: '20px', position: 'relative' }}>
                  <img src={docPreview} alt="Document" style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--border)', maxHeight: '260px', objectFit: 'cover' }} />
                  <button onClick={() => { setDocFile(null); setDocPreview('') }} style={{
                    position: 'absolute', top: '8px', right: '8px',
                    background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff',
                    borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px',
                  }}>Change</button>
                </div>
              ) : (
                <div onClick={() => docRef.current?.click()} style={{
                  border: '2px dashed rgba(16,185,129,0.3)',
                  borderRadius: '16px', padding: '48px 24px',
                  textAlign: 'center', cursor: 'pointer', marginBottom: '20px',
                  background: 'rgba(245,158,11,0.04)',
                  transition: 'all 0.2s',
                }}>
                  <Camera size={36} style={{ color: 'var(--accent-green)', margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>Take Photo or Upload</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>JPG, PNG — max 5MB</div>
                </div>
              )}

              <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '12px', marginBottom: '20px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <AlertCircle size={13} style={{ display: 'inline', marginRight: '4px', color: 'var(--accent-green)' }} />
                Ensure: all 4 corners visible · no glare · text clearly readable
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button onClick={() => setStep(1)} style={{
                  padding: '13px', borderRadius: '12px', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                }}>← Back</button>
                <button onClick={() => {
                  if (!docFile) return toast.error('Upload your ID document first')
                  setStep(3)
                }} style={{
                  padding: '13px', borderRadius: '12px',
                  background: 'linear-gradient(135deg,var(--accent-green),var(--accent-green-dark))',
                  border: 'none', color: '#000', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                }}>Continue →</button>
              </div>
            </div>
          )}

          {/* STEP 3 — Selfie */}
          {step === 3 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Selfie Photo</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Take a clear selfie of your face. Good lighting, no sunglasses.
              </p>

              <input ref={selfieRef} type="file" accept="image/*" capture="user" onChange={handleSelfieFile} style={{ display: 'none' }} />

              {selfiePreview ? (
                <div style={{ marginBottom: '20px', position: 'relative' }}>
                  <img src={selfiePreview} alt="Selfie" style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--border)', maxHeight: '300px', objectFit: 'cover' }} />
                  <button onClick={() => { setSelfieFile(null); setSelfiePreview('') }} style={{
                    position: 'absolute', top: '8px', right: '8px',
                    background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff',
                    borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px',
                  }}>Retake</button>
                </div>
              ) : (
                <div onClick={() => selfieRef.current?.click()} style={{
                  border: '2px dashed rgba(16,185,129,0.3)',
                  borderRadius: '16px', padding: '48px 24px',
                  textAlign: 'center', cursor: 'pointer', marginBottom: '20px',
                  background: 'rgba(245,158,11,0.04)',
                }}>
                  <Camera size={36} style={{ color: 'var(--accent-green)', margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>Take Selfie or Upload</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Face clearly visible — max 5MB</div>
                </div>
              )}

              <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '12px', marginBottom: '20px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <AlertCircle size={13} style={{ display: 'inline', marginRight: '4px', color: 'var(--accent-green)' }} />
                Face fully visible · bright lighting · no hat or glasses
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button onClick={() => setStep(2)} style={{
                  padding: '13px', borderRadius: '12px', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                }}>← Back</button>
                <button onClick={handleSubmit} disabled={submitting || !selfieFile} style={{
                  padding: '13px', borderRadius: '12px',
                  background: submitting ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg,var(--accent-green),var(--accent-green-dark))',
                  border: 'none', color: '#000', fontSize: '14px', fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                  {submitting ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</> : 'Submit KYC'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
