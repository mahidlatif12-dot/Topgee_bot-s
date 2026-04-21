'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Send, Clock, CheckCircle, MessageSquare, Loader } from 'lucide-react'

interface SupportRequest {
  id: string
  name: string
  email: string
  message: string
  status: string
  admin_reply: string | null
  created_at: string
}

export default function SupportPage() {
  const supabase = createClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [requests, setRequests] = useState<SupportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    prefillUser()
    fetchRequests()
  }, [])

  async function prefillUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setEmail(user.email || '')
    const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    if (data?.full_name) setName(data.full_name)
  }

  async function fetchRequests() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('support_requests')
      .select('*')
      .eq('email', user.email)
      .order('created_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error('Please enter your name')
    if (!email.trim()) return toast.error('Please enter your email')
    if (!message.trim()) return toast.error('Please describe your issue')
    if (message.trim().length < 10) return toast.error('Message too short — please give more detail')

    setSending(true)
    const { error } = await supabase.from('support_requests').insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      status: 'open',
    })

    setSending(false)
    if (error) return toast.error('Failed to send request. Try again.')
    toast.success('Support request sent! We\'ll reply within 24 hours.')
    setMessage('')
    fetchRequests()
  }

  function statusBadge(status: string) {
    const map: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
      open:     { color: 'var(--accent-green)', bg: 'rgba(16,185,129,0.1)', icon: <Clock size={11} />,        label: 'Open' },
      replied:  { color: '#22c55e', bg: 'rgba(34,197,94,0.15)',  icon: <CheckCircle size={11} />,  label: 'Replied' },
      closed:   { color: '#6366f1', bg: 'rgba(99,102,241,0.15)', icon: <CheckCircle size={11} />,  label: 'Closed' },
    }
    const s = map[status] || map.open
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 8px', borderRadius: '6px',
        fontSize: '11px', fontWeight: 700,
        color: s.color, background: s.bg,
      }}>
        {s.icon} {s.label}
      </span>
    )
  }

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 40px)', maxWidth: '700px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Support</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
        Have a question or issue? Send us a message — we reply within 24 hours.
      </p>

      {/* Submit Form */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '28px',
        marginBottom: '28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <MessageSquare size={18} style={{ color: 'var(--accent-green)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>New Support Request</h3>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name + Email row */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                required
                style={{
                  width: '100%', padding: '11px 14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '14px', outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  width: '100%', padding: '11px 14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '14px', outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Message */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Your Message *
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe your issue or question in detail..."
              required
              rows={5}
              style={{
                width: '100%', padding: '12px 14px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '14px', outline: 'none',
                resize: 'vertical', fontFamily: 'inherit',
              }}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', textAlign: 'right' }}>
              {message.length} characters
            </div>
          </div>

          <button
            type="submit"
            disabled={sending}
            style={{
              width: '100%', padding: '13px',
              borderRadius: '12px',
              background: sending ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))',
              border: 'none', color: '#000',
              fontSize: '15px', fontWeight: 700,
              cursor: sending ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '0 0 24px rgba(16,185,129,0.2)',
            }}
          >
            {sending
              ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</>
              : <><Send size={16} /> Send Request</>
            }
          </button>
        </form>
      </div>

      {/* My Requests History */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '28px',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>My Requests</h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
            <Loader size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            No requests yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {requests.map(r => (
              <div key={r.id} style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
                  <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6, flex: 1 }}>
                    {r.message}
                  </p>
                  {statusBadge(r.status)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {new Date(r.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>

                {/* Admin Reply */}
                {r.admin_reply && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: 'rgba(16,185,129,0.07)',
                    border: '1px solid rgba(16,185,129,0.15)',
                    borderRadius: '10px',
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-green)', marginBottom: '4px' }}>
                      Support Reply
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {r.admin_reply}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
