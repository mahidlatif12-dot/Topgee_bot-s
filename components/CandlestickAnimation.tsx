'use client'

import { useEffect, useRef } from 'react'

interface Candle {
  x: number
  open: number
  close: number
  high: number
  low: number
  color: string
  targetOpen: number
  targetClose: number
  targetHigh: number
  targetLow: number
}

export default function CandlestickAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    const W = () => canvas.offsetWidth
    const H = () => canvas.offsetHeight

    const candleCount = 28
    const candles: Candle[] = []

    const makeCandle = (i: number): Candle => {
      const x = (i / candleCount) * W() * 1.05
      const mid = H() * 0.5
      const range = H() * 0.25
      const isGreen = Math.random() > 0.42
      const open = mid + (Math.random() - 0.5) * range
      const close = open + (isGreen ? 1 : -1) * Math.random() * range * 0.4
      const high = Math.min(open, close) - Math.random() * range * 0.15
      const low = Math.max(open, close) + Math.random() * range * 0.15
      return {
        x, open, close, high, low,
        color: isGreen ? '#22c55e' : '#ef4444',
        targetOpen: open, targetClose: close,
        targetHigh: high, targetLow: low,
      }
    }

    for (let i = 0; i < candleCount; i++) candles.push(makeCandle(i))

    // Animate candles
    let frame = 0
    let animId: number

    // Moving average line points
    const maPoints: { x: number; y: number }[] = []

    const drawCandle = (c: Candle, width: number) => {
      const w = width * 0.6
      ctx.strokeStyle = c.color
      ctx.lineWidth = 1
      // Wick
      ctx.beginPath()
      ctx.moveTo(c.x, c.high)
      ctx.lineTo(c.x, c.low)
      ctx.stroke()
      // Body
      const top = Math.min(c.open, c.close)
      const bottom = Math.max(c.open, c.close)
      const h = Math.max(bottom - top, 2)
      ctx.fillStyle = c.color
      ctx.globalAlpha = 0.85
      ctx.fillRect(c.x - w / 2, top, w, h)
      ctx.globalAlpha = 1
    }

    const animate = () => {
      animId = requestAnimationFrame(animate)
      frame++

      ctx.clearRect(0, 0, W(), H())

      // Grid lines
      for (let i = 0; i < 5; i++) {
        const y = (H() / 5) * i
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(W(), y)
        ctx.strokeStyle = 'rgba(245,158,11,0.05)'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      const cw = W() / candleCount

      // Slowly shift candles left and update values
      if (frame % 120 === 0) {
        candles.shift()
        candles.push(makeCandle(candleCount - 1))
        candles.forEach((c, i) => { c.x = (i / candleCount) * W() * 1.05 })
      }

      // Smooth candle movement
      candles.forEach((c, i) => {
        c.x += ((i / candleCount) * W() * 1.05 - c.x) * 0.05
        drawCandle(c, cw)
      })

      // Moving average line
      maPoints.length = 0
      candles.forEach(c => {
        maPoints.push({ x: c.x, y: (c.open + c.close) / 2 })
      })

      // Draw smooth MA line
      ctx.beginPath()
      ctx.moveTo(maPoints[0].x, maPoints[0].y)
      for (let i = 1; i < maPoints.length - 1; i++) {
        const mx = (maPoints[i].x + maPoints[i + 1].x) / 2
        const my = (maPoints[i].y + maPoints[i + 1].y) / 2
        ctx.quadraticCurveTo(maPoints[i].x, maPoints[i].y, mx, my)
      }
      ctx.strokeStyle = 'rgba(245,158,11,0.6)'
      ctx.lineWidth = 2
      ctx.shadowColor = '#f59e0b'
      ctx.shadowBlur = 8
      ctx.stroke()
      ctx.shadowBlur = 0

      // Glow under MA line
      const grad = ctx.createLinearGradient(0, 0, 0, H())
      grad.addColorStop(0, 'rgba(245,158,11,0.12)')
      grad.addColorStop(1, 'rgba(245,158,11,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.moveTo(maPoints[0].x, H())
      ctx.lineTo(maPoints[0].x, maPoints[0].y)
      for (let i = 1; i < maPoints.length - 1; i++) {
        const mx = (maPoints[i].x + maPoints[i + 1].x) / 2
        const my = (maPoints[i].y + maPoints[i + 1].y) / 2
        ctx.quadraticCurveTo(maPoints[i].x, maPoints[i].y, mx, my)
      }
      ctx.lineTo(maPoints[maPoints.length - 1].x, H())
      ctx.closePath()
      ctx.fill()
    }

    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
