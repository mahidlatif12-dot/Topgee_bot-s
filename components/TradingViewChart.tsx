'use client'

import { useEffect, useRef, useState } from 'react'

export default function TradingViewChart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: 'OANDA:XAUUSD',
      interval: '15',
      timezone: 'Asia/Karachi',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: 'rgba(0, 0, 0, 0)',
      gridColor: 'rgba(255, 255, 255, 0.02)',
      hide_top_toolbar: true,
      hide_legend: true,
      hide_side_toolbar: true,
      allow_symbol_change: false,
      save_image: false,
      withdateranges: false,
      details: false,
      hotlist: false,
      calendar: false,
      studies: [],
      overrides: {
        'paneProperties.background': 'rgba(0,0,0,0)',
        'paneProperties.backgroundType': 'solid',
        'paneProperties.vertGridProperties.color': 'rgba(255,255,255,0.02)',
        'paneProperties.horzGridProperties.color': 'rgba(255,255,255,0.02)',
        'scalesProperties.textColor': 'rgba(255,255,255,0.3)',
        'scalesProperties.backgroundColor': 'rgba(0,0,0,0)',
        'scalesProperties.lineColor': 'rgba(255,255,255,0.05)',
        'mainSeriesProperties.candleStyle.upColor': '#22c55e',
        'mainSeriesProperties.candleStyle.downColor': '#ef4444',
        'mainSeriesProperties.candleStyle.borderUpColor': '#22c55e',
        'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
        'mainSeriesProperties.candleStyle.wickUpColor': 'rgba(34,197,94,0.6)',
        'mainSeriesProperties.candleStyle.wickDownColor': 'rgba(239,68,68,0.6)',
      },
    })

    containerRef.current.appendChild(script)
    setTimeout(() => setLoaded(true), 1800)
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '420px' }}>
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: '12px',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            border: '2px solid rgba(16,185,129,0.15)',
            borderTopColor: 'var(--accent-green)',
            animation: 'spin 1s linear infinite',
          }} />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Loading chart...</span>
          <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
