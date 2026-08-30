'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { GraduationCap, Volume2, VolumeX } from 'lucide-react';

/* ===============================================================
   CINEMATIC INTRO — 6-phase neural burst + typing logo + magical sound
   - Phase 1 (field):    particles drift in space
   - Phase 2 (network):  particles form a neural-network sphere
   - Phase 3 (collapse): network collapses to center
   - Phase 4 (logo):     burst flash + logo icon appears
   - Phase 5 (type):     SARIRO wordmark types in letter-by-letter
   - Phase 6 (done):     fade out

   BEHAVIOR:
   - Plays on FULL page reload (module-level flag resets when JS re-evaluates)
   - Does NOT play on client-side route navigation (flag persists in same JS context)
   - Skip button at top-right
   - Mute/unmute toggle next to Skip
   - Magical sound via Web Audio API (no external files needed)
=============================================================== */

// Module-level flag — persists across route nav, resets on full reload
let hasPlayedInThisSession = false;

type Phase = 'field' | 'network' | 'collapse' | 'logo' | 'type' | 'done';

function seededValue(i: number, min: number, max: number): number {
  const x = Math.sin(i * 9999 + 1234) * 10000;
  const frac = x - Math.floor(x);
  return min + frac * (max - min);
}

/* ============ MAGICAL SOUND (Web Audio API) ============ */
let sharedAudioCtx: AudioContext | null = null;
// Flag: sound was queued but couldn't play (AudioContext suspended at intro start).
// Will be replayed on the first user gesture when the context can resume.
let soundQueuedForGesture = false;
// Flag: sound has played (or is currently playing) in this intro session — prevents double-play
let soundHasPlayed = false;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (sharedAudioCtx && sharedAudioCtx.state !== 'closed') return sharedAudioCtx;
  const Ctor = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
    || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    sharedAudioCtx = new Ctor();
  } catch {
    return null;
  }
  return sharedAudioCtx;
}

function playMagicalSound(muted: boolean, force: boolean = false) {
  if (muted) return;
  if (soundHasPlayed) return; // don't double-play
  const ctx = getAudioCtx();
  if (!ctx) return;

  // Browser autoplay policy: if context is suspended and we're not being forced
  // by a user gesture, queue the sound for later. The intro's gesture listener
  // will pick it up on the first click/tap/keypress and replay it.
  if (ctx.state === 'suspended' && !force) {
    soundQueuedForGesture = true;
    return;
  }

  // Try to resume (works if force=true OR there was a prior gesture in this tab session)
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {
      /* still try to schedule — some browsers will play once resumed */
    });
  }

  soundQueuedForGesture = false;
  soundHasPlayed = true;

  const now = ctx.currentTime;

  // Master gain + reverb-ish delay chain
  const master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(ctx.destination);

  const delay = ctx.createDelay();
  delay.delayTime.value = 0.18;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.35;
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(master);

  // 1. Ascending magical chime (C5, E5, G5, C6) — plays during particle field phase
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const start = now + i * 0.15;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.16, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 1.8);

    osc.connect(gain);
    gain.connect(master);
    gain.connect(delay);

    osc.start(start);
    osc.stop(start + 2);
  });

  // 2. Low drone for depth — underpins the whole intro
  const drone = ctx.createOscillator();
  drone.type = 'sine';
  drone.frequency.value = 130.81; // C3
  const droneGain = ctx.createGain();
  droneGain.gain.setValueAtTime(0, now);
  droneGain.gain.linearRampToValueAtTime(0.07, now + 0.4);
  droneGain.gain.linearRampToValueAtTime(0, now + 4);
  drone.connect(droneGain);
  droneGain.connect(master);
  drone.start(now);
  drone.stop(now + 4.2);

  // 3. High sparkle when network forms (~1.2s)
  const sparkle = ctx.createOscillator();
  sparkle.type = 'triangle';
  sparkle.frequency.setValueAtTime(2000, now + 1.2);
  sparkle.frequency.exponentialRampToValueAtTime(4000, now + 1.5);
  const sparkleGain = ctx.createGain();
  sparkleGain.gain.setValueAtTime(0, now + 1.2);
  sparkleGain.gain.linearRampToValueAtTime(0.05, now + 1.25);
  sparkleGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
  sparkle.connect(sparkleGain);
  sparkleGain.connect(master);
  sparkle.start(now + 1.2);
  sparkle.stop(now + 1.7);

  // 4. Whoosh on logo burst (~3.1s)
  const whoosh = ctx.createOscillator();
  whoosh.type = 'sawtooth';
  whoosh.frequency.setValueAtTime(180, now + 3.1);
  whoosh.frequency.exponentialRampToValueAtTime(60, now + 3.6);
  const whooshFilter = ctx.createBiquadFilter();
  whooshFilter.type = 'lowpass';
  whooshFilter.frequency.value = 600;
  const whooshGain = ctx.createGain();
  whooshGain.gain.setValueAtTime(0, now + 3.1);
  whooshGain.gain.linearRampToValueAtTime(0.1, now + 3.2);
  whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 3.6);
  whoosh.connect(whooshFilter);
  whooshFilter.connect(whooshGain);
  whooshGain.connect(master);
  whoosh.start(now + 3.1);
  whoosh.stop(now + 3.7);

  // 5. Final chime when wordmark completes (~3.4s)
  const finalChime = ctx.createOscillator();
  finalChime.type = 'sine';
  finalChime.frequency.value = 1046.5; // C6
  const finalGain = ctx.createGain();
  finalGain.gain.setValueAtTime(0, now + 3.4);
  finalGain.gain.linearRampToValueAtTime(0.14, now + 3.45);
  finalGain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);
  finalChime.connect(finalGain);
  finalGain.connect(master);
  finalGain.connect(delay);
  finalChime.start(now + 3.4);
  finalChime.stop(now + 4.6);
}

/* ============ 3D PARTICLE FIELD (neural network) ============ */
function ParticleField({ phase, isMobile }: { phase: Phase; isMobile: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const particleCount = isMobile ? 80 : 200;
  const nodeCount = isMobile ? 12 : 20;

  const { startPositions, networkPositions, edges } = useMemo(() => {
    const starts: [number, number, number][] = [];
    for (let i = 0; i < particleCount; i++) {
      starts.push([
        seededValue(i, -1, 1) * 8,
        seededValue(i + 1000, -1, 1) * 8,
        seededValue(i + 2000, -1, 1) * 8,
      ]);
    }
    const network: [number, number, number][] = [];
    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / nodeCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 2;
      network.push([
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ]);
    }
    const edgeList: [number, number][] = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dx = network[i][0] - network[j][0];
        const dy = network[i][1] - network[j][1];
        const dz = network[i][2] - network[j][2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 2.5) edgeList.push([i, j]);
      }
    }
    return { startPositions: starts, networkPositions: network, edges: edgeList };
  }, [particleCount, nodeCount]);

  const particleRefs = useRef<THREE.Mesh[]>([]);
  const nodeRefs = useRef<THREE.Mesh[]>([]);
  const lineRef = useRef<THREE.LineSegments>(null);
  const pulseRefs = useRef<THREE.Mesh[]>([]);
  const burstRef = useRef<THREE.Mesh>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        mouseRef.current.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const cam = state.camera;
    const camPos = cam.position;
    // On mobile, the 3D group is offset DOWNWARD so the neural network
    // renders in the BOTTOM portion of the screen (below the SARIRO text at top).
    // The camera stays at its normal position looking at the origin — it does
    // NOT follow the group down. This way the group appears below center.
    const groupY = isMobile ? -2.2 : 0;
    if (phase === 'field') {
      camPos.z = THREE.MathUtils.lerp(camPos.z, 3, delta * 0.5);
      camPos.x = THREE.MathUtils.lerp(camPos.x, mouseRef.current.x * 0.5, delta * 2);
      // Camera Y stays near 0 (slight mouse parallax) — does NOT follow group
      camPos.y = THREE.MathUtils.lerp(camPos.y, mouseRef.current.y * 0.3, delta * 2);
    } else if (phase === 'network') {
      camPos.z = THREE.MathUtils.lerp(camPos.z, 5, delta * 0.8);
      // Camera slightly above center, looking down — pushes group further into bottom
      camPos.y = THREE.MathUtils.lerp(camPos.y, isMobile ? 0.8 : 0.5, delta * 0.5);
      camPos.x = Math.sin(t * 0.2) * 0.8;
    } else if (phase === 'collapse' || phase === 'logo' || phase === 'type') {
      camPos.z = THREE.MathUtils.lerp(camPos.z, 4, delta * 1);
      camPos.x = THREE.MathUtils.lerp(camPos.x, 0, delta * 2);
      camPos.y = THREE.MathUtils.lerp(camPos.y, isMobile ? 0.5 : 0, delta * 2);
    }
    // Camera always looks at the origin (0,0,0) — NOT at the group
    cam.lookAt(0, 0, 0);

    if (groupRef.current) {
      // Keep the group offset downward on mobile
      groupRef.current.position.y = groupY;
      if (phase === 'network') {
        groupRef.current.rotation.y += delta * 0.15;
        groupRef.current.rotation.x = Math.sin(t * 0.3) * 0.1;
      }
    }

    // Particles
    particleRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const target = networkPositions[i % nodeCount];
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (phase === 'field') {
        mesh.position.x = THREE.MathUtils.lerp(mesh.position.x, startPositions[i][0], delta * 0.5);
        mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, startPositions[i][1], delta * 0.5);
        mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, startPositions[i][2], delta * 0.5);
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.8, delta * 2);
      } else if (phase === 'network') {
        mesh.position.x = THREE.MathUtils.lerp(mesh.position.x, target[0], delta * 1.5);
        mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, target[1], delta * 1.5);
        mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, target[2], delta * 1.5);
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.6, delta * 2);
      } else if (phase === 'collapse') {
        mesh.position.x = THREE.MathUtils.lerp(mesh.position.x, 0, delta * 3);
        mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, 0, delta * 3);
        mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, 0, delta * 3);
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, delta * 3);
      } else {
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, delta * 3);
      }
    });

    // Network nodes
    nodeRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (phase === 'network') {
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 1, delta * 2);
        const pulse = 1 + Math.sin(t * 2 + i * 0.3) * 0.2;
        mesh.scale.setScalar(pulse);
        mat.emissiveIntensity = 0.5 + Math.sin(t * 2 + i * 0.3) * 0.3;
      } else if (phase === 'collapse') {
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, delta * 3);
      } else {
        mat.opacity = 0;
      }
    });

    // Network edges (lines)
    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial;
      if (phase === 'network') {
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.5, delta * 2);
      } else {
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, delta * 3);
      }
    }

    // Pulse particles traveling along edges
    pulseRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (phase === 'network' && edges.length > 0) {
        const edge = edges[i % edges.length];
        if (edge) {
          const progress = (t * 0.5 + i * 0.15) % 1;
          const a = networkPositions[edge[0]];
          const b = networkPositions[edge[1]];
          mesh.position.set(
            a[0] + (b[0] - a[0]) * progress,
            a[1] + (b[1] - a[1]) * progress,
            a[2] + (b[2] - a[2]) * progress,
          );
          mat.opacity = Math.sin(progress * Math.PI);
        }
      } else {
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, delta * 3);
      }
    });

    // Burst sphere (logo phase)
    if (burstRef.current) {
      const mat = burstRef.current.material as THREE.MeshBasicMaterial;
      if (phase === 'logo') {
        burstRef.current.scale.setScalar(THREE.MathUtils.lerp(burstRef.current.scale.x, 8, delta * 4));
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, delta * 2);
      } else {
        mat.opacity = 0;
        burstRef.current.scale.setScalar(0.1);
      }
    }
  });

  const lineGeometry = useMemo(() => {
    const positions: number[] = [];
    edges.forEach(([from, to]) => {
      const a = networkPositions[from];
      const b = networkPositions[to];
      positions.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [edges, networkPositions]);

  const colors = ['#2563EB', '#7C3AED', '#FFFFFF'];

  return (
    <group ref={groupRef}>
      {/* Drifting particles */}
      {Array.from({ length: particleCount }).map((_, i) => (
        <mesh
          key={`p-${i}`}
          ref={(el) => { if (el) particleRefs.current[i] = el; }}
          position={startPositions[i]}
        >
          <sphereGeometry args={[0.05 + seededValue(i + 500, 0, 0.04), 8, 8]} />
          <meshBasicMaterial color={colors[i % colors.length]} transparent opacity={0} />
        </mesh>
      ))}

      {/* Network nodes */}
      {networkPositions.map((pos, i) => (
        <mesh
          key={`n-${i}`}
          ref={(el) => { if (el) nodeRefs.current[i] = el; }}
          position={pos}
        >
          <sphereGeometry args={[0.15, 24, 24]} />
          <meshStandardMaterial
            color={colors[i % colors.length]}
            emissive={colors[i % colors.length]}
            emissiveIntensity={0.6}
            transparent
            opacity={0}
            metalness={0.8}
            roughness={0.15}
          />
        </mesh>
      ))}

      {/* Network edges */}
      <lineSegments ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial color="#2563EB" transparent opacity={0} />
      </lineSegments>

      {/* Pulse particles traveling along edges */}
      {edges.slice(0, isMobile ? 5 : 10).map((_, i) => (
        <mesh
          key={`pulse-${i}`}
          ref={(el) => { if (el) pulseRefs.current[i] = el; }}
        >
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0} />
        </mesh>
      ))}

      {/* Burst sphere (logo phase) */}
      <mesh ref={burstRef} scale={0.1}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0} />
      </mesh>

      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} color="#FFFFFF" />
      <pointLight position={[0, 0, 4]} color="#2563EB" intensity={3} distance={12} />
      <pointLight position={[-4, 2, 2]} color="#7C3AED" intensity={1.5} distance={10} />
      <pointLight position={[4, -2, -2]} color="#2563EB" intensity={1} distance={10} />
    </group>
  );
}

/* ============ TYPING LOGO (HTML overlay) ============ */
function TypingLogo({ visible, isMobile }: { visible: boolean; isMobile: boolean }) {
  const letters = 'SARIRO'.split('');
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 ${isMobile ? '!justify-start !pt-[12vh]' : ''}`}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: visible ? 1 : 0, opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-6"
      >
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 rounded-2xl blur-2xl"
          style={{ background: 'radial-gradient(circle, #2563EB, transparent 70%)' }}
        />
        <div
          className={`relative ${isMobile ? 'w-16 h-16' : 'w-24 h-24'} rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-2xl`}
        >
          <GraduationCap className={isMobile ? 'w-8 h-8' : 'w-12 h-12'} color="white" strokeWidth={2.5} />
        </div>
      </motion.div>

      {/* Letter row — needs perspective on parent for the 3D rotateX typing animation to render correctly */}
      <div
        className={`flex ${isMobile ? 'gap-1' : 'gap-2'} mb-3`}
        style={{ perspective: '600px' }}
      >
        {letters.map((letter, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 20, rotateX: -90 }}
            animate={visible ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 20, rotateX: -90 }}
            transition={{ duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className={`inline-block font-extrabold text-white tracking-tight ${isMobile ? 'text-3xl' : 'text-6xl'}`}
            style={{
              fontFamily: 'var(--font-jakarta)',
              textShadow: '0 0 20px rgba(37, 99, 235, 0.8), 0 0 40px rgba(124, 58, 237, 0.6)',
              transformOrigin: '50% 100%',
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
            }}
          >
            {letter}
          </motion.span>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className={`font-bold uppercase tracking-[0.3em] text-blue-400 ${isMobile ? 'text-[10px]' : 'text-sm'}`}
        style={{ fontFamily: 'var(--font-grotesk)' }}
      >
        AI Education
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 0.6 : 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        className={`mt-4 text-slate-400 text-center max-w-xs ${isMobile ? 'text-[10px] px-6' : 'text-sm'}`}
      >
        Teaching the future. We teach thinking, not just coding.
      </motion.p>
    </motion.div>
  );
}

/* ============ MAIN COMPONENT ============ */
export default function CinematicIntro() {
  // Initialize isMobile from window.innerWidth BEFORE first render
  // (avoids 1-2 frame flash of wrong layout on mobile)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState<Phase>('field');
  const [skipVisible, setSkipVisible] = useState(false);
  const [muted, setMuted] = useState(false);
  const [soundTrigger, setSoundTrigger] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Module-level flag — if intro already played in this JS session (route navigation), don't show again
    if (hasPlayedInThisSession) return;

    // Respect reduced-motion users
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      hasPlayedInThisSession = true;
      return;
    }

    // Mark as played IMMEDIATELY so route navigations don't re-trigger
    hasPlayedInThisSession = true;

    const mobileCheck = window.innerWidth < 768;
    const showFrame = requestAnimationFrame(() => {
      setShow(true);
      setSoundTrigger((n) => n + 1); // trigger sound play
    });

    const skipTimer = setTimeout(() => setSkipVisible(true), 1000);

    // Phase timeline
    const t1 = setTimeout(() => setPhase('network'), 1200);
    const t2 = setTimeout(() => setPhase('collapse'), 2800);
    const t3 = setTimeout(() => setPhase('logo'), 3100);
    const t4 = setTimeout(() => setPhase('type'), 3400);
    const t5 = setTimeout(() => setPhase('done'), 4500);
    const t6 = setTimeout(() => setShow(false), 4600);

    return () => {
      cancelAnimationFrame(showFrame);
      clearTimeout(skipTimer);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); clearTimeout(t6);
    };
  }, []);

  // Play sound when triggered (after mount + when mute state changes via re-trigger)
  useEffect(() => {
    if (soundTrigger > 0 && show && !muted) {
      playMagicalSound(muted);
    }
  }, [soundTrigger, show, muted]);

  // Browser autoplay policy: if AudioContext is suspended, resume on first user gesture.
  // Also: if sound was queued at intro start (because context was suspended), replay it now.
  useEffect(() => {
    if (!show) return;
    const resumeOnGesture = () => {
      const ctx = getAudioCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume()
          .then(() => {
            // If sound was queued but never played (because context was suspended at intro start),
            // replay it now that the context is running.
            if (soundQueuedForGesture && !soundHasPlayed && !muted) {
              playMagicalSound(muted, true);
            }
          })
          .catch(() => {});
      } else if (soundQueuedForGesture && !soundHasPlayed && !muted) {
        // Context already running — just play the queued sound
        playMagicalSound(muted, true);
      }
    };
    // One-time listeners — any click/key/tap will resume audio + play queued sound
    const opts = { once: true, passive: true };
    window.addEventListener('click', resumeOnGesture, opts);
    window.addEventListener('keydown', resumeOnGesture, opts);
    window.addEventListener('touchstart', resumeOnGesture, opts);
    window.addEventListener('pointerdown', resumeOnGesture, opts);
    return () => {
      window.removeEventListener('click', resumeOnGesture);
      window.removeEventListener('keydown', resumeOnGesture);
      window.removeEventListener('touchstart', resumeOnGesture);
      window.removeEventListener('pointerdown', resumeOnGesture);
    };
  }, [show, muted]);

  const skip = useCallback(() => {
    setShow(false);
    setPhase('done');
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const newMuted = !m;
      if (!newMuted && show) {
        // If unmuting, replay the sound from current position (force = true)
        soundHasPlayed = false; // allow replay
        playMagicalSound(false, true);
      }
      return newMuted;
    });
  }, [show]);

  if (!show) return null;

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] bg-slate-950 overflow-hidden"
        >
          {/* Animated background gradient */}
          <motion.div
            animate={{
              background: phase === 'field'
                ? 'radial-gradient(circle at center, #14100C 0%, #000 100%)'
                : phase === 'network'
                ? 'radial-gradient(circle at center, #1E1B4B 0%, #14100C 70%)'
                : 'radial-gradient(circle at center, #1E3A8A 0%, #14100C 70%)'
            }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          />

          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.6) 100%)' }}
          />

          {/* 3D Canvas — neural particle field (full screen on ALL devices)
              On mobile, the 3D group is offset downward (groupY = -1.5) so
              the neural network renders in the bottom portion, away from
              the logo text at top. */}
          <div className="absolute inset-0">
            <Canvas
              dpr={[1, isMobile ? 1.2 : 2]}
              camera={{ position: [0, 0, 8], fov: 60 }}
              gl={{ antialias: true, alpha: true, depth: false, powerPreference: 'high-performance' }}
              style={{ background: 'transparent' }}
              performance={{ min: 0.5 }}
            >
              <ParticleField phase={phase} isMobile={isMobile} />
            </Canvas>
          </div>

          {/* Typing logo overlay */}
          <TypingLogo visible={phase === 'logo' || phase === 'type'} isMobile={isMobile} />

          {/* Progress bar */}
          <div className={`absolute ${isMobile ? 'bottom-14' : 'bottom-20'} left-1/2 -translate-x-1/2 ${isMobile ? 'w-32' : 'w-56'} z-20`}>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 4.5, ease: 'linear' }}
                className="h-full bg-gradient-to-r from-blue-500 to-violet-500 origin-left rounded-full"
                style={{ boxShadow: '0 0 8px rgba(37, 99, 235, 0.8)' }}
              />
            </div>
          </div>

          {/* Top-right controls: Mute + Skip */}
          <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-20 flex items-center gap-2">
            {/* Mute toggle */}
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: skipVisible ? 1 : 0, y: skipVisible ? 0 : -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={toggleMute}
              className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 hover:border-white/40 transition-all cursor-pointer"
              aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </motion.button>

            {/* Skip button */}
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: skipVisible ? 1 : 0, y: skipVisible ? 0 : -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={skip}
              className="px-5 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-500/40"
              style={{ minHeight: '44px', minWidth: '44px', fontFamily: 'var(--font-grotesk)' }}
              aria-label="Skip intro"
            >
              Skip
              <span className="text-[9px] opacity-70">↗</span>
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
