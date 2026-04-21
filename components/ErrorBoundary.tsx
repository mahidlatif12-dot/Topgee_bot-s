'use client'

import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: string }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message }
  }

  componentDidCatch(error: Error) {
    console.error('App error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#030305', color: '#fff', padding: '24px', flexDirection: 'column', gap: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px' }}>⚠️</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-green)' }}>Something went wrong</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '400px', fontSize: '14px', lineHeight: 1.6 }}>
            {this.state.error || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 28px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))',
              border: 'none', color: '#000', fontWeight: 700,
              fontSize: '15px', cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
