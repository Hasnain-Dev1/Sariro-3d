'use client';

import { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sparkles, Environment } from '@react-three/drei';
import * as THREE from 'three';

/* ===============================================================
   SHARED CHAPTER STATE — module-level, zero React re-renders.
   Both persistent 3D elements read from this in their useFrame loops.
   The IntersectionObserver updates `targetColor` when the active
   chapter changes; the 3D scenes lerp toward it smoothly.
=============================================================== */

const CHAPTER_COLORS: Record<string, string> = {
  hero: '#2563EB',
  tracks: '#2563EB',
  journey: '#7C3AED',
  stats: '#16A34A',
  courses: '#2563EB',
  philosophy: '#F59E0B',
  events: '#7C3AED',
  testimonials: '#06B6D4',
  pricing: '#2563EB',
  start: '#16A34A',
  footer: '#64748B',
};

const shared = {
  activeChapter: 'hero',
  scrollProgress: 0,
  targetColor: new THREE.Color(CHAPTER_COLORS.hero),
  currentColor: new THREE.Color(CHAPTER_COLORS.hero),
  targetEmissive: new THREE.Color(CHAPTER_COLORS.hero),
  currentEmissive: new THREE.Color(CHAPTER_COLORS.hero),
};

let observerSetup = false;

function setupObserver() {
  if (observerSetup || typeof window === 'undefined') return;
  observerSetup = true;

  // Scroll progress → shared.scrollProgress
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    shared.scrollProgress = max > 0 ? window.scrollY / max : 0;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Chapter observer → shared.targetColor
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) {
        const id = visible[0].target.getAttribute('data-chapter') || 'hero';
        shared.activeChapter = id;
        const hex = CHAPTER_COLORS[id] || '#2563EB';
        shared.targetColor.set(hex);
        shared.targetEmissive.set(hex);
      }
    },
    { rootMargin: '-30% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
  );

  // Wait for DOM to be ready, then observe all chapters
  const tryObserve = () => {
    const els = document.querySelectorAll('[data-chapter]');
    els.forEach((el) => observer.observe(el));
    if (els.length === 0) setTimeout(tryObserve, 200);
  };
  tryObserve();
}

export function getActiveChapter() {
  return shared.activeChapter;
}

/* ===============================================================
   COMPANION ORB — persistent 3D element that follows the entire
   scroll journey. Fixed in the bottom-left corner.
   - Distorted sphere that rotates continuously
   - Color lerps to match the active chapter
   - Emissive pulses gently
   - Glow ring rotates around it
   - Click → smooth scroll to top
   - Shows chapter label on hover
=============================================================== */

function Orb({ scrollProgressRef }: { scrollProgressRef: React.MutableRefObject<number> }) {
  const orbRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state, delta) => {
    // Smoothly lerp current color toward target
    shared.currentColor.lerp(shared.targetColor, delta * 2.5);
    shared.currentEmissive.lerp(shared.targetEmissive, delta * 2.5);

    if (matRef.current) {
      matRef.current.color.copy(shared.currentColor);
      matRef.current.emissive.copy(shared.currentEmissive);
    }

    // Orb rotates continuously, speed influenced by scroll progress
    if (orbRef.current) {
      const p = scrollProgressRef.current;
      orbRef.current.rotation.y += delta * (0.3 + p * 0.4);
      orbRef.current.rotation.x += delta * 0.15;
      // Subtle scale pulse
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.04;
      orbRef.current.scale.setScalar(pulse);
    }

    // Rings rotate in opposite directions
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.5;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * 0.3;
      ring2Ref.current.rotation.x = Math.PI / 3;
    }
  });

  return (
    <group>
      {/* Main orb */}
      <mesh ref={orbRef}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial
          ref={matRef as any}
          color={shared.currentColor}
          emissive={shared.currentEmissive}
          emissiveIntensity={0.35}
          speed={2}
          distort={0.35}
          roughness={0.15}
          metalness={0.7}
        />
      </mesh>

      {/* Glow ring 1 — horizontal */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.03, 8, 64]} />
        <meshBasicMaterial color={shared.currentColor} transparent opacity={0.4} />
      </mesh>

      {/* Glow ring 2 — tilted */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[1.8, 0.02, 8, 64]} />
        <meshBasicMaterial color={shared.currentColor} transparent opacity={0.25} />
      </mesh>

      {/* Inner glow point */}
      <pointLight color={shared.currentColor} intensity={2} distance={4} />
    </group>
  );
}

export function CompanionOrb3D() {
  const scrollProgressRef = useRef(0);
  const [hovered, setHovered] = useState(false);
  const [chapterLabel, setChapterLabel] = useState('Home');
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRingRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    setupObserver();

    const t = setTimeout(() => setVisible(true), 1800);

    const labelMap: Record<string, string> = {
      hero: 'Home',
      tracks: 'Tracks',
      journey: 'Journey',
      stats: 'Impact',
      courses: 'Courses',
      philosophy: 'Mimo',
      events: 'Events',
      testimonials: 'Voices',
      pricing: 'Pricing',
      start: 'Start',
      footer: 'Contact',
    };
    const interval = setInterval(() => {
      setChapterLabel(labelMap[shared.activeChapter] || 'Home');
      scrollProgressRef.current = shared.scrollProgress;
      setProgress(shared.scrollProgress);
    }, 100);

    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, []);

  // Progress ring geometry
  const ringRadius = 38;
  const ringCircumference = 2 * Math.PI * ringRadius;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className="fixed bottom-5 left-5 sm:bottom-7 sm:left-7 z-50 transition-opacity duration-700"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }}
    >
      {/* Hover label */}
      <div
        className="absolute bottom-full left-0 mb-2 px-3 py-1.5 rounded-lg glass-panel text-[11px] font-bold text-slate-700 whitespace-nowrap pointer-events-none transition-all duration-200"
        style={{
          fontFamily: 'var(--font-grotesk)',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(0)' : 'translateY(4px)',
        }}
      >
        {chapterLabel} · Back to top
      </div>

      {/* Click target */}
      <button
        onClick={scrollToTop}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="block cursor-pointer relative"
        aria-label="Scroll back to top"
        style={{ width: 90, height: 90 }}
      >
        {/* Progress ring (SVG) — fills as you scroll */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width="90"
          height="90"
          viewBox="0 0 90 90"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Track */}
          <circle
            cx="45"
            cy="45"
            r={ringRadius}
            fill="none"
            stroke="rgba(148, 163, 184, 0.2)"
            strokeWidth="2"
          />
          {/* Progress */}
          <circle
            ref={progressRingRef}
            cx="45"
            cy="45"
            r={ringRadius}
            fill="none"
            stroke="url(#orbProgressGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={ringCircumference}
            strokeDashoffset={ringCircumference * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 0.15s ease-out' }}
          />
          <defs>
            <linearGradient id="orbProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="50%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#16A34A" />
            </linearGradient>
          </defs>
        </svg>

        {/* 3D Canvas — centered inside the ring */}
        <div className="absolute inset-[9px]">
          <Canvas
            dpr={[1, 2]}
            camera={{ position: [0, 0, 4], fov: 50 }}
            gl={{ antialias: true, alpha: true, depth: false }}
            style={{ width: '100%', height: '100%', background: 'transparent' }}
            performance={{ min: 0.5 }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[3, 3, 3]} intensity={1.2} />
            <directionalLight position={[-3, -2, -3]} intensity={0.4} color="#7C3AED" />
            <Suspense fallback={null}>
              <Orb scrollProgressRef={scrollProgressRef} />
              <Environment preset="city" />
            </Suspense>
          </Canvas>
        </div>

        {/* CSS glow halo behind the orb */}
        <div
          className="absolute inset-0 rounded-full blur-xl pointer-events-none transition-opacity duration-300"
          style={{
            background: 'radial-gradient(circle, rgba(37,99,235,0.35), transparent 70%)',
            opacity: hovered ? 0.8 : 0.4,
            transform: 'scale(1.5)',
          }}
        />
      </button>
    </div>
  );
}

/* ===============================================================
   BACKGROUND PARTICLES 3D — fixed full-viewport Canvas behind
   all content. A large slowly-rotating wireframe shape + drifting
   sparkles. Creates 3D depth that's visible through darker sections
   and adds atmosphere everywhere.
   - pointer-events: none (doesn't block interaction)
   - Very low opacity (subtle)
   - Color matches active chapter
=============================================================== */

function BackgroundShape({ scrollProgressRef }: { scrollProgressRef: React.MutableRefObject<number> }) {
  const knotRef = useRef<THREE.Mesh>(null);
  const knot2Ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const mat2Ref = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state, delta) => {
    const p = scrollProgressRef.current;

    // Lerp colors
    shared.currentColor.lerp(shared.targetColor, delta * 1.5);

    if (matRef.current) {
      matRef.current.color.copy(shared.currentColor);
    }
    if (mat2Ref.current) {
      mat2Ref.current.color.copy(shared.currentColor);
    }

    // Large wireframe knot — rotates slowly, position drifts with scroll
    if (knotRef.current) {
      knotRef.current.rotation.x += delta * 0.05;
      knotRef.current.rotation.y += delta * 0.08;
      knotRef.current.position.x = 3.5 + Math.sin(p * Math.PI * 2) * 0.5;
      knotRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
    }
    // Smaller knot on the other side
    if (knot2Ref.current) {
      knot2Ref.current.rotation.x -= delta * 0.07;
      knot2Ref.current.rotation.z += delta * 0.05;
      knot2Ref.current.position.x = -4 + Math.cos(p * Math.PI * 2) * 0.5;
      knot2Ref.current.position.y = -Math.sin(state.clock.elapsedTime * 0.25) * 0.4;
    }
  });

  return (
    <group>
      {/* Large wireframe torus knot — right side */}
      <mesh ref={knotRef} position={[3.5, 0, -2]}>
        <torusKnotGeometry args={[1.2, 0.4, 80, 12]} />
        <meshBasicMaterial
          ref={matRef as any}
          color={shared.currentColor}
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Smaller wireframe icosahedron — left side */}
      <mesh ref={knot2Ref} position={[-4, 0, -3]}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshBasicMaterial
          ref={mat2Ref as any}
          color={shared.currentColor}
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>
    </group>
  );
}

export function BackgroundParticles3D() {
  const scrollProgressRef = useRef(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setupObserver();
    const t = setTimeout(() => setMounted(true), 100);
    const interval = setInterval(() => {
      scrollProgressRef.current = shared.scrollProgress;
    }, 100);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true, depth: false, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
        performance={{ min: 0.4 }}
      >
        <ambientLight intensity={0.4} />
        <BackgroundShape scrollProgressRef={scrollProgressRef} />

        {/* Drifting sparkles — two layers for depth */}
        <Sparkles
          count={40}
          scale={14}
          size={2.5}
          speed={0.3}
          opacity={0.5}
          color="#2563EB"
        />
        <Sparkles
          count={25}
          scale={10}
          size={4}
          speed={0.2}
          opacity={0.3}
          color="#7C3AED"
        />
      </Canvas>
    </div>
  );
}
