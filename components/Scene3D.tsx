'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function Scene3D() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return
    const mount = mountRef.current
    const W = mount.clientWidth
    const H = mount.clientHeight

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100)
    camera.position.set(0, 0, 8)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = true
    mount.appendChild(renderer.domElement)

    // ── Gold bar geometry ─────────────────────────────────────────────
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 1.0,
      roughness: 0.08,
      envMapIntensity: 2,
    })
    const goldMatBright = new THREE.MeshStandardMaterial({
      color: 0xfcd34d,
      metalness: 0.9,
      roughness: 0.1,
    })

    // Gold bars
    const bars: THREE.Mesh[] = []
    const barPositions = [
      [2.5, 0.5, 0],
      [3.2, -0.8, -0.8],
      [2.0, -1.8, -0.5],
      [-3.0, 1.0, 0.5],
      [-2.4, -0.5, -0.8],
    ]
    barPositions.forEach(([x, y, z]) => {
      const geo = new THREE.BoxGeometry(1.4, 0.45, 0.75)
      const bar = new THREE.Mesh(geo, goldMat)
      bar.position.set(x, y, z)
      bar.rotation.set(
        Math.random() * 0.4 - 0.2,
        Math.random() * 0.6 - 0.3,
        Math.random() * 0.2 - 0.1
      )
      bar.castShadow = true
      scene.add(bar)
      bars.push(bar)

      // Engraving lines on bars
      const lineGeo = new THREE.BoxGeometry(1.38, 0.04, 0.73)
      const lineMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 1, roughness: 0.2 })
      const line = new THREE.Mesh(lineGeo, lineMat)
      line.position.copy(bar.position)
      line.position.y += 0.08
      line.rotation.copy(bar.rotation)
      scene.add(line)
    })

    // ── Floating coins ────────────────────────────────────────────────
    const coins: THREE.Mesh[] = []
    const coinPositions = [
      [1.2, 2.2, 0.5],
      [-1.5, 2.5, 0],
      [3.8, 1.5, -1],
      [-3.5, -1.5, 0.5],
      [0.5, -2.5, 0.8],
      [4.0, -0.5, 0.2],
    ]
    coinPositions.forEach(([x, y, z]) => {
      const geo = new THREE.CylinderGeometry(0.4, 0.4, 0.08, 32)
      const coin = new THREE.Mesh(geo, goldMatBright)
      coin.position.set(x, y, z)
      coin.rotation.x = Math.random() * Math.PI
      coin.rotation.z = Math.random() * Math.PI
      scene.add(coin)
      coins.push(coin)

      // Coin edge glow ring
      const ringGeo = new THREE.TorusGeometry(0.4, 0.025, 8, 32)
      const ring = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({
        color: 0xfbbf24, metalness: 1, roughness: 0.05, emissive: 0xf59e0b, emissiveIntensity: 0.3
      }))
      ring.position.set(x, y, z)
      ring.rotation.copy(coin.rotation)
      scene.add(ring)
    })

    // ── Dollar sign 3D text (using torus + box approximation) ─────────
    // Glowing orb instead — more impressive
    const orbGeo = new THREE.SphereGeometry(0.8, 64, 64)
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 1.0,
      roughness: 0.05,
      emissive: 0xd97706,
      emissiveIntensity: 0.2,
    })
    const orb = new THREE.Mesh(orbGeo, orbMat)
    orb.position.set(-0.5, 0.3, 1)
    scene.add(orb)

    // Wireframe around orb
    const wireMat = new THREE.MeshBasicMaterial({ color: 0xfcd34d, wireframe: true, transparent: true, opacity: 0.06 })
    const wireOrb = new THREE.Mesh(new THREE.SphereGeometry(0.82, 16, 16), wireMat)
    wireOrb.position.copy(orb.position)
    scene.add(wireOrb)

    // Orbital rings around orb
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(1.3, 0.018, 8, 100),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.5 })
    )
    ring1.position.copy(orb.position)
    ring1.rotation.x = Math.PI / 2.2
    scene.add(ring1)

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.6, 0.012, 8, 100),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.3 })
    )
    ring2.position.copy(orb.position)
    ring2.rotation.x = Math.PI / 3
    ring2.rotation.y = Math.PI / 4
    scene.add(ring2)

    // ── Floating particles ────────────────────────────────────────────
    const particleCount = 150
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 14
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: 0xfcd34d, size: 0.04, transparent: true, opacity: 0.6
    }))
    scene.add(particles)

    // ── Lighting ──────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.4))

    const key = new THREE.PointLight(0xfbbf24, 4, 20)
    key.position.set(4, 4, 4)
    scene.add(key)

    const fill = new THREE.PointLight(0xffffff, 2, 15)
    fill.position.set(-4, 2, 3)
    scene.add(fill)

    const rim = new THREE.PointLight(0x22c55e, 1.5, 12)
    rim.position.set(0, -4, -2)
    scene.add(rim)

    const back = new THREE.PointLight(0xf59e0b, 2, 10)
    back.position.set(-2, -2, -3)
    scene.add(back)

    // ── Mouse parallax ────────────────────────────────────────────────
    let mouseX = 0, mouseY = 0
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove)

    // ── Animation ─────────────────────────────────────────────────────
    let animId: number
    const clock = new THREE.Clock()

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      // Bars float up/down
      bars.forEach((bar, i) => {
        bar.position.y += Math.sin(t * 0.6 + i * 1.2) * 0.002
        bar.rotation.y += 0.002
      })

      // Coins spin and float
      coins.forEach((coin, i) => {
        coin.rotation.y += 0.025
        coin.position.y += Math.sin(t * 0.8 + i * 0.8) * 0.003
      })

      // Orb pulses
      orb.scale.setScalar(1 + Math.sin(t * 1.5) * 0.03)
      ring1.rotation.z += 0.008
      ring2.rotation.z -= 0.005
      wireOrb.rotation.y += 0.003

      // Particles drift
      particles.rotation.y += 0.0005

      // Camera parallax
      camera.position.x += (mouseX * 0.8 - camera.position.x) * 0.04
      camera.position.y += (-mouseY * 0.5 - camera.position.y) * 0.04
      camera.lookAt(0, 0, 0)

      // Key light pulse
      key.intensity = 4 + Math.sin(t * 2) * 0.8

      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const onResize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      mount.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}
