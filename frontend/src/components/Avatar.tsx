import React, { useRef, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF, Html } from '@react-three/drei';
import { Lightbulb, X } from 'lucide-react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface AvatarProps {
  biologicalAge: number;
  skinTone?: string;        // hex color, e.g. "#FDDBB4"
  bodyBuild?: number;       // 0 to 1
  bodyHeight?: number;      // 0 to 1
  eyeColor?: string;        // hex color
  avatarUrl?: string;       // Custom GLB URL (optional)
  thoughtBubble?: string;   // Optional thought/message from the backend
  onOrganClick?: (organ: string) => void;
}

interface OrganConfig {
  name: string;
  label: string;
  color: string;
  emissiveColor: string;
}

const ORGANS: OrganConfig[] = [
  { name: 'heart',   label: 'Heart',   color: '#8B1A1A', emissiveColor: '#ff3030' },
  { name: 'lungs',   label: 'Lungs',   color: '#B05050', emissiveColor: '#ff8080' },
  { name: 'liver',   label: 'Liver',   color: '#5C1010', emissiveColor: '#a03030' },
  { name: 'brain',   label: 'Brain',   color: '#C8808A', emissiveColor: '#ffaaaa' },
  { name: 'kidneys', label: 'Kidneys', color: '#7A2020', emissiveColor: '#c05050' },
];

// ─────────────────────────────────────────────────────────────
// Thought Bubble (connected to 3D model)
// ─────────────────────────────────────────────────────────────

const ThoughtBubble3D: React.FC<{ message: string }> = ({ message }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Html position={[0.75, 1.6, 0]} center zIndexRange={[100, 0]}>
      <div className="pointer-events-auto select-none" style={{ minWidth: 260 }}>
        {collapsed ? (
          <button 
            onClick={() => setCollapsed(false)}
            className="w-12 h-12 bg-slate-900/40 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all shadow-xl group"
          >
            <Lightbulb size={24} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] group-hover:drop-shadow-[0_0_16px_rgba(250,204,21,1)] transition-all" />
          </button>
        ) : (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
            {/* The main cloud/bubble */}
            <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl px-6 py-5 w-full text-center" 
              style={{ borderRadius: '40px 40px 40px 12px' }}>
               <button onClick={() => setCollapsed(true)} className="absolute top-2 right-3 p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                 <X size={14} />
               </button>
               <p className="text-sm font-medium text-white/90 leading-snug tracking-wide italic mt-1">"{message}"</p>
               <p className="text-[10px] font-bold text-white/35 mt-2.5 uppercase tracking-widest">— Future Self</p>
            </div>
            
            {/* Thought bubbles tail pointing down-left towards avatar head */}
            <div className="flex flex-col items-start w-full relative -left-4">
               <div className="w-3.5 h-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full mt-2 ml-4" />
               <div className="w-2 h-2 bg-white/20 backdrop-blur-md rounded-full mt-1.5 ml-1" />
               <div className="w-1.5 h-1.5 bg-white/30 backdrop-blur-md rounded-full mt-1.5 -ml-1" />
            </div>
          </div>
        )}
      </div>
    </Html>
  );
};

// ─────────────────────────────────────────────────────────────
// Shared skin material factory
// ─────────────────────────────────────────────────────────────

function skinMaterial(color: THREE.Color, opacity = 1.0): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.55,
    metalness: 0,
    ior: 1.4,
    thickness: 0.8,
    transmission: opacity < 1 ? 1 - opacity : 0,
    transparent: opacity < 1,
    opacity,
    envMapIntensity: 0.6,
    side: THREE.FrontSide,
  });
}

// ─────────────────────────────────────────────────────────────
// Interactive organ wrapper
// ─────────────────────────────────────────────────────────────

const InteractiveOrgan: React.FC<{
  name: string;
  color: string;
  emissiveColor: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  onOrganClick?: (name: string) => void;
  children: React.ReactNode;
}> = ({ name, color, emissiveColor, position, rotation = [0, 0, 0], scale = [1, 1, 1], onOrganClick, children }) => {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const pulse = hovered ? 1 + Math.sin(t * 7) * 0.045 : 1;
    groupRef.current.scale.set(scale[0] * pulse, scale[1] * pulse, scale[2] * pulse);
  });

  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color(hovered ? emissiveColor : '#000000'),
    emissiveIntensity: hovered ? 0.5 : 0,
    roughness: 0.4,
    metalness: 0.05,
    envMapIntensity: 0.8,
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={(e) => { e.stopPropagation(); if (onOrganClick) onOrganClick(name); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      {React.Children.map(children, child =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, { material: mat })
          : child
      )}
    </group>
  );
};

// ─────────────────────────────────────────────────────────────
// ORGAN LAYER — Anatomically-styled organs
// ─────────────────────────────────────────────────────────────

/** Heart: double-sphere body + aortic arch tube */
const HeartOrgan: React.FC<{ cfg: OrganConfig; onClick?: (s: string) => void }> = ({ cfg, onClick }) => (
  <InteractiveOrgan name={cfg.name} color={cfg.color} emissiveColor={cfg.emissiveColor}
    position={[-0.05, 0.18, 0.28]} onOrganClick={onClick}>
    {/* Main ventricle body */}
    <mesh position={[0, -0.04, 0]}>
      <sphereGeometry args={[0.115, 32, 32]} />
    </mesh>
    {/* Upper atria */}
    <mesh position={[0.04, 0.06, 0]} scale={[0.8, 0.7, 0.8]}>
      <sphereGeometry args={[0.09, 32, 32]} />
    </mesh>
    {/* Aorta arch */}
    <mesh position={[0.03, 0.19, 0]} rotation={[0, 0, -0.6]}>
      <torusGeometry args={[0.07, 0.022, 12, 32, Math.PI * 0.9]} />
    </mesh>
    {/* Pulmonary trunk */}
    <mesh position={[0.0, 0.18, 0.02]} rotation={[-0.4, 0, 0.3]}>
      <cylinderGeometry args={[0.018, 0.018, 0.12, 12]} />
    </mesh>
  </InteractiveOrgan>
);

/** Lungs: 3 lobes each side, slanted inward */
const LungOrgan: React.FC<{ cfg: OrganConfig; side: 1 | -1; onClick?: (s: string) => void }> = ({ cfg, side, onClick }) => (
  <InteractiveOrgan name={cfg.name} color={cfg.color} emissiveColor={cfg.emissiveColor}
    position={[side * 0.22, 0.18, 0.08]}
    scale={[0.78, 1, 0.72]}
    rotation={[0.05, side * -0.12, side * 0.07]}
    onOrganClick={onClick}>
    {/* Upper lobe */}
    <mesh position={[0, 0.22, 0]} scale={[1, 0.8, 0.9]}>
      <sphereGeometry args={[0.1, 24, 24]} />
    </mesh>
    {/* Middle lobe */}
    <mesh position={[0, 0.05, 0]}>
      <sphereGeometry args={[0.115, 24, 24]} />
    </mesh>
    {/* Lower lobe */}
    <mesh position={[0, -0.14, -0.04]} scale={[1, 0.9, 1.1]}>
      <sphereGeometry args={[0.105, 24, 24]} />
    </mesh>
  </InteractiveOrgan>
);

/** Liver: large wedge-shaped lobe on the right */
const LiverOrgan: React.FC<{ cfg: OrganConfig; onClick?: (s: string) => void }> = ({ cfg, onClick }) => (
  <InteractiveOrgan name={cfg.name} color={cfg.color} emissiveColor={cfg.emissiveColor}
    position={[0.14, -0.08, 0.1]}
    scale={[1.5, 0.55, 0.9]}
    rotation={[0.1, 0, -0.25]}
    onOrganClick={onClick}>
    {/* Main right lobe */}
    <mesh position={[-0.04, 0, 0]}>
      <sphereGeometry args={[0.155, 32, 32]} />
    </mesh>
    {/* Left lobe (smaller) */}
    <mesh position={[-0.18, 0.01, 0.01]} scale={[0.65, 0.8, 0.8]}>
      <sphereGeometry args={[0.12, 24, 24]} />
    </mesh>
  </InteractiveOrgan>
);

/** Brain: folded cortex approximated by nested torus-knots inside a transparent sphere */
const BrainOrgan: React.FC<{ cfg: OrganConfig; onClick?: (s: string) => void }> = ({ cfg, onClick }) => (
  <InteractiveOrgan name={cfg.name} color={cfg.color} emissiveColor={cfg.emissiveColor}
    position={[0, 0.0, 0.0]}
    onOrganClick={onClick}>
    {/* Hemispheres */}
    <mesh position={[-0.06, 0, 0]} scale={[1, 0.85, 0.9]}>
      <sphereGeometry args={[0.115, 32, 32]} />
    </mesh>
    <mesh position={[0.06, 0, 0]} scale={[1, 0.85, 0.9]}>
      <sphereGeometry args={[0.115, 32, 32]} />
    </mesh>
    {/* Cerebellum */}
    <mesh position={[0, -0.1, -0.09]} scale={[0.8, 0.55, 0.7]}>
      <sphereGeometry args={[0.1, 24, 24]} />
    </mesh>
    {/* Brain stem */}
    <mesh position={[0, -0.2, -0.04]} rotation={[0.3, 0, 0]}>
      <cylinderGeometry args={[0.028, 0.022, 0.14, 12]} />
    </mesh>
    {/* Cortex fold texture via small torus rings */}
    {[-0.05, 0, 0.05].map((x, i) => (
      <mesh key={i} position={[x, 0.04, 0.06]} rotation={[0.3, 0, i * 0.5]}>
        <torusGeometry args={[0.07, 0.012, 8, 24, Math.PI]} />
      </mesh>
    ))}
  </InteractiveOrgan>
);

/** Kidneys: bean-shaped using a squashed torus */
const KidneyOrgan: React.FC<{ cfg: OrganConfig; side: 1 | -1; onClick?: (s: string) => void }> = ({ cfg, side, onClick }) => (
  <InteractiveOrgan name={cfg.name} color={cfg.color} emissiveColor={cfg.emissiveColor}
    position={[side * 0.2, -0.18, -0.1]}
    scale={[0.55, 0.95, 0.55]}
    rotation={[0.1, side * 0.4, side * 0.15]}
    onOrganClick={onClick}>
    {/* Main body */}
    <mesh>
      <capsuleGeometry args={[0.07, 0.1, 16, 16]} />
    </mesh>
    {/* Cortex ridge */}
    <mesh position={[side * -0.04, 0, 0]} scale={[0.4, 0.75, 0.7]}>
      <sphereGeometry args={[0.06, 16, 16]} />
    </mesh>
  </InteractiveOrgan>
);

const OrganLayer: React.FC<{ onOrganClick?: (name: string) => void }> = ({ onOrganClick }) => {
  const organMap: Record<string, OrganConfig> = Object.fromEntries(ORGANS.map(o => [o.name, o]));
  return (
    <group name="organs">
      <HeartOrgan   cfg={organMap.heart}   onClick={onOrganClick} />
      <LungOrgan    cfg={organMap.lungs}   side={-1} onClick={onOrganClick} />
      <LungOrgan    cfg={organMap.lungs}   side={1}  onClick={onOrganClick} />
      <LiverOrgan   cfg={organMap.liver}   onClick={onOrganClick} />
      <BrainOrgan   cfg={organMap.brain}   onClick={onOrganClick} />
      <KidneyOrgan  cfg={organMap.kidneys} side={-1} onClick={onOrganClick} />
      <KidneyOrgan  cfg={organMap.kidneys} side={1}  onClick={onOrganClick} />
    </group>
  );
};

// ─────────────────────────────────────────────────────────────
// HUMAN BODY LAYER
// ─────────────────────────────────────────────────────────────

const HumanBody: React.FC<{
  skinColor: THREE.Color;
  vitalityScore: number;
  bodyBuild?: number;
  bodyHeight?: number;
  eyeColor?: string;
  onOrganClick?: (name: string) => void;
}> = ({ skinColor, vitalityScore, bodyBuild = 0.5, bodyHeight = 0.5, eyeColor = '#3a2a10', onOrganClick }) => {
  const rootRef = useRef<THREE.Group>(null);
  const chestRef = useRef<THREE.Mesh>(null);

  // Slight hunch for low vitality
  const spineAngle = THREE.MathUtils.lerp(0.18, 0, vitalityScore / 100);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const rate = vitalityScore > 50 ? 0.9 : 0.5;
    // Breathing: subtle chest scale
    if (chestRef.current) {
      const breathe = 1 + Math.sin(t * rate) * 0.012;
      chestRef.current.scale.set(breathe, 1, breathe);
    }
  });

  const skinOpaque = skinMaterial(skinColor, 1.0);
  const skinTranslucent = skinMaterial(skinColor, 0.18);   // torso see-through

  // Body scale ranges based on 0-1 inputs
  const buildScale = 0.85 + (bodyBuild * 0.3); // 0.85x to 1.15x width/depth
  const heightScale = 0.9 + (bodyHeight * 0.2); // 0.9x to 1.1x height

  return (
    <group ref={rootRef} position={[0, -2.1 * heightScale, 0]} scale={[1.18 * buildScale, 1.18 * heightScale, 1.18 * buildScale]}>

      {/* ── HEAD ── */}
      <group position={[0, 3.55, 0]}>
        {/* Cranium */}
        <mesh material={skinOpaque}>
          <sphereGeometry args={[0.38, 48, 48]} />
        </mesh>
        {/* Jaw / lower face — squashed sphere pulled forward */}
        <mesh position={[0, -0.17, 0.06]} scale={[0.9, 0.62, 0.88]} material={skinOpaque}>
          <sphereGeometry args={[0.34, 32, 32]} />
        </mesh>
        {/* Brow ridge */}
        <mesh position={[0, 0.1, 0.34]} scale={[1, 0.35, 0.5]} material={skinOpaque}>
          <sphereGeometry args={[0.22, 24, 12]} />
        </mesh>
        {/* Nose */}
        <mesh position={[0, -0.04, 0.4]} scale={[0.45, 0.55, 0.6]} material={skinOpaque}>
          <sphereGeometry args={[0.1, 16, 16]} />
        </mesh>
        {/* Nose tip */}
        <mesh position={[0, -0.1, 0.44]} scale={[1, 0.7, 0.9]} material={skinOpaque}>
          <sphereGeometry args={[0.05, 16, 16]} />
        </mesh>
        {/* Left nostril */}
        <mesh position={[-0.04, -0.11, 0.43]} material={new THREE.MeshBasicMaterial({ color: '#4a2a1a' })}>
          <sphereGeometry args={[0.018, 8, 8]} />
        </mesh>
        {/* Right nostril */}
        <mesh position={[0.04, -0.11, 0.43]} material={new THREE.MeshBasicMaterial({ color: '#4a2a1a' })}>
          <sphereGeometry args={[0.018, 8, 8]} />
        </mesh>
        {/* Lips */}
        <mesh position={[0, -0.23, 0.37]} scale={[1.1, 0.45, 0.9]}>
          <sphereGeometry args={[0.09, 24, 12]} />
          <meshStandardMaterial color="#c87070" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.29, 0.36]} scale={[1, 0.38, 0.85]}>
          <sphereGeometry args={[0.08, 24, 12]} />
          <meshStandardMaterial color="#b86060" roughness={0.5} />
        </mesh>
        {/* Eyes — whites */}
        {[-0.16, 0.16].map((x, i) => (
          <group key={i} position={[x, 0.06, 0.35]}>
            <mesh>
              <sphereGeometry args={[0.072, 24, 24]} />
              <meshBasicMaterial color="#f5f0eb" />
            </mesh>
            {/* Iris */}
            <mesh position={[0, 0, 0.055]}>
              <circleGeometry args={[0.038, 24]} />
              <meshBasicMaterial color={eyeColor} />
            </mesh>
            {/* Pupil */}
            <mesh position={[0, 0, 0.058]}>
              <circleGeometry args={[0.018, 16]} />
              <meshBasicMaterial color="#0a0a0a" />
            </mesh>
            {/* Specular */}
            <mesh position={[0.012, 0.012, 0.062]}>
              <circleGeometry args={[0.006, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}
        {/* Eyelids */}
        {[-0.16, 0.16].map((x, i) => (
          <mesh key={i} position={[x, 0.09, 0.38]} scale={[1.1, 0.4, 0.7]} material={skinOpaque}>
            <sphereGeometry args={[0.075, 24, 12]} />
          </mesh>
        ))}
        {/* Ears */}
        {[-1, 1].map((s, i) => (
          <mesh key={i} position={[s * 0.39, 0, 0.02]} scale={[0.35, 0.65, 0.42]} material={skinOpaque}>
            <sphereGeometry args={[0.18, 24, 24]} />
          </mesh>
        ))}
        {/* Chin */}
        <mesh position={[0, -0.36, 0.18]} scale={[0.65, 0.4, 0.7]} material={skinOpaque}>
          <sphereGeometry args={[0.16, 24, 16]} />
        </mesh>
        {/* Brain organ inside head */}
        <group position={[0, 0.02, -0.04]} scale={[0.95, 0.95, 0.95]}>
          <BrainOrgan
            cfg={{ name: 'brain', label: 'Brain', color: '#C8808A', emissiveColor: '#ffaaaa' }}
            onClick={onOrganClick}
          />
        </group>
      </group>

      {/* ── NECK ── */}
      <mesh position={[0, 3.05, 0]} material={skinOpaque}>
        <cylinderGeometry args={[0.13, 0.17, 0.52, 20]} />
      </mesh>

      {/* ── TORSO (translucent to show organs) ── */}
      <group position={[0, 2.0, 0]} rotation={[spineAngle, 0, 0]}>
        {/* Chest (wider shoulders, narrower waist) */}
        <mesh ref={chestRef} position={[0, 0.38, 0]} material={skinTranslucent}>
          <capsuleGeometry args={[0.52, 0.55, 32, 32]} />
        </mesh>
        {/* Abdomen */}
        <mesh position={[0, -0.35, -0.02]} scale={[0.86, 1, 0.82]} material={skinTranslucent}>
          <capsuleGeometry args={[0.44, 0.35, 32, 32]} />
        </mesh>
        {/* Pelvis */}
        <mesh position={[0, -0.95, -0.04]} scale={[1.06, 0.7, 0.88]} material={skinOpaque}>
          <capsuleGeometry args={[0.42, 0.22, 32, 32]} />
        </mesh>
        {/* Clavicle/traps geometry */}
        <mesh position={[0, 0.85, 0.05]} scale={[1.45, 0.28, 0.62]} material={skinOpaque}>
          <sphereGeometry args={[0.34, 24, 12]} />
        </mesh>

        {/* Organ layer sits inside torso */}
        <OrganLayer onOrganClick={onOrganClick} />
      </group>

      {/* ── ARMS ── */}
      {([-1, 1] as const).map((side, i) => (
        <group key={i} position={[side * 0.74, 2.82, 0]}>
          {/* Shoulder cap */}
          <mesh material={skinOpaque}>
            <sphereGeometry args={[0.215, 24, 24]} />
          </mesh>
          {/* Upper arm — slightly angled outward */}
          <mesh position={[side * 0.08, -0.52, 0.02]} rotation={[0.05, 0, side * 0.15]} material={skinOpaque}>
            <capsuleGeometry args={[0.135, 0.78, 20, 20]} />
          </mesh>
          {/* Elbow */}
          <mesh position={[side * 0.16, -1.05, 0.04]} material={skinOpaque}>
            <sphereGeometry args={[0.115, 20, 20]} />
          </mesh>
          {/* Forearm — angles slightly forward */}
          <mesh position={[side * 0.2, -1.6, 0.06]} rotation={[-0.08, 0, side * 0.08]} material={skinOpaque}>
            <capsuleGeometry args={[0.1, 0.72, 20, 20]} />
          </mesh>
          {/* Wrist */}
          <mesh position={[side * 0.24, -2.05, 0.08]} material={skinOpaque}>
            <sphereGeometry args={[0.09, 16, 16]} />
          </mesh>
          {/* Hand */}
          <mesh position={[side * 0.27, -2.28, 0.07]} scale={[1, 0.62, 0.5]} material={skinOpaque}>
            <sphereGeometry args={[0.12, 20, 16]} />
          </mesh>
        </group>
      ))}

      {/* ── LEGS ── */}
      {([-1, 1] as const).map((side, i) => (
        <group key={i} position={[side * 0.26, 0.72, 0]}>
          {/* Hip joint */}
          <mesh material={skinOpaque}>
            <sphereGeometry args={[0.2, 24, 24]} />
          </mesh>
          {/* Thigh */}
          <mesh position={[0, -0.72, 0]} material={skinOpaque}>
            <capsuleGeometry args={[0.185, 1.0, 20, 20]} />
          </mesh>
          {/* Knee */}
          <mesh position={[0, -1.38, 0.04]} material={skinOpaque}>
            <sphereGeometry args={[0.155, 20, 20]} />
          </mesh>
          {/* Calf */}
          <mesh position={[0, -2.0, 0.02]} rotation={[0.04, 0, side * -0.02]} material={skinOpaque}>
            <capsuleGeometry args={[0.13, 1.0, 20, 20]} />
          </mesh>
          {/* Ankle */}
          <mesh position={[0, -2.65, 0.04]} material={skinOpaque}>
            <sphereGeometry args={[0.1, 16, 16]} />
          </mesh>
          {/* Foot */}
          <mesh position={[0, -2.76, 0.13]} rotation={[-0.2, 0, 0]} scale={[0.95, 0.45, 1.5]} material={skinOpaque}>
            <sphereGeometry args={[0.13, 20, 16]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const RealisticAvatar: React.FC<{
  url: string;
  vitalityScore: number;
  onOrganClick?: (name: string) => void;
}> = ({ url, vitalityScore, onOrganClick }) => {
  const { scene } = useGLTF(url);
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);

  React.useEffect(() => {
    const skinTranslucent = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#D8956B'),
      roughness: 0.2,
      metalness: 0,
      ior: 1.5,
      thickness: 1.0,
      transmission: 0.8,
      transparent: true,
      opacity: 0.9,
      side: THREE.FrontSide,
    });

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
         if (child.name.includes('Body') || child.name.includes('Top') || child.name.includes('Shirt')) {
             const origMat = child.material;
             const mat = skinTranslucent.clone();
             if (origMat.map) mat.map = origMat.map;
             mat.color = origMat.color || new THREE.Color('#ffffff');
             child.material = mat;
         }
      }
    });
  }, [clonedScene]);

  const spineAngle = THREE.MathUtils.lerp(0.18, 0, vitalityScore / 100);

  return (
    <group position={[0, -2.1, 0]} scale={[1.18, 1.18, 1.18]}>
      <primitive object={clonedScene} rotation={[spineAngle, 0, 0]} />
      {/* Position organs inside chest cavity of RPM avatar */}
      <group position={[0, 1.35, 0.05]} scale={[1.1, 1.1, 1.1]} rotation={[spineAngle, 0, 0]}>
        <OrganLayer onOrganClick={onOrganClick} />
      </group>
    </group>
  );
};

// ─────────────────────────────────────────────────────────────
// Scene lighting
// ─────────────────────────────────────────────────────────────

const SceneLights: React.FC<{ vitalityScore: number }> = ({ vitalityScore }) => {
  const keyRef   = useRef<THREE.DirectionalLight>(null);
  const fillRef  = useRef<THREE.DirectionalLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.3;
    if (keyRef.current) {
      keyRef.current.position.x = Math.sin(t) * 5;
      keyRef.current.position.z = Math.cos(t) * 5;
    }
  });

  const vitMax = vitalityScore / 100;
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight ref={keyRef} position={[4, 8, 5]} intensity={1.4} castShadow
        color={new THREE.Color().setHSL(0.06, 0.15, 0.95)} />
      <directionalLight ref={fillRef} position={[-5, 4, -3]} intensity={0.5}
        color={new THREE.Color().setHSL(0.6, 0.3, 0.5 + vitMax * 0.3)} />
      <pointLight position={[0, 3, 2]} intensity={0.6} color="#ffe8d0" distance={8} decay={2} />
      {/* Rim light from behind for a halo effect */}
      <directionalLight position={[0, 5, -6]} intensity={0.8} color="#a0c8ff" />
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// Avatar (Canvas host)
// ─────────────────────────────────────────────────────────────

const SKIN_TONES: Record<string, string> = {
  light:       '#FDDBB4',
  medium:      '#D8956B',
  olive:       '#C68642',
  brown:       '#8D5524',
  dark:        '#4A2912',
};

const Avatar: React.FC<AvatarProps> = ({ biologicalAge, skinTone = 'medium', bodyBuild = 0.5, bodyHeight = 0.5, eyeColor = '#3a2a10', avatarUrl, thoughtBubble, onOrganClick }) => {
  const vitalityScore = Math.max(0, 100 - Math.max(0, biologicalAge - 18) * 1.5);
  const hex = SKIN_TONES[skinTone] ?? skinTone;
  const skinColor = new THREE.Color(hex);

  const handleOrganClick = useCallback((name: string) => {
    if (onOrganClick) onOrganClick(name);
  }, [onOrganClick]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 1.2, 5.8], fov: 46 }}
        shadows
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#08090f']} />
        <fog attach="fog" args={['#08090f', 12, 28]} />

        <SceneLights vitalityScore={vitalityScore} />
        <Environment preset="studio" />

        {thoughtBubble && <ThoughtBubble3D message={thoughtBubble} />}

        {avatarUrl ? (
          <React.Suspense fallback={null}>
            <RealisticAvatar
              url={avatarUrl}
              vitalityScore={vitalityScore}
              onOrganClick={handleOrganClick}
            />
          </React.Suspense>
        ) : (
          <HumanBody
            skinColor={skinColor}
            vitalityScore={vitalityScore}
            bodyBuild={bodyBuild}
            bodyHeight={bodyHeight}
            eyeColor={eyeColor}
            onOrganClick={handleOrganClick}
          />
        )}

        <ContactShadows
          position={[0, -3.7, 0]}
          opacity={0.55}
          scale={18}
          blur={2.8}
          far={7}
          color="#000820"
        />

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2.5}
          maxDistance={9}
          minPolarAngle={Math.PI * 0.18}
          maxPolarAngle={Math.PI * 0.72}
          target={[0, 0.8, 0]}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
};

export { ORGANS };
export default Avatar;
