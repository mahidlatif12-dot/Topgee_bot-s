'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number; y: number
  vx: number; vy: number
  size: number; opacity: number
  life: number; maxLife: number
  type: 'star' | 'dot' | 'diamond'
  twinkleOffset: number
}

export default function EmeraldParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Particle[] = []
    const types: Particle['type'][] = ['star', 'dot', 'diamond']

    const spawnParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: canvas.height + 20,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(Math.random() * 0.5 + 0.15),
      size: Math.random() * 2.5 + 0.8,
      opacity: Math.random() * 0.5 + 0.2,
      life: 0,
      maxLife: Math.random() * 400 + 200,
      type: types[Math.floor(Math.random() * types.length)],
      twinkleOffset: Math.random() * Math.PI * 2,
    })

    // Seed initial particles spread across canvas
    for (let i = 0; i < 80; i++) {
      const p = spawnParticle()
      p.y = Math.random() * canvas.height
      p.life = Math.random() * p.maxLife
      particles.push(p)
    }

    // Emerald color palette
    const colors = [
      [16, 185, 129],   // #10b981 emerald
      [52, 211, 153],   // #34d399 emerald light
      [5, 150, 105],    // #059669 emerald dark
      [110, 231, 183],  // #6ee7b7 very light
      [255, 255, 255],  // white sparkles
    ]

    function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number, color: number[]) {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(x, y)

      // 4-point sparkle
      const spikes = 4
      const outerR = r
      const innerR = r * 0.3

      ctx.beginPath()
      for (let i = 0; i < spikes * 2; i++) {
        const angle = (i * Math.PI) / spikes - Math.PI / 2
        const rad = i % 2 === 0 ? outerR : innerR
        if (i === 0) ctx.moveTo(Math.cos(angle) * rad, Math.sin(angle) * rad)
        else ctx.lineTo(Math.cos(angle) * rad, Math.sin(angle) * rad)
      }
      ctx.closePath()

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, outerR)
      grad.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},1)`)
      grad.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]},0)`)
      ctx.fillStyle = grad
      ctx.fill()

      // Center glow
      ctx.beginPath()
      ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.9})`
      ctx.fill()

      ctx.restore()
    }

    function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number, color: number[]) {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(x, y)
      ctx.rotate(Math.PI / 4)
      ctx.beginPath()
      ctx.rect(-r / 2, -r / 2, r, r)
      ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`
      ctx.fill()
      ctx.restore()
    }

    function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number, color: number[]) {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5)
      grad.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},${alpha})`)
      grad.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]},0)`)
      ctx.beginPath()
      ctx.arc(x, y, r * 2.5, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()
    }

    let animId: number
    let frame = 0

    const animate = () => {
      animId = requestAnimationFrame(animate)
      frame++
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Spawn new particles
      if (frame % 6 === 0 && particles.length < 120) particles.push(spawnParticle())

      // Draw connections between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(16,185,129,${0.04 * (1 - dist / 100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      particles.forEach((p, idx) => {
        p.x += p.vx
        p.y += p.vy
        p.life++

        const lifeRatio = p.life / p.maxLife
        const baseAlpha = p.opacity * Math.sin(lifeRatio * Math.PI)
        const twinkle   = 0.5 + 0.5 * Math.sin(frame * 0.05 + p.twinkleOffset)
        const alpha     = baseAlpha * (0.6 + 0.4 * twinkle)

        const color = colors[Math.floor((idx + frame * 0.01) % colors.length)]

        if (alpha > 0.01) {
          if (p.type === 'star')    drawStar(ctx, p.x, p.y, p.size * 2, alpha, color)
          else if (p.type === 'diamond') drawDiamond(ctx, p.x, p.y, p.size * 1.5, alpha, color)
          else drawDot(ctx, p.x, p.y, p.size, alpha, color)
        }

        if (p.life >= p.maxLife) {
          particles[idx] = spawnParticle()
        }
      })
    }

    animate()

    const handleResize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
