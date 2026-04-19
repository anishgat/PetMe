import { useEffect, useRef } from 'react'
import * as THREE from 'three'

type AvatarCanvasProps = {
  className?: string
}

export default function AvatarCanvas({ className }: AvatarCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50)
    camera.position.set(0, 0.55, 3.3)
    camera.lookAt(0, 0.15, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(0xffffff, 0.85)
    scene.add(ambient)

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.95)
    keyLight.position.set(2.5, 3, 2)
    scene.add(keyLight)

    const fillLight = new THREE.PointLight(0x34d399, 0.6, 8)
    fillLight.position.set(-2, 1.5, 2)
    scene.add(fillLight)

    const group = new THREE.Group()
    group.position.y = -0.1
    scene.add(group)

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      roughness: 0.35,
      metalness: 0.05,
    })
    const highlightMaterial = new THREE.MeshStandardMaterial({
      color: 0x6ee7b7,
      roughness: 0.2,
      metalness: 0.08,
    })
    const darkMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.6,
      metalness: 0.2,
    })

    const bodyGeometry = new THREE.SphereGeometry(0.75, 48, 48)
    const headGeometry = new THREE.SphereGeometry(0.45, 48, 48)
    const eyeGeometry = new THREE.SphereGeometry(0.06, 24, 24)
    const ringGeometry = new THREE.TorusGeometry(0.95, 0.08, 24, 100)
    const baseGeometry = new THREE.CircleGeometry(1.35, 64)

    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.scale.set(1, 1.08, 1)
    group.add(body)

    const head = new THREE.Mesh(headGeometry, highlightMaterial)
    head.position.set(0, 0.88, 0.08)
    group.add(head)

    const leftEye = new THREE.Mesh(eyeGeometry, darkMaterial)
    leftEye.position.set(-0.16, 0.94, 0.43)
    group.add(leftEye)

    const rightEye = leftEye.clone()
    rightEye.position.x = 0.16
    group.add(rightEye)

    const ring = new THREE.Mesh(ringGeometry, highlightMaterial)
    ring.rotation.x = Math.PI / 2.2
    ring.position.y = -0.38
    group.add(ring)

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0xecfdf5,
      roughness: 0.95,
      metalness: 0.05,
    })
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    base.rotation.x = -Math.PI / 2
    base.position.y = -1.05
    scene.add(base)

    const geometries = [
      bodyGeometry,
      headGeometry,
      eyeGeometry,
      ringGeometry,
      baseGeometry,
    ]
    const materials = [
      bodyMaterial,
      highlightMaterial,
      darkMaterial,
      baseMaterial,
    ]

    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      if (width === 0 || height === 0) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)

    const clock = new THREE.Clock()
    let frameId = 0

    const animate = () => {
      const t = clock.getElapsedTime()
      group.position.y = Math.sin(t * 1.2) * 0.04
      group.rotation.y = Math.sin(t * 0.5) * 0.15
      head.rotation.x = Math.sin(t * 0.9) * 0.08
      body.scale.y = 1.04 + Math.sin(t * 1.6) * 0.02
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
      renderer.dispose()
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((material) => material.dispose())
      container.removeChild(renderer.domElement)
    }
  }, [])

  const wrapperClassName = [
    'relative h-72 w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-100 via-white to-white shadow-inner',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <div ref={containerRef} className={wrapperClassName} />
}
