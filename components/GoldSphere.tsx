'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function GoldSphere() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const mount = mountRef.current
    const width = mount.clientWidth
    const height = mount.clientHeight

    // Scene
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.z = 5

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // Gold sphere
    const geometry = new THREE.SphereGeometry(1.8, 64, 64)
    const material = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 1.0,
      roughness: 0.1,
      envMapIntensity: 1.5,
    })
    const sphere = new THREE.Mesh(geometry, material)
    scene.add(sphere)

    // Wireframe overlay
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xfcd34d,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    })
    const wireframe = new THREE.Mesh(new THREE.SphereGeometry(1.82, 32, 32), wireMat)
    scene.add(wireframe)

    // Rings
    const ringGeo = new THREE.TorusGeometry(2.6, 0.015, 16, 200)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.4 })
    const ring1 = new THREE.Mesh(ringGeo, ringMat)
    ring1.rotation.x = Math.PI / 2.5
    scene.add(ring1)

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.010, 16, 200),
      new THREE.MeshBasicMaterial({ color: 0xd97706, transparent: true, opacity: 0.25 }))
    ring2.rotation.x = Math.PI / 3
    ring2.rotation.y = Math.PI / 6
    scene.add(ring2)

    // Floating particles
    const particleCount = 200
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 3.5 + Math.random() * 3
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }
    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particleMat = new THREE.PointsMaterial({ color: 0xfcd34d, size: 0.04, transparent: true, opacity: 0.7 })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
    scene.add(ambientLight)

    const pointLight1 = new THREE.PointLight(0xf59e0b, 3, 20)
    pointLight1.position.set(5, 5, 5)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0xffffff, 1.5, 20)
    pointLight2.position.set(-5, -3, 3)
    scene.add(pointLight2)

    const pointLight3 = new THREE.PointLight(0xd97706, 2, 15)
    pointLight3.position.set(0, -5, -3)
    scene.add(pointLight3)

    // Mouse interaction
    let mouseX = 0, mouseY = 0
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Animation
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      const t = Date.now() * 0.001

      sphere.rotation.y += 0.003
      sphere.rotation.x += 0.001
      wireframe.rotation.y -= 0.002
      ring1.rotation.z += 0.004
      ring2.rotation.z -= 0.003
      particles.rotation.y += 0.001

      // Mouse parallax
      sphere.rotation.y += mouseX * 0.001
      sphere.rotation.x += mouseY * 0.001

      // Pulsing light
      pointLight1.intensity = 3 + Math.sin(t * 1.5) * 0.8

      renderer.render(scene, camera)
    }
    animate()

    // Resize handler
    const handleResize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      mount.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}
