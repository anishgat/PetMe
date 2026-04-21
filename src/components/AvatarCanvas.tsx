import { useEffect, useRef } from 'react'
import * as THREE from 'three'

type AvatarCanvasProps = {
  className?: string
}

const ORGAN_CALLOUTS = [
  { name: 'Brain', swatch: 'bg-fuchsia-300' },
  { name: 'Heart', swatch: 'bg-rose-500' },
  { name: 'Lungs', swatch: 'bg-pink-300' },
  { name: 'Liver', swatch: 'bg-amber-700' },
  { name: 'Stomach', swatch: 'bg-orange-300' },
  { name: 'Intestines', swatch: 'bg-orange-200' },
  { name: 'Kidneys', swatch: 'bg-red-700' },
] as const

function createHeartShape(size: number) {
  const shape = new THREE.Shape()
  shape.moveTo(0, size * 0.9)
  shape.bezierCurveTo(
    size * 0.74,
    size * 1.46,
    size * 1.58,
    size * 0.94,
    size * 1.02,
    size * 0.08
  )
  shape.bezierCurveTo(
    size * 0.78,
    -size * 0.28,
    size * 0.3,
    -size * 0.7,
    0,
    -size * 1.08
  )
  shape.bezierCurveTo(
    -size * 0.3,
    -size * 0.7,
    -size * 0.78,
    -size * 0.28,
    -size * 1.02,
    size * 0.08
  )
  shape.bezierCurveTo(
    -size * 1.58,
    size * 0.94,
    -size * 0.74,
    size * 1.46,
    0,
    size * 0.9
  )
  return shape
}

function createLiverShape(size: number) {
  const shape = new THREE.Shape()
  shape.moveTo(-size * 1.08, size * 0.28)
  shape.bezierCurveTo(
    -size * 0.6,
    size * 0.9,
    size * 0.72,
    size * 1.02,
    size * 1.18,
    size * 0.36
  )
  shape.bezierCurveTo(
    size * 1.3,
    size * 0.02,
    size * 0.96,
    -size * 0.34,
    size * 0.46,
    -size * 0.6
  )
  shape.bezierCurveTo(
    -size * 0.16,
    -size * 0.9,
    -size * 0.9,
    -size * 0.58,
    -size * 1.14,
    -size * 0.06
  )
  shape.bezierCurveTo(
    -size * 1.2,
    size * 0.1,
    -size * 1.14,
    size * 0.2,
    -size * 1.08,
    size * 0.28
  )
  return shape
}

function createStomachShape(size: number) {
  const shape = new THREE.Shape()
  shape.moveTo(-size * 0.22, size * 0.96)
  shape.bezierCurveTo(
    size * 0.62,
    size * 1.1,
    size * 1.04,
    size * 0.56,
    size * 0.92,
    -size * 0.04
  )
  shape.bezierCurveTo(
    size * 0.84,
    -size * 0.58,
    size * 0.3,
    -size * 1.16,
    -size * 0.1,
    -size * 0.98
  )
  shape.bezierCurveTo(
    -size * 0.42,
    -size * 0.82,
    -size * 0.56,
    -size * 0.34,
    -size * 0.44,
    size * 0.16
  )
  shape.bezierCurveTo(
    -size * 0.36,
    size * 0.52,
    -size * 0.54,
    size * 0.82,
    -size * 0.86,
    size * 1.14
  )
  shape.bezierCurveTo(
    -size * 0.68,
    size * 1.18,
    -size * 0.38,
    size * 1.08,
    -size * 0.22,
    size * 0.96
  )
  return shape
}

export default function AvatarCanvas({ className }: AvatarCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100)
    camera.position.set(0, 0.95, 7.55)
    camera.lookAt(0, 0.55, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    container.appendChild(renderer.domElement)

    const geometries = new Set<THREE.BufferGeometry>()
    const materials = new Set<THREE.Material>()

    const trackGeometry = <T extends THREE.BufferGeometry>(geometry: T) => {
      geometries.add(geometry)
      return geometry
    }

    const trackMaterial = <T extends THREE.Material>(material: T) => {
      materials.add(material)
      return material
    }

    const hemiLight = new THREE.HemisphereLight(0xf7fff9, 0xc2c9d6, 1.6)
    scene.add(hemiLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1)
    keyLight.position.set(3.8, 5, 5.2)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0x8de2d1, 1.35)
    rimLight.position.set(-4.5, 2.6, -2.8)
    scene.add(rimLight)

    const chestGlow = new THREE.PointLight(0xff8ca0, 1.4, 5.5)
    chestGlow.position.set(-0.12, 1.92, 1.2)
    scene.add(chestGlow)

    const abdomenGlow = new THREE.PointLight(0xffd1a1, 1, 4.8)
    abdomenGlow.position.set(0.1, 1.05, 1.2)
    scene.add(abdomenGlow)

    const baseMaterial = trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xe8f8f1,
        roughness: 0.95,
        metalness: 0.02,
        transparent: true,
        opacity: 0.9,
      })
    )
    const base = new THREE.Mesh(
      trackGeometry(new THREE.CircleGeometry(1.95, 64)),
      baseMaterial
    )
    base.rotation.x = -Math.PI / 2
    base.position.set(0, -2.74, 0)
    scene.add(base)

    const shadow = new THREE.Mesh(
      trackGeometry(new THREE.CircleGeometry(1.5, 64)),
      trackMaterial(
        new THREE.MeshBasicMaterial({
          color: 0x173322,
          transparent: true,
          opacity: 0.11,
        })
      )
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.position.set(0, -2.72, 0.02)
    shadow.scale.set(1.25, 0.82, 1)
    scene.add(shadow)

    const shellMaterial = trackMaterial(
      new THREE.MeshPhysicalMaterial({
        color: 0xf4d7c7,
        roughness: 0.18,
        metalness: 0,
        clearcoat: 0.45,
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    )

    const solidSkinMaterial = trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xeec6b2,
        roughness: 0.38,
        metalness: 0.02,
        transparent: true,
        opacity: 0.45,
      })
    )

    const brainMaterial = trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xeab0c7,
        roughness: 0.72,
        metalness: 0.02,
        emissive: 0x5f2946,
        emissiveIntensity: 0.1,
      })
    )

    const lungMaterial = trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xeab8c5,
        roughness: 0.8,
        metalness: 0.02,
        emissive: 0x6c3246,
        emissiveIntensity: 0.08,
      })
    )

    const heartMaterial = trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x9b1f34,
        roughness: 0.55,
        metalness: 0.04,
        emissive: 0x35060f,
        emissiveIntensity: 0.22,
      })
    )

    const liverMaterial = trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x784121,
        roughness: 0.72,
        metalness: 0.02,
      })
    )

    const stomachMaterial = trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xe9b4a2,
        roughness: 0.76,
        metalness: 0.02,
      })
    )

    const intestineMaterial = trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xe4b39a,
        roughness: 0.82,
        metalness: 0.01,
      })
    )

    const kidneyMaterial = trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x7f2730,
        roughness: 0.74,
        metalness: 0.02,
      })
    )

    const model = new THREE.Group()
    model.position.set(-0.14, -0.36, 0)
    model.scale.set(0.9, 0.84, 0.84)
    scene.add(model)

    const shellGroup = new THREE.Group()
    const organGroup = new THREE.Group()
    organGroup.position.z = 0.14

    model.add(organGroup)
    model.add(shellGroup)

    const torsoGeometry = trackGeometry(
      new THREE.CapsuleGeometry(0.52, 1.58, 14, 28)
    )
    const neckGeometry = trackGeometry(
      new THREE.CapsuleGeometry(0.11, 0.18, 8, 16)
    )
    const headGeometry = trackGeometry(new THREE.SphereGeometry(0.47, 36, 36))
    const pelvisGeometry = trackGeometry(new THREE.SphereGeometry(0.38, 32, 32))
    const shoulderGeometry = trackGeometry(
      new THREE.SphereGeometry(0.19, 24, 24)
    )
    const upperArmGeometry = trackGeometry(
      new THREE.CapsuleGeometry(0.14, 1.04, 10, 18)
    )
    const lowerArmGeometry = trackGeometry(
      new THREE.CapsuleGeometry(0.12, 0.96, 10, 18)
    )
    const handGeometry = trackGeometry(new THREE.SphereGeometry(0.12, 24, 24))
    const upperLegGeometry = trackGeometry(
      new THREE.CapsuleGeometry(0.18, 1.28, 10, 18)
    )
    const lowerLegGeometry = trackGeometry(
      new THREE.CapsuleGeometry(0.15, 1.18, 10, 18)
    )
    const footGeometry = trackGeometry(new THREE.SphereGeometry(0.18, 24, 24))
    const footCapGeometry = trackGeometry(new THREE.BoxGeometry(0.28, 0.09, 0.52))

    const createShellMesh = (
      geometry: THREE.BufferGeometry,
      material: THREE.Material
    ) => {
      const mesh = new THREE.Mesh(geometry, material)
      mesh.renderOrder = 2
      shellGroup.add(mesh)
      return mesh
    }

    const torso = createShellMesh(torsoGeometry, shellMaterial)
    torso.position.set(0, 1.72, 0)
    torso.scale.set(1.18, 1, 0.9)

    const pelvis = createShellMesh(pelvisGeometry, shellMaterial)
    pelvis.position.set(0, 0.54, 0)
    pelvis.scale.set(1.34, 0.78, 0.96)

    const neck = createShellMesh(neckGeometry, shellMaterial)
    neck.position.set(0, 2.86, 0)
    neck.scale.set(1, 1.1, 0.92)

    const head = createShellMesh(headGeometry, shellMaterial)
    head.position.set(0, 3.46, 0.02)
    head.scale.set(0.92, 1.08, 0.94)

    const leftShoulder = createShellMesh(shoulderGeometry, shellMaterial)
    leftShoulder.position.set(-0.68, 2.42, 0)
    leftShoulder.scale.set(1.24, 1.02, 1)

    const rightShoulder = createShellMesh(shoulderGeometry, shellMaterial)
    rightShoulder.position.set(0.68, 2.42, 0)
    rightShoulder.scale.set(1.24, 1.02, 1)

    const leftUpperArm = createShellMesh(upperArmGeometry, shellMaterial)
    leftUpperArm.position.set(-1.08, 1.84, 0)
    leftUpperArm.rotation.z = 0.36
    leftUpperArm.rotation.x = -0.08

    const rightUpperArm = createShellMesh(upperArmGeometry, shellMaterial)
    rightUpperArm.position.set(1.08, 1.84, 0)
    rightUpperArm.rotation.z = -0.36
    rightUpperArm.rotation.x = 0.08

    const leftLowerArm = createShellMesh(lowerArmGeometry, shellMaterial)
    leftLowerArm.position.set(-1.34, 0.88, 0.05)
    leftLowerArm.rotation.z = 0.16
    leftLowerArm.rotation.x = -0.06

    const rightLowerArm = createShellMesh(lowerArmGeometry, shellMaterial)
    rightLowerArm.position.set(1.34, 0.88, 0.05)
    rightLowerArm.rotation.z = -0.16
    rightLowerArm.rotation.x = 0.06

    const leftHand = createShellMesh(handGeometry, solidSkinMaterial)
    leftHand.position.set(-1.44, 0.22, 0.1)
    leftHand.scale.set(1.12, 1.22, 0.82)

    const rightHand = createShellMesh(handGeometry, solidSkinMaterial)
    rightHand.position.set(1.44, 0.22, 0.1)
    rightHand.scale.set(1.12, 1.22, 0.82)

    const leftUpperLeg = createShellMesh(upperLegGeometry, shellMaterial)
    leftUpperLeg.position.set(-0.24, -0.34, 0)
    leftUpperLeg.rotation.z = 0.04

    const rightUpperLeg = createShellMesh(upperLegGeometry, shellMaterial)
    rightUpperLeg.position.set(0.24, -0.34, 0)
    rightUpperLeg.rotation.z = -0.04

    const leftLowerLeg = createShellMesh(lowerLegGeometry, shellMaterial)
    leftLowerLeg.position.set(-0.24, -1.8, 0.02)
    leftLowerLeg.rotation.x = 0.03

    const rightLowerLeg = createShellMesh(lowerLegGeometry, shellMaterial)
    rightLowerLeg.position.set(0.24, -1.8, 0.02)
    rightLowerLeg.rotation.x = 0.03

    const leftFoot = createShellMesh(footGeometry, solidSkinMaterial)
    leftFoot.position.set(-0.24, -2.63, 0.17)
    leftFoot.scale.set(1.44, 0.56, 2.18)

    const rightFoot = createShellMesh(footGeometry, solidSkinMaterial)
    rightFoot.position.set(0.24, -2.63, 0.17)
    rightFoot.scale.set(1.44, 0.56, 2.18)

    const leftFootCap = createShellMesh(footCapGeometry, solidSkinMaterial)
    leftFootCap.position.set(-0.24, -2.66, 0.24)

    const rightFootCap = createShellMesh(footCapGeometry, solidSkinMaterial)
    rightFootCap.position.set(0.24, -2.66, 0.24)

    const brainGroup = new THREE.Group()
    organGroup.add(brainGroup)
    brainGroup.position.set(0, 3.46, 0.02)

    const brainLobeGeometry = trackGeometry(
      new THREE.SphereGeometry(0.17, 20, 20)
    )
    const brainLobes = [
      [-0.18, 0.02, 0.03, 1.08, 1, 1],
      [0.18, 0.02, 0.03, 1.08, 1, 1],
      [-0.08, 0.16, -0.05, 0.92, 0.9, 0.96],
      [0.08, 0.16, -0.05, 0.92, 0.9, 0.96],
      [-0.1, -0.16, 0.02, 0.94, 0.84, 1],
      [0.1, -0.16, 0.02, 0.94, 0.84, 1],
      [0, 0.02, 0.18, 0.88, 0.92, 0.78],
    ] as const

    brainLobes.forEach(([x, y, z, sx, sy, sz]) => {
      const lobe = new THREE.Mesh(brainLobeGeometry, brainMaterial)
      lobe.position.set(x, y, z)
      lobe.scale.set(sx, sy, sz)
      lobe.renderOrder = 1
      brainGroup.add(lobe)
    })

    const lungGeometry = trackGeometry(
      new THREE.CapsuleGeometry(0.21, 0.52, 10, 18)
    )
    const lowerLungGeometry = trackGeometry(
      new THREE.SphereGeometry(0.19, 20, 20)
    )

    const leftLung = new THREE.Group()
    const leftLungUpper = new THREE.Mesh(lungGeometry, lungMaterial)
    leftLungUpper.scale.set(0.84, 1.05, 0.72)
    leftLungUpper.renderOrder = 1
    const leftLungLower = new THREE.Mesh(lowerLungGeometry, lungMaterial)
    leftLungLower.position.set(0.02, -0.3, 0)
    leftLungLower.scale.set(1.02, 1.1, 0.78)
    leftLungLower.renderOrder = 1
    leftLung.add(leftLungUpper, leftLungLower)
    leftLung.position.set(-0.46, 1.98, 0.03)
    leftLung.rotation.z = -0.05
    organGroup.add(leftLung)

    const rightLung = leftLung.clone()
    rightLung.position.x = 0.46
    rightLung.rotation.z = 0.05
    organGroup.add(rightLung)

    const trachea = new THREE.Mesh(
      trackGeometry(new THREE.CylinderGeometry(0.05, 0.06, 0.46, 18)),
      trackMaterial(
        new THREE.MeshStandardMaterial({
          color: 0xe8ddd3,
          roughness: 0.82,
          metalness: 0.01,
          transparent: true,
          opacity: 0.92,
        })
      )
    )
    trachea.position.set(0, 2.32, 0.02)
    trachea.renderOrder = 1
    organGroup.add(trachea)

    const heartGeometry = trackGeometry(
      new THREE.ExtrudeGeometry(createHeartShape(0.32), {
        depth: 0.18,
        bevelEnabled: true,
        bevelSegments: 4,
        bevelSize: 0.02,
        bevelThickness: 0.02,
        curveSegments: 42,
      })
    )
    heartGeometry.center()

    const heart = new THREE.Mesh(heartGeometry, heartMaterial)
    heart.position.set(-0.02, 1.72, 0.2)
    heart.rotation.y = -0.14
    heart.rotation.z = 0
    heart.scale.set(0.7, 0.78, 0.9)
    heart.renderOrder = 1
    organGroup.add(heart)

    const liverGeometry = trackGeometry(
      new THREE.ExtrudeGeometry(createLiverShape(0.54), {
        depth: 0.22,
        bevelEnabled: true,
        bevelSegments: 3,
        bevelSize: 0.02,
        bevelThickness: 0.02,
        curveSegments: 32,
      })
    )
    liverGeometry.center()

    const liver = new THREE.Mesh(liverGeometry, liverMaterial)
    liver.position.set(0.48, 1.1, 0.08)
    liver.rotation.y = -0.04
    liver.rotation.z = 0.12
    liver.scale.set(0.78, 0.68, 0.9)
    liver.renderOrder = 1
    organGroup.add(liver)

    const stomachGeometry = trackGeometry(
      new THREE.ExtrudeGeometry(createStomachShape(0.46), {
        depth: 0.18,
        bevelEnabled: true,
        bevelSegments: 3,
        bevelSize: 0.018,
        bevelThickness: 0.018,
        curveSegments: 32,
      })
    )
    stomachGeometry.center()

    const stomach = new THREE.Mesh(stomachGeometry, stomachMaterial)
    stomach.position.set(-0.38, 1.14, 0.12)
    stomach.rotation.y = 0.14
    stomach.rotation.z = 0.22
    stomach.scale.set(0.76, 0.88, 0.84)
    stomach.renderOrder = 1
    organGroup.add(stomach)

    const kidneyGeometry = trackGeometry(
      new THREE.SphereGeometry(0.16, 20, 20)
    )

    const leftKidney = new THREE.Mesh(kidneyGeometry, kidneyMaterial)
    leftKidney.position.set(-0.42, 0.98, -0.16)
    leftKidney.scale.set(0.66, 1, 0.5)
    leftKidney.renderOrder = 1
    organGroup.add(leftKidney)

    const rightKidney = new THREE.Mesh(kidneyGeometry, kidneyMaterial)
    rightKidney.position.set(0.42, 0.98, -0.16)
    rightKidney.scale.set(0.66, 1, 0.5)
    rightKidney.renderOrder = 1
    organGroup.add(rightKidney)

    const largeIntestineCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-0.5, 0.98, 0.04),
        new THREE.Vector3(-0.42, 1.05, 0.08),
        new THREE.Vector3(0.42, 1.05, 0.08),
        new THREE.Vector3(0.5, 0.98, 0.04),
        new THREE.Vector3(0.46, 0.34, 0.06),
        new THREE.Vector3(0.12, 0.16, 0.08),
        new THREE.Vector3(-0.12, 0.16, 0.08),
        new THREE.Vector3(-0.46, 0.34, 0.04),
        new THREE.Vector3(-0.5, 0.98, 0.04),
      ],
      true,
      'centripetal'
    )
    const largeIntestines = new THREE.Mesh(
      trackGeometry(new THREE.TubeGeometry(largeIntestineCurve, 180, 0.08, 14, true)),
      intestineMaterial
    )
    largeIntestines.renderOrder = 1
    organGroup.add(largeIntestines)

    const smallIntestineCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-0.22, 0.8, 0.06),
        new THREE.Vector3(0.22, 0.8, 0.08),
        new THREE.Vector3(0.24, 0.66, 0.04),
        new THREE.Vector3(-0.22, 0.66, 0.06),
        new THREE.Vector3(-0.26, 0.52, 0.08),
        new THREE.Vector3(0.2, 0.52, 0.02),
        new THREE.Vector3(0.18, 0.38, 0.07),
        new THREE.Vector3(-0.16, 0.38, 0.02),
        new THREE.Vector3(-0.12, 0.28, 0.08),
        new THREE.Vector3(0.12, 0.28, 0.05),
      ],
      false,
      'centripetal'
    )
    const smallIntestines = new THREE.Mesh(
      trackGeometry(new THREE.TubeGeometry(smallIntestineCurve, 180, 0.055, 14, false)),
      intestineMaterial
    )
    smallIntestines.renderOrder = 1
    organGroup.add(smallIntestines)

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
      const elapsed = clock.getElapsedTime()
      const breath = 1 + Math.sin(elapsed * 1.55) * 0.028
      const torsoDepth = 0.9 + Math.sin(elapsed * 1.55) * 0.038
      const pulse =
        1 +
        Math.max(0, Math.sin(elapsed * 3.8)) * 0.08 +
        Math.max(0, Math.sin(elapsed * 7.6)) * 0.035

      model.position.x = -0.14
      model.position.y = -0.36 + Math.sin(elapsed * 0.9) * 0.04
      model.rotation.y = Math.sin(elapsed * 0.42) * 0.05
      model.rotation.x = Math.sin(elapsed * 0.28) * 0.03

      torso.scale.set(1.18, breath, torsoDepth)
      leftShoulder.position.y = 2.42 + Math.sin(elapsed * 1.55) * 0.02
      rightShoulder.position.y = 2.42 + Math.sin(elapsed * 1.55) * 0.02
      head.rotation.z = Math.sin(elapsed * 0.68) * 0.04
      head.rotation.x = Math.sin(elapsed * 0.6) * 0.03

      leftUpperArm.rotation.z = 0.36 + Math.sin(elapsed * 0.8) * 0.04
      rightUpperArm.rotation.z = -0.36 - Math.sin(elapsed * 0.8) * 0.04
      leftLowerArm.rotation.z = 0.16 + Math.sin(elapsed * 0.8 + 0.6) * 0.03
      rightLowerArm.rotation.z = -0.16 - Math.sin(elapsed * 0.8 + 0.6) * 0.03

      brainGroup.rotation.y = Math.sin(elapsed * 0.46) * 0.08
      leftLung.scale.set(1 - Math.sin(elapsed * 1.55) * 0.025, breath, torsoDepth)
      rightLung.scale.set(1 - Math.sin(elapsed * 1.55) * 0.025, breath, torsoDepth)
      heart.scale.set(0.7 * pulse, 0.78 * pulse, 0.9 * pulse)
      liver.rotation.y = -0.04 + Math.sin(elapsed * 0.7) * 0.03
      stomach.rotation.y = 0.14 + Math.sin(elapsed * 0.82) * 0.04
      largeIntestines.rotation.z = Math.sin(elapsed * 0.52) * 0.025
      smallIntestines.rotation.z = -Math.sin(elapsed * 0.52) * 0.04
      chestGlow.intensity = 1.2 + Math.max(0, Math.sin(elapsed * 3.8)) * 0.4

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

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  const wrapperClassName = [
    'relative h-72 w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-b from-emerald-50 via-white to-slate-50 shadow-inner',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={wrapperClassName}>
      <div ref={containerRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-emerald-900/60">
        <span>Visible anatomy</span>
        <span>Animated human form</span>
      </div>
      <div className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-wrap justify-center gap-2">
        {ORGAN_CALLOUTS.map((organ) => (
          <span
            key={organ.name}
            className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-1 text-[0.68rem] font-medium text-slate-700 shadow-sm backdrop-blur"
          >
            <span className={`h-2.5 w-2.5 rounded-full ${organ.swatch}`} />
            {organ.name}
          </span>
        ))}
      </div>
    </div>
  )
}
