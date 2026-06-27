'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Environment, Float, MeshDistortMaterial } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useCallback, useEffect, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Brain, Hammer, Rocket, Users, ChevronLeft, ChevronRight } from 'lucide-react';

/* ===============================================================
   ORYZO-STYLE SECTION — Arrow + Swipe driven (no scroll pin)
   - 3D AI Core with camera orbit driven by active chapter
   - 4 text chapters that cross-fade on arrow click / swipe
   - Arrows on desktop, swipe on mobile
   - Progress dots clickable
   - Auto-advance every 5s (pauses on interaction)
=============================================================== */

type Phase = 0 | 1 | 2 | 3;

/* ---------- 3D AI Core ---------- */
function AICore({ activePhase }: { activePhase: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const knotRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const nodesRef = useRef<THREE.Group>(null);
  const targetRotation = useRef(0);

  // Target rotation based on active phase (0°, 90°, 180°, 270°)
  useEffect(() => {
    targetRotation.current = (activePhase / 4) * Math.PI * 2;
  }, [activePhase]);

  const nodePositions = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 2.5;
      arr.push([Math.cos(angle) * r, Math.sin(angle * 2) * 0.5, Math.sin(angle) * r]);
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    const p = activePhase / 3; // 0..1

    // Smoothly lerp group rotation toward target
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation.current,
        delta * 2.5
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        p * 0.2,
        delta * 2
      );
    }

    // Inner core breathes
    if (innerRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.06;
      innerRef.current.scale.setScalar(pulse);
    }

    // Wireframe shell rotates opposite
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

    // Node cluster slow rotation
    if (nodesRef.current) {
      nodesRef.current.rotation.y += delta * 0.4;
      nodesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Inner glowing core */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[0.8, 4]} />
        <MeshDistortMaterial color="#2563EB" speed={2} distort={0.3} roughness={0.1} metalness={0.8} emissive="#2563EB" emissiveIntensity={0.4} />
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

      {/* Fixed lights (object rotates through them) */}
      <pointLight color="#2563EB" intensity={3} distance={6} />
      <pointLight position={[3, 2, 3]} color="#7C3AED" intensity={1.5} distance={8} />
      <pointLight position={[-3, -2, -3]} color="#16A34A" intensity={1} distance={8} />
    </group>
  );
}

/* ---------- Camera Rig — orbits based on active phase ---------- */
function CameraRig({ activePhase }: { activePhase: number }) {
  const targetAngle = useRef(0);
  const targetRadius = useRef(5.5);
  const targetY = useRef(0);

  useEffect(() => {
    targetAngle.current = (activePhase / 4) * Math.PI * 2;
    targetRadius.current = 5.5 - (activePhase / 3) * 1.5;
    targetY.current = (activePhase / 3) * 1;
  }, [activePhase]);

  useFrame((state, delta) => {
    const cam = state.camera;
    const camPos = cam.position;

    // Smoothly lerp camera toward target
    const targetX = Math.sin(targetAngle.current) * targetRadius.current;
    const targetZ = Math.cos(targetAngle.current) * targetRadius.current;

    camPos.x = THREE.MathUtils.lerp(camPos.x, targetX, delta * 2);
    camPos.y = THREE.MathUtils.lerp(camPos.y, targetY.current, delta * 2);
    camPos.z = THREE.MathUtils.lerp(camPos.z, targetZ, delta * 2);
    cam.lookAt(0, 0, 0);
  });

  return null;
}

/* ---------- Text Block Data ---------- */
const TEXT_BLOCKS = [
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

/* ---------- Main Component ---------- */
export default function OryzoSection({ id = 'oryzo' }: { id?: string }) {
  const [activePhase, setActivePhase] = useState<Phase>(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const touchStartX = useRef(0);

  const next = useCallback(() => {
    setActivePhase((p) => ((p + 1) % 4) as Phase);
    setAutoPlay(false);
  }, []);

  const prev = useCallback(() => {
    setActivePhase((p) => ((p - 1 + 4) % 4) as Phase);
    setAutoPlay(false);
  }, []);

  const goTo = useCallback((i: number) => {
    setActivePhase(i as Phase);
    setAutoPlay(false);
  }, []);

  // Auto-advance every 5s
  useEffect(() => {
    if (!autoPlay) return;
    const id = setTimeout(() => {
      setActivePhase((p) => ((p + 1) % 4) as Phase);
    }, 5000);
    return () => clearTimeout(id);
  }, [autoPlay, activePhase]);

  // Touch/swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx > 0) prev();
      else next();
    }
  };

  const currentBlock = TEXT_BLOCKS[activePhase];
  const Icon = currentBlock.icon;

  return (
    <section
      id={id}
      data-chapter="oryzo"
      data-chapter-label="Journey"
      className="relative bg-slate-950 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
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

      {/* 3D Canvas — camera orbits based on activePhase, NOT scroll */}
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
            <CameraRig activePhase={activePhase} />
            <AICore activePhase={activePhase} />
            <Sparkles count={40} scale={10} size={2} speed={0.3} opacity={0.5} color="#2563EB" />
            <Sparkles count={20} scale={8} size={3} speed={0.2} opacity={0.3} color="#7C3AED" />
            <Environment preset="city" />
          </Suspense>
        </Canvas>
      </div>

      {/* Content overlay — text + navigation */}
      <div className="relative min-h-[100svh] flex flex-col items-center justify-center px-5 py-20 sm:py-24">
        {/* Top label */}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 text-center z-10 pointer-events-none">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
            — The Sariro Journey —
          </span>
        </div>

        {/* Text block — cross-fades on phase change */}
        <div className="relative z-10 max-w-2xl text-center min-h-[300px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePhase}
              initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -30, filter: 'blur(8px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-xl"
            >
              {/* Backdrop for readability */}
              <div className="absolute inset-0 -z-10 rounded-full blur-3xl opacity-50" style={{ background: `radial-gradient(ellipse 60% 50% at center, ${currentBlock.color}30, transparent 70%)` }} />

              {/* Number + Icon */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <span
                  className="text-6xl sm:text-7xl font-extrabold leading-none opacity-30"
                  style={{ fontFamily: 'var(--font-jakarta)', color: currentBlock.color, textShadow: `0 0 40px ${currentBlock.color}80` }}
                >
                  {currentBlock.num}
                </span>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
                  style={{ background: `linear-gradient(135deg, ${currentBlock.color}, ${currentBlock.color}99)`, boxShadow: `0 20px 50px -20px ${currentBlock.color}` }}
                >
                  <Icon className="w-7 h-7 text-white" strokeWidth={2.4} />
                </div>
              </div>

              {/* Title */}
              <h3
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-5"
                style={{ fontFamily: 'var(--font-jakarta)', textShadow: '0 2px 20px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.5)' }}
              >
                {currentBlock.title}
              </h3>

              {/* Body */}
              <p
                className="text-lg sm:text-xl text-white leading-relaxed"
                style={{ textShadow: '0 1px 12px rgba(0,0,0,0.8)' }}
              >
                {currentBlock.body}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation — arrows (desktop) + dots (all) */}
        <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-4 z-20">
          {/* Left arrow */}
          <button
            onClick={prev}
            className="w-12 h-12 rounded-full glass-dark border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-90 transition-transform"
            aria-label="Previous chapter"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Progress dots — clickable */}
          <div className="flex items-center gap-2">
            {TEXT_BLOCKS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 cursor-pointer ${
                  i === activePhase
                    ? 'w-8 h-2.5 bg-white'
                    : 'w-2.5 h-2.5 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to chapter ${i + 1}`}
              />
            ))}
          </div>

          {/* Right arrow */}
          <button
            onClick={next}
            className="w-12 h-12 rounded-full glass-dark border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-90 transition-transform"
            aria-label="Next chapter"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Swipe hint (mobile only) */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 sm:hidden z-10 pointer-events-none">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
            ← Swipe →
          </p>
        </div>
      </div>
    </section>
  );
}
