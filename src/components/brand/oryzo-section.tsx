'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Environment, Sparkles, Float } from '@react-three/drei';
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent, MotionValue } from 'framer-motion';
import { useRef, Suspense } from 'react';
import * as THREE from 'three';
import { Brain, Hammer, Rocket, Users } from 'lucide-react';

/* ===============================================================
   ORYZO-STYLE CINEMATIC SCROLL SECTION
   - Fixed 3D canvas behind pinned text
   - Camera orbits 360° around a 3D "AI Core" as you scroll
   - 4 text blocks cross-fade in sync with camera movement
   - Real-time lighting (lights fixed, object rotates through them)
   - Smooth inertia via useSpring (1-second dampening feel)
=============================================================== */

/* ---------- 3D AI Core: the object the camera orbits ---------- */
function AICore({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const nodesRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const p = scrollProgress.current;

    // Group rotates with scroll — this is what creates the "orbiting" feel
    if (groupRef.current) {
      groupRef.current.rotation.y = p * Math.PI * 2; // full 360° rotation
      groupRef.current.rotation.x = p * 0.4; // slight forward tilt as you scroll
    }

    // Inner core breathes
    if (innerRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.06;
      innerRef.current.scale.setScalar(pulse);
    }

    // Wireframe shell rotates opposite for parallax depth
    if (wireRef.current) {
      wireRef.current.rotation.y -= delta * 0.3;
      wireRef.current.rotation.z += delta * 0.1;
    }

    // Orbiting rings
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 0.5;
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = Math.PI / 3;
      ring2Ref.current.rotation.z -= delta * 0.3;
    }

    // Node cluster rotates
    if (nodesRef.current) {
      nodesRef.current.rotation.y += delta * 0.4;
      nodesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  // Orbiting data nodes
  const nodePositions = (() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 2.5;
      arr.push([Math.cos(angle) * r, Math.sin(angle * 2) * 0.5, Math.sin(angle) * r]);
    }
    return arr;
  })();

  return (
    <group ref={groupRef}>
      {/* Inner glowing core — the "AI mind" */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[0.8, 4]} />
        <MeshDistortMaterial
          color="#2563EB"
          speed={2}
          distort={0.3}
          roughness={0.1}
          metalness={0.8}
          emissive="#2563EB"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Wireframe outer shell */}
      <mesh ref={wireRef} scale={1.6}>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshBasicMaterial color="#7C3AED" wireframe transparent opacity={0.35} />
      </mesh>

      {/* Orbiting rings */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2, 0.025, 8, 80]} />
        <meshBasicMaterial color="#16A34A" transparent opacity={0.5} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.4, 0.018, 8, 80]} />
        <meshBasicMaterial color="#06B6D4" transparent opacity={0.3} />
      </mesh>

      {/* Orbiting data nodes */}
      <group ref={nodesRef}>
        {nodePositions.map((pos, i) => (
          <Float key={i} speed={2} floatIntensity={0.5} rotationIntensity={0.5}>
            <mesh position={pos}>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshStandardMaterial
                color={i % 3 === 0 ? '#2563EB' : i % 3 === 1 ? '#7C3AED' : '#16A34A'}
                emissive={i % 3 === 0 ? '#2563EB' : i % 3 === 1 ? '#7C3AED' : '#16A34A'}
                emissiveIntensity={0.6}
                metalness={0.4}
                roughness={0.3}
              />
            </mesh>
          </Float>
        ))}
      </group>

      {/* Central light — fixed in world space, object rotates through it */}
      <pointLight color="#2563EB" intensity={3} distance={6} />
      <pointLight position={[3, 2, 3]} color="#7C3AED" intensity={1.5} distance={8} />
      <pointLight position={[-3, -2, -3]} color="#16A34A" intensity={1} distance={8} />
    </group>
  );
}

/* ---------- Camera Rig: orbits around the AI Core based on scroll ---------- */
function CameraRig({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
  useFrame((state) => {
    const p = scrollProgress.current;
    // Orbit 360° around the object
    const angle = p * Math.PI * 2;
    // Zoom in slightly as you scroll
    const radius = 5.5 - p * 1.5;
    // Tilt up gradually
    const y = p * 1.5;

    state.camera.position.x = Math.sin(angle) * radius;
    state.camera.position.z = Math.cos(angle) * radius;
    state.camera.position.y = y;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

/* ---------- Pinned Text Block (one of 4) ---------- */
type TextBlockData = {
  num: string;
  title: string;
  body: string;
  icon: typeof Brain;
  color: string;
};

function PinnedTextBlock({
  data,
  index,
  count,
  progress,
}: {
  data: TextBlockData;
  index: number;
  count: number;
  progress: MotionValue<number>;
}) {
  const start = index / count;
  const end = (index + 1) / count;
  const fadeIn = start + 0.04;
  const fadeOut = end - 0.04;

  const opacity = useTransform(progress, [start, fadeIn, fadeOut, end], [0, 1, 1, 0]);
  const y = useTransform(progress, [start, fadeIn, fadeOut, end], [60, 0, 0, -60]);
  const scale = useTransform(progress, [start, fadeIn, fadeOut, end], [0.92, 1, 1, 0.92]);
  const blur = useTransform(progress, [start, fadeIn, fadeOut, end], [8, 0, 0, 8]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);

  const Icon = data.icon;

  return (
    <motion.div
      style={{ opacity, y, scale, filter }}
      className="absolute inset-0 flex items-center justify-center px-4"
    >
      {/* Backdrop for readability — subtle dark gradient behind text */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at center, rgba(0,0,0,0.5) 0%, transparent 70%)' }}
      />
      <div className="relative max-w-2xl text-center">
        {/* Number + Icon */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span
            className="text-7xl sm:text-8xl font-extrabold leading-none opacity-30"
            style={{ fontFamily: 'var(--font-jakarta)', color: data.color, textShadow: `0 0 40px ${data.color}80` }}
          >
            {data.num}
          </span>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${data.color}, ${data.color}99)`, boxShadow: `0 20px 50px -20px ${data.color}` }}
          >
            <Icon className="w-7 h-7 text-white" strokeWidth={2.4} />
          </div>
        </div>

        {/* Title — with text shadow for readability over 3D */}
        <h3
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-5"
          style={{ fontFamily: 'var(--font-jakarta)', textShadow: '0 2px 20px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.5)' }}
        >
          {data.title}
        </h3>

        {/* Body — brighter + text shadow for readability */}
        <p
          className="text-lg sm:text-xl text-white leading-relaxed max-w-xl mx-auto"
          style={{ textShadow: '0 1px 12px rgba(0,0,0,0.8)' }}
        >
          {data.body}
        </p>
      </div>
    </motion.div>
  );
}

/* ---------- Main Oryzo Section ---------- */
const TEXT_BLOCKS: TextBlockData[] = [
  {
    num: '01',
    title: 'Curiosity',
    body: 'You start with a question. Why does ChatGPT work? How does a self-driving car see? We meet you there — at the edge of wonder.',
    icon: Brain,
    color: '#2563EB',
  },
  {
    num: '02',
    title: 'Foundations',
    body: 'No copy-paste tutorials. We build the mental models — systems thinking, problem decomposition, abstraction. The thinking behind the typing.',
    icon: Hammer,
    color: '#7C3AED',
  },
  {
    num: '03',
    title: 'Build',
    body: 'Real projects. Real feedback. Real failures. You ship 3 portfolio artifacts you can show employers, clients, and yourself.',
    icon: Rocket,
    color: '#16A34A',
  },
  {
    num: '04',
    title: 'Belong',
    body: 'You join 5,000+ builders across 65 countries. You don\'t just learn — you become part of a movement that\'s shaping the future.',
    icon: Users,
    color: '#F59E0B',
  },
];

export default function OryzoSection({ id = 'oryzo' }: { id?: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // SMOOTH INERTIA — the key to the premium "glide" feel
  // This is equivalent to GSAP's scrub: 1 (1-second dampening)
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 25,
    restDelta: 0.001,
  });

  // Sync to ref for the 3D scene (no React re-renders)
  const progressRef = useRef(0);
  useMotionValueEvent(smoothProgress, 'change', (v) => {
    progressRef.current = v;
  });

  // Progress indicator dots (rendered via ProgressDot component below)
  // dotScales moved to ProgressDot component to respect hooks rules

  return (
    <section
      id={id}
      ref={sectionRef}
      data-chapter="oryzo"
      data-chapter-label="Journey"
      className="relative bg-slate-950"
      style={{ height: '500vh' }}
    >
      {/* Sticky stage that holds the 3D canvas + pinned text */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/50 to-violet-950/50" />
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(37, 99, 235, 0.4) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(124, 58, 237, 0.4) 0%, transparent 50%)'
          }} />
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)'
          }} />
        </div>

        {/* 3D Canvas — fixed behind text, camera orbits with scroll */}
        <div className="absolute inset-0">
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [0, 0, 5.5], fov: 55 }}
            gl={{ antialias: true, alpha: true, depth: false, powerPreference: 'high-performance' }}
            style={{ background: 'transparent' }}
            performance={{ min: 0.5 }}
          >
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 5, 5]} intensity={1.2} />
            <directionalLight position={[-5, -3, -5]} intensity={0.4} color="#7C3AED" />
            <Suspense fallback={null}>
              <CameraRig scrollProgress={progressRef} />
              <AICore scrollProgress={progressRef} />
              <Sparkles count={40} scale={10} size={2} speed={0.3} opacity={0.5} color="#2563EB" />
              <Sparkles count={20} scale={8} size={3} speed={0.2} opacity={0.3} color="#7C3AED" />
              <Environment preset="city" />
            </Suspense>
          </Canvas>
        </div>

        {/* Pinned Text Blocks — cross-fade in sync with camera */}
        {TEXT_BLOCKS.map((block, i) => (
          <PinnedTextBlock
            key={i}
            data={block}
            index={i}
            count={TEXT_BLOCKS.length}
            progress={smoothProgress}
          />
        ))}

        {/* Top label */}
        <div className="absolute top-28 left-1/2 -translate-x-1/2 text-center z-10 pointer-events-none">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
            — The Sariro Journey —
          </span>
        </div>

        {/* Bottom progress dots */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
          {TEXT_BLOCKS.map((_, i) => (
            <ProgressDot key={i} index={i} count={TEXT_BLOCKS.length} progress={smoothProgress} />
          ))}
        </div>

        {/* Scroll hint (only at start) */}
        <motion.div
          style={{ opacity: useTransform(smoothProgress, [0, 0.05], [1, 0]) }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center z-10 pointer-events-none"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-2" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Keep scrolling
          </p>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-8 rounded-full border-2 border-slate-500 flex justify-center p-1 mx-auto"
          >
            <div className="w-1 h-2 rounded-full bg-slate-400" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- ProgressDot — extracted to respect hooks rules ---------- */
function ProgressDot({
  index,
  count,
  progress,
}: {
  index: number;
  count: number;
  progress: MotionValue<number>;
}) {
  const start = index / count;
  const end = (index + 1) / count;
  const mid = (start + end) / 2;
  const scale = useTransform(progress, [start, mid, end], [0.5, 1, 0.5]);
  const opacity = useTransform(progress, [start, mid, end], [0.4, 1, 0.4]);

  return (
    <motion.div
      style={{ scale, opacity }}
      className="w-2 h-2 rounded-full bg-white"
    />
  );
}
