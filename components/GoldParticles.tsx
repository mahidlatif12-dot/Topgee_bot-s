'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number; y: number
  vx: number; vy: number
  size: number; opacity: number
  life: number; maxLife: number
}

export default function GoldParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Particle[] = []

    const spawnParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: canvas.height + 10,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(Math.random() * 0.6 + 0.2),
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.4 + 0.1,
      life: 0,
      maxLife: Math.random() * 300 + 200,
    })

    for (let i = 0; i < 60; i++) {
      const p = spawnParticle()
      p.y = Math.random() * canvas.height
      p.life = Math.random() * p.maxLife
      particles.push(p)
    }

    let animId: number
    let frame = 0

    const animate = () => {
      animId = requestAnimationFrame(animate)
      frame++
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (frame % 8 === 0) particles.push(spawnParticle())
      if (particles.length > 120) particles.splice(0, 1)

      particles.forEach((p, i) => {
        p.x += p.vx
        p.y += p.vy
        p.life++

        const lifeRatio = p.life / p.maxLife
        const alpha = p.opacity * Math.sin(lifeRatio * Math.PI)

        // Diamond shape for some, circle for others
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.globalAlpha = alpha

        if (i % 3 === 0) {
          // Diamond
          ctx.rotate(Math.PI / 4)
          ctx.fillStyle = '#f59e0b'
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        } else {
          // Glowing dot
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2)
          grad.addColorStop(0, '#fcd34d')
          grad.addColorStop(1, 'rgba(245,158,11,0)')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()

        if (p.life >= p.maxLife) {
          particles[i] = spawnParticle()
        }
      })
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
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
