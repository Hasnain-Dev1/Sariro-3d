'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Environment, Float, MeshDistortMaterial } from '@react-three/drei';
import { useRef, useMemo, Suspense, type ReactNode } from 'react';
import * as THREE from 'three';

/* ===============================================================
   PAGE HERO 3D — Reusable 3D scene for EVERY inner page hero.
   Each page passes a "variant" prop → unique 3D identity.
   Shares ONE Canvas (perf-friendly), only renders when in view.

   SCROLL BEHAVIOR: every hero scene group ROTATES based on scroll
   direction. Scroll DOWN = positive Y rotation; scroll UP = negative
   Y rotation. Velocity-aware (faster scroll = faster spin, clamped).
=============================================================== */

type Variant = 'courses' | 'schools' | 'events' | 'pricing' | 'about' | 'resources' | 'contact' | 'story' | 'faq';

/* ---------- Shared scroll-rotation hook ----------
   Returns a ref to attach to a group. The group's rotation.y will
   track the integrated scroll delta (sign-aware). */
function useScrollRotation(maxVel = 0.08, lerp = 0.12) {
  const groupRef = useRef<THREE.Group>(null);
  const lastScrollY = useRef<number>(typeof window !== 'undefined' ? window.scrollY : 0);
  const velocity = useRef(0);

  useFrame(() => {
    if (!groupRef.current || typeof window === 'undefined') return;
    const current = window.scrollY;
    const delta = current - lastScrollY.current;
    lastScrollY.current = current;
    // Clamp velocity per frame so giant scrolls don't fling it
    const v = Math.max(-maxVel, Math.min(maxVel, delta * 0.0015));
    velocity.current += (v - velocity.current) * 0.25;
    // Integrate into rotation — sign comes from delta naturally
    groupRef.current.rotation.y += velocity.current;
  });

  return groupRef;
}

/* ---------- COURSES: laptop + notebook + pen (realistic) ---------- */
function CoursesScene({ color }: { color: string }) {
  const group = useScrollRotation();
  const screenRef = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.7 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });
  return (
    <group ref={group}>
      {/* Laptop */}
      <Float speed={0.8} floatIntensity={0.3} rotationIntensity={0.1}>
        <group position={[0, -0.1, 0]} rotation={[0.2, -0.15, 0]}>
          <mesh position={[0, -0.2, 0.25]}><boxGeometry args={[1.5, 0.05, 1.0]} /><meshStandardMaterial color="#D1D5DB" metalness={0.7} roughness={0.3} /></mesh>
          <mesh position={[0, -0.17, 0.2]}><boxGeometry args={[1.25, 0.005, 0.65]} /><meshStandardMaterial color="#374151" metalness={0.3} roughness={0.7} /></mesh>
          <group position={[0, -0.2, -0.25]} rotation={[-1.35, 0, 0]}>
            <mesh position={[0, 0.55, -0.03]}><boxGeometry args={[1.5, 1.05, 0.05]} /><meshStandardMaterial color="#C4CAD2" metalness={0.75} roughness={0.25} /></mesh>
            <mesh position={[0, 0.55, 0.01]}><planeGeometry args={[1.4, 0.95]} /><meshStandardMaterial color="#0F172A" metalness={0.3} roughness={0.05} /></mesh>
            <mesh ref={screenRef} position={[-0.3, 0.6, 0.02]}><planeGeometry args={[0.5, 0.6]} /><meshBasicMaterial color="#14B8A6" transparent opacity={0.75} /></mesh>
            <mesh position={[0.2, 0.7, 0.02]}><planeGeometry args={[0.45, 0.22]} /><meshBasicMaterial color="#7C3AED" transparent opacity={0.65} /></mesh>
          </group>
        </group>
      </Float>
      {/* Notebook */}
      <Float speed={1.3} floatIntensity={0.4} rotationIntensity={0.2}>
        <group position={[1.35, 0.25, 0]} rotation={[-0.2, -0.6, 0.12]}>
          <mesh><boxGeometry args={[0.8, 0.15, 1.05]} /><meshStandardMaterial color="#14B8A6" metalness={0.3} roughness={0.4} /></mesh>
          <mesh position={[0.41, 0, 0]}><boxGeometry args={[0.04, 0.13, 1.03]} /><meshStandardMaterial color="#FFFFFF" metalness={0.05} roughness={0.5} /></mesh>
          <mesh position={[-0.41, 0, 0]}><boxGeometry args={[0.025, 0.15, 1.05]} /><meshStandardMaterial color="#0F766E" metalness={0.3} roughness={0.4} /></mesh>
          <mesh position={[0.15, -0.25, 0.35]}><boxGeometry args={[0.08, 0.35, 0.02]} /><meshStandardMaterial color="#F43F5E" metalness={0.2} roughness={0.3} /></mesh>
        </group>
      </Float>
      {/* Pen */}
      <Float speed={1.8} floatIntensity={0.4} rotationIntensity={0.3}>
        <group position={[-1.1, 0.3, 0.2]} rotation={[0, 0, 0.6]}>
          <mesh position={[0, -0.25, 0]}><cylinderGeometry args={[0.05, 0.045, 0.4, 16]} /><meshStandardMaterial color="#14B8A6" metalness={0.5} roughness={0.3} /></mesh>
          <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.05, 0.05, 0.25, 16]} /><meshStandardMaterial color="#FFFFFF" metalness={0.2} roughness={0.25} /></mesh>
          <mesh position={[0, 0.19, 0]}><cylinderGeometry args={[0.052, 0.052, 0.03, 16]} /><meshStandardMaterial color="#D4AF37" metalness={0.95} roughness={0.1} /></mesh>
          <mesh position={[0, 0.32, 0]}><cylinderGeometry args={[0.048, 0.05, 0.15, 16]} /><meshStandardMaterial color="#14B8A6" metalness={0.5} roughness={0.3} /></mesh>
          <mesh position={[0, -0.48, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.035, 0.08, 12]} /><meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.15} /></mesh>
        </group>
      </Float>
    </group>
  );
}

/* ---------- SCHOOLS: MATH-THEMED scene (Platonic solids + math symbols) ----------
   The 5 Platonic solids are THE iconic geometry/math shapes — perfect
   for a school page about teaching thinking. Floating math symbols
   (+, ×, ÷, =, π, √, ∞) orbit around them. A grid-textured
   "math notebook" plane sits in the background. */
function SchoolsScene({ color }: { color: string }) {
  const group = useScrollRotation();
  const solidsRef = useRef<THREE.Group>(null);
  const symbolsRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    // Each Platonic solid spins on its own axis at its own rate
    if (solidsRef.current) {
      solidsRef.current.children.forEach((child, i) => {
        child.rotation.x += delta * (0.25 + i * 0.08) * (i % 2 === 0 ? 1 : -1);
        child.rotation.y += delta * (0.35 + i * 0.06);
      });
    }
    // The whole symbol ring slowly counter-rotates
    if (symbolsRef.current) {
      symbolsRef.current.rotation.y += delta * 0.06;
    }
  });

  // Brand palette for the 5 math shapes — rainbow of accents used across the site
  // (NO cube — user explicitly said no cubes anywhere. Torus replaces it.)
  const SOLIDS = [
    { geo: <tetrahedronGeometry args={[0.5]} />, color: '#DC2626', pos: [0, 0.15, 0] as const },           // red — tetrahedron (4 faces)
    { geo: <torusGeometry args={[0.28, 0.12, 16, 32]} />, color: '#2563EB', pos: [1.2, 0.5, -0.2] as const }, // blue — torus (donut)
    { geo: <octahedronGeometry args={[0.5]} />, color: '#16A34A', pos: [-1.2, 0.4, -0.1] as const },       // green — octahedron (8 faces)
    { geo: <dodecahedronGeometry args={[0.45]} />, color: '#F59E0B', pos: [0.7, -0.8, 0.1] as const },     // amber — dodecahedron (12 faces)
    { geo: <icosahedronGeometry args={[0.45]} />, color: '#7C3AED', pos: [-0.7, -0.7, 0.2] as const },     // violet — icosahedron (20 faces)
  ];

  // Math symbols arranged in a ring at radius ~2.0
  // Each symbol is positioned by angle around the center
  const SYMBOL_RING: { angle: number; y: number; build: (c: string) => ReactNode }[] = [
    // + Plus
    { angle: 0, y: 0.6, build: (c) => (
      <group>
        <mesh><boxGeometry args={[0.06, 0.32, 0.06]} /><meshStandardMaterial color={c} metalness={0.5} roughness={0.3} /></mesh>
        <mesh><boxGeometry args={[0.32, 0.06, 0.06]} /><meshStandardMaterial color={c} metalness={0.5} roughness={0.3} /></mesh>
      </group>
    )},
    // × Multiply
    { angle: Math.PI / 4, y: -0.3, build: (c) => (
      <group rotation={[0, 0, Math.PI / 4]}>
        <mesh><boxGeometry args={[0.06, 0.36, 0.06]} /><meshStandardMaterial color={c} metalness={0.5} roughness={0.3} /></mesh>
        <mesh><boxGeometry args={[0.36, 0.06, 0.06]} /><meshStandardMaterial color={c} metalness={0.5} roughness={0.3} /></mesh>
      </group>
    )},
    // ÷ Divide
    { angle: Math.PI / 2, y: 0.5, build: (c) => (
      <group>
        <mesh position={[0, 0.18, 0]}><sphereGeometry args={[0.05, 16, 16]} /><meshStandardMaterial color={c} metalness={0.5} roughness={0.3} /></mesh>
        <mesh><boxGeometry args={[0.34, 0.05, 0.05]} /><meshStandardMaterial color={c} metalness={0.5} roughness={0.3} /></mesh>
        <mesh position={[0, -0.18, 0]}><sphereGeometry args={[0.05, 16, 16]} /><meshStandardMaterial color={c} metalness={0.5} roughness={0.3} /></mesh>
      </group>
    )},
    // = Equals
    { angle: (3 * Math.PI) / 4, y: -0.4, build: (c) => (
      <group>
        <mesh position={[0, 0.09, 0]}><boxGeometry args={[0.34, 0.06, 0.06]} /><meshStandardMaterial color={c} metalness={0.5} roughness={0.3} /></mesh>
        <mesh position={[0, -0.09, 0]}><boxGeometry args={[0.34, 0.06, 0.06]} /><meshStandardMaterial color={c} metalness={0.5} roughness={0.3} /></mesh>
      </group>
    )},
    // π Pi (top bar + 2 legs)
    { angle: Math.PI, y: 0.55, build: (c) => (
      <group>
        <mesh position={[0, 0.16, 0]}><boxGeometry args={[0.42, 0.06, 0.06]} /><meshStandardMaterial color={c} metalness={0.5} roughness={0.3} /></mesh>
        <mesh position={[-0.15, -0.05, 0]}><boxGeometry args={[0.06, 0.4, 0.06]} /><meshStandardMaterial color={c} metalness={0.5} roughness={0.3} /></mesh>
        <mesh position={[0.15, -0.05, 0]}><boxGeometry args={[0.06, 0.4, 0.06]} /><meshStandardMaterial color={c} metalness={0.5} roughness={0.3} /></mesh>
      </group>
    )},
    // √ Square root (bent L shape)
    { angle: (5 * Math.PI) / 4, y: -0.2, build: (c) => (
      <group rotation={[0, 0, 0.3]}>
        <mesh position={[-0.08, -0.05, 0]} rotation={[0, 0, 0.4]}><boxGeometry args={[0.12, 0.06, 0.06]} /><meshStandardMaterial color={c} metalness={0.5} roughness={0.3} /></mesh>
        <mesh position={[0.08, 0.08, 0]} rotation={[0, 0, -0.6]}><boxGeometry args={[0.28, 0.06, 0.06]} /><meshStandardMaterial color={c} metalness={0.5} roughness={0.3} /></mesh>
      </group>
    )},
    // ∞ Infinity (two toruses side by side)
    { angle: (3 * Math.PI) / 2, y: 0.45, build: (c) => (
      <group>
        <mesh position={[-0.13, 0, 0]} rotation={[0, 0, 0]}><torusGeometry args={[0.1, 0.035, 12, 32]} /><meshStandardMaterial color={c} metalness={0.5} roughness={0.3} /></mesh>
        <mesh position={[0.13, 0, 0]}><torusGeometry args={[0.1, 0.035, 12, 32]} /><meshStandardMaterial color={c} metalness={0.5} roughness={0.3} /></mesh>
      </group>
    )},
    // Δ Delta (triangle — actual 3D triangular prism / cone)
    { angle: (7 * Math.PI) / 4, y: -0.35, build: (c) => (
      <mesh rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.05, 3]} />
        <meshStandardMaterial color={c} metalness={0.5} roughness={0.3} side={THREE.DoubleSide} flatShading />
      </mesh>
    )},
  ];

  return (
    <group ref={group}>
      {/* Math notebook grid plane (background) */}
      <mesh position={[0, 0, -1.8]} rotation={[0, 0, 0]}>
        <planeGeometry args={[7, 5]} />
        <meshStandardMaterial
          color="#F8FAFC"
          metalness={0.05}
          roughness={0.95}
          side={THREE.DoubleSide}
          transparent
          opacity={0.35}
        />
      </mesh>
      {/* Grid lines on the notebook */}
      <gridHelper args={[7, 14, '#94A3B8', '#CBD5E1']} position={[0, 0, -1.79]} />

      {/* Central cluster of 5 Platonic solids */}
      <group ref={solidsRef}>
        {SOLIDS.map((s, i) => (
          <Float key={i} speed={1.5 + i * 0.2} floatIntensity={0.4} rotationIntensity={0.3}>
            <mesh position={s.pos}>
              {s.geo}
              <meshStandardMaterial
                color={s.color}
                metalness={0.5}
                roughness={0.25}
                emissive={s.color}
                emissiveIntensity={0.15}
                flatShading
              />
            </mesh>
          </Float>
        ))}
      </group>

      {/* Floating math symbols — ring of 8 */}
      <group ref={symbolsRef}>
        {SYMBOL_RING.map((sym, i) => {
          const r = 2.0;
          const x = Math.cos(sym.angle) * r;
          const z = Math.sin(sym.angle) * r;
          const symColor = [color, '#2563EB', '#7C3AED', '#F59E0B', '#DC2626', '#06B6D4', '#16A34A', '#EC4899'][i];
          return (
            <Float key={i} speed={1.2 + i * 0.15} floatIntensity={0.5} rotationIntensity={0.4}>
              <group position={[x, sym.y, z]} rotation={[0, -sym.angle, 0]}>
                {sym.build(symColor)}
              </group>
            </Float>
          );
        })}
      </group>

      {/* Small orbiting numbers-as-shapes (3 tiny spheres representing "1, 2, 3") */}
      {[0, 1, 2].map((i) => (
        <Float key={i} speed={2 + i * 0.5} floatIntensity={0.6} rotationIntensity={0.5}>
          <mesh position={[1.5 - i * 0.6, -1.4 + i * 0.15, 0.6 + i * 0.2]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial
              color={['#2563EB', '#16A34A', '#DC2626'][i]}
              emissive={['#2563EB', '#16A34A', '#DC2626'][i]}
              emissiveIntensity={0.4}
              metalness={0.4}
              roughness={0.25}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

/* ---------- EVENTS: floating glass event ticket + calendar + confetti ---------- */
function EventsScene({ color }: { color: string }) {
  const group = useScrollRotation();
  const roosterRef = useRef<THREE.Group>(null);
  const paperRefs = useRef<THREE.Mesh[]>([]);
  useFrame((state) => {
    if (roosterRef.current) {
      const t = state.clock.elapsedTime;
      roosterRef.current.rotation.z = Math.sin(t * 3) * 0.12;
      roosterRef.current.position.y = 0.3 + Math.abs(Math.sin(t * 3)) * 0.08;
      // Head bob
      const head = roosterRef.current.getObjectByName('head');
      if (head) head.rotation.z = Math.sin(t * 4) * 0.15;
      // Tail feather sway
      const tail = roosterRef.current.getObjectByName('tail');
      if (tail) tail.rotation.y = Math.sin(t * 2) * 0.1 + 0.3;
    }
    paperRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const t = state.clock.elapsedTime * 0.8 + i * 1.2;
      mesh.position.x = Math.sin(t) * 2 + Math.cos(t * 0.7) * 0.5;
      mesh.position.y = Math.sin(t * 1.3) * 0.8 + 0.5;
      mesh.position.z = Math.cos(t * 0.9) * 1.2;
      mesh.rotation.x = t * 0.5;
      mesh.rotation.y = t * 0.3;
      mesh.rotation.z = Math.sin(t * 2) * 0.5;
    });
  });
  return (
    <group ref={group}>
      {/* Calendar */}
      <Float speed={1} floatIntensity={0.3} rotationIntensity={0.1}>
        <group rotation={[-0.2, 0.2, 0]} position={[0, -0.3, 0]}>
          <mesh><boxGeometry args={[1.1, 0.04, 0.85]} /><meshStandardMaterial color="#FFFFFF" metalness={0.05} roughness={0.4} /></mesh>
          <mesh position={[0, 0.06, -0.38]}><boxGeometry args={[1.1, 0.06, 0.08]} /><meshStandardMaterial color={color} metalness={0.3} roughness={0.35} emissive={color} emissiveIntensity={0.15} /></mesh>
          {[-0.3, 0.3].map((x, i) => (
            <mesh key={i} position={[x, 0.1, -0.38]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.06, 0.015, 8, 16]} /><meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.2} /></mesh>
          ))}
        </group>
      </Float>
      {/* Floating glass event ticket — replaces the old rooster.
          Modern, premium, on-brand for an Events page. Glass material
          with transmission + colored accent edge + orbiting confetti. */}
      <group ref={roosterRef} position={[0, 0.45, 0.4]}>
        {/* Ticket body — glassy, with two notches (ticket-stub style) */}
        <mesh>
          <boxGeometry args={[1.2, 0.55, 0.04]} />
          <meshPhysicalMaterial
            color="#FFFFFF"
            metalness={0.1}
            roughness={0.15}
            transmission={0.85}
            thickness={0.4}
            clearcoat={1}
            clearcoatRoughness={0.1}
            transparent
            opacity={0.72}
          />
        </mesh>

        {/* Tear-off perforation line (right third of ticket) */}
        <mesh position={[0.32, 0, 0.025]}>
          <boxGeometry args={[0.005, 0.5, 0.01]} />
          <meshBasicMaterial color="#0F172A" transparent opacity={0.25} />
        </mesh>
        {[-0.18, -0.09, 0, 0.09, 0.18].map((y, i) => (
          <mesh key={`perf-${i}`} position={[0.32, y, 0.03]}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshBasicMaterial color="#0F172A" transparent opacity={0.4} />
          </mesh>
        ))}

        {/* Left section: SARIRO EVENT title bar */}
        <mesh position={[-0.35, 0.18, 0.025]}>
          <boxGeometry args={[0.45, 0.08, 0.005]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.2} emissive={color} emissiveIntensity={0.35} />
        </mesh>

        {/* "ADMIT ONE" tiny chip — top-right of left section */}
        <mesh position={[-0.4, 0.05, 0.025]}>
          <boxGeometry args={[0.18, 0.04, 0.005]} />
          <meshBasicMaterial color="#0F172A" transparent opacity={0.6} />
        </mesh>

        {/* Text line abstracts on left section */}
        {[-0.05, -0.13, -0.21].map((y, i) => (
          <mesh key={`line-${i}`} position={[-0.35, y, 0.025]}>
            <planeGeometry args={[0.5 - i * 0.1, 0.025]} />
            <meshBasicMaterial color="#475569" transparent opacity={0.5} />
          </mesh>
        ))}

        {/* Right section (stub): barcode strips */}
        {[-0.05, -0.03, -0.01, 0.01, 0.03, 0.05, 0.07, 0.09, 0.11, 0.13, 0.15, 0.17].map((x, i) => (
          <mesh key={`barcode-${i}`} position={[0.45 + x * 0.5, 0.1, 0.025]}>
            <boxGeometry args={[0.005 + (i % 3) * 0.003, 0.18, 0.005]} />
            <meshBasicMaterial color="#0F172A" transparent opacity={0.85} />
          </mesh>
        ))}

        {/* Stub bottom label */}
        <mesh position={[0.47, -0.15, 0.025]}>
          <planeGeometry args={[0.28, 0.025]} />
          <meshBasicMaterial color="#475569" transparent opacity={0.55} />
        </mesh>

        {/* Colored accent edge — top + bottom strips */}
        <mesh position={[0, 0.285, 0]}>
          <boxGeometry args={[1.21, 0.015, 0.045]} />
          <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} emissive={color} emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, -0.285, 0]}>
          <boxGeometry args={[1.21, 0.015, 0.045]} />
          <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} emissive={color} emissiveIntensity={0.4} />
        </mesh>

        {/* Star sparkle on the title bar */}
        <mesh position={[-0.2, 0.18, 0.05]} rotation={[0, 0, Math.PI / 4]}>
          <octahedronGeometry args={[0.04]} />
          <meshStandardMaterial color="#FFFFFF" metalness={0.7} roughness={0.15} emissive="#FFFFFF" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* Orbiting confetti pieces — celebrate the event vibe */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <Float key={`conf-${i}`} speed={2 + i * 0.3} floatIntensity={0.8} rotationIntensity={1.2}>
            <mesh
              position={[Math.cos(angle) * 1.5, Math.sin(angle * 2) * 0.6 + 0.4, Math.sin(angle) * 1.3]}
              rotation={[angle, angle * 0.7, angle * 1.3]}
            >
              <boxGeometry args={[0.06, 0.02, 0.06]} />
              <meshStandardMaterial
                color={['#2563EB', '#7C3AED', '#16A34A', '#F59E0B', '#06B6D4', '#EC4899'][i]}
                metalness={0.5}
                roughness={0.2}
                emissive={['#2563EB', '#7C3AED', '#16A34A', '#F59E0B', '#06B6D4', '#EC4899'][i]}
                emissiveIntensity={0.3}
              />
            </mesh>
          </Float>
        );
      })}

      {/* Atmospheric sparkles */}
      <Sparkles count={20} scale={4} size={1.5} speed={0.3} opacity={0.55} color={color} />

      {/* Flying papers */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} ref={(el) => { if (el) paperRefs.current[i] = el; }} position={[0, 0, 0]}>
          <planeGeometry args={[0.2, 0.28]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#FFFFFF' : '#F8FAFC'} metalness={0.05} roughness={0.5} side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- PRICING: piggy bank + coins (UNCHANGED — already great) ---------- */
function PricingScene({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  const piggyRef = useRef<THREE.Group>(null);
  const coinDropRef = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.1;
    if (piggyRef.current) {
      piggyRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
      piggyRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8) * 0.03;
    }
    if (coinDropRef.current) {
      const t = (state.clock.elapsedTime % 2.5) / 2.5;
      coinDropRef.current.position.y = 0.7 - t * 0.6;
      const mat = coinDropRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = t < 0.8 ? 1 : 1 - (t - 0.8) * 5;
      coinDropRef.current.rotation.x = t * Math.PI * 3;
    }
  });
  return (
    <group ref={group}>
      <group ref={piggyRef} position={[0, 0, 0]}>
        <mesh scale={[1.2, 1, 1.1]}><sphereGeometry args={[0.35, 20, 20]} /><meshStandardMaterial color="#F9A8D4" metalness={0.15} roughness={0.4} /></mesh>
        <mesh position={[0.38, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.1, 0.1, 0.08, 16]} /><meshStandardMaterial color="#F472B6" metalness={0.15} roughness={0.4} /></mesh>
        {[-0.03, 0.03].map((y, i) => <mesh key={i} position={[0.42, y, 0]}><sphereGeometry args={[0.015, 8, 8]} /><meshStandardMaterial color="#831843" /></mesh>)}
        {[-0.15, 0.15].map((z, i) => <mesh key={i} position={[0.15, 0.3, z]} rotation={[0, 0, -0.3]}><coneGeometry args={[0.06, 0.12, 4]} /><meshStandardMaterial color="#F472B6" metalness={0.15} roughness={0.4} /></mesh>)}
        {[-0.08, 0.08].map((z, i) => <mesh key={i} position={[0.28, 0.12, z]}><sphereGeometry args={[0.025, 8, 8]} /><meshStandardMaterial color="#000000" /></mesh>)}
        <mesh position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]}><boxGeometry args={[0.15, 0.03, 0.01]} /><meshStandardMaterial color="#1F2937" metalness={0.5} roughness={0.3} /></mesh>
        {[[0.15, 0.15], [0.15, -0.15], [-0.15, 0.15], [-0.15, -0.15]].map(([x, z], i) => <mesh key={i} position={[x, -0.32, z]}><cylinderGeometry args={[0.03, 0.03, 0.1, 6]} /><meshStandardMaterial color="#F472B6" metalness={0.15} roughness={0.4} /></mesh>)}
        <mesh position={[-0.42, 0.05, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.06, 0.015, 8, 16, Math.PI * 1.5]} /><meshStandardMaterial color="#F472B6" metalness={0.15} roughness={0.4} /></mesh>
      </group>
      <mesh ref={coinDropRef} position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.12, 0.12, 0.03, 24]} /><meshStandardMaterial color={color} metalness={0.9} roughness={0.15} emissive={color} emissiveIntensity={0.2} transparent opacity={1} /></mesh>
      {[0, 1, 2].map((i) => {
        const angle = (i / 3) * Math.PI * 2;
        return (
          <Float key={i} speed={1.5 + i * 0.3} floatIntensity={0.3} rotationIntensity={0.5}>
            <mesh position={[Math.cos(angle) * 1.3, Math.sin(angle) * 0.5 + 0.3, Math.sin(angle) * 1.3]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.03, 24]} />
              <meshStandardMaterial color={i === 1 ? color : '#D4AF37'} metalness={0.9} roughness={0.15} emissive={i === 1 ? color : '#D4AF37'} emissiveIntensity={0.15} />
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

/* ---------- ABOUT: glowing AI orb + orbiting nodes ---------- */
function AboutScene({ color }: { color: string }) {
  const orbRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const group = useScrollRotation();
  useFrame((state, delta) => {
    if (!orbRef.current) return;
    orbRef.current.rotation.y += delta * 0.3;
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.4;
      ringRef.current.rotation.x = Math.PI / 3;
    }
  });
  return (
    <group ref={group}>
      <mesh ref={orbRef}><icosahedronGeometry args={[0.6, 3]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} metalness={0.7} roughness={0.2} /></mesh>
      <mesh ref={ringRef}><torusGeometry args={[1.2, 0.03, 8, 64]} /><meshBasicMaterial color={color} transparent opacity={0.5} /></mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 1.5, Math.sin(angle * 2) * 0.4, Math.sin(angle) * 1.5]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial color={i % 2 === 0 ? color : '#7C3AED'} emissive={i % 2 === 0 ? color : '#7C3AED'} emissiveIntensity={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ---------- RESOURCES: floating books + papers ---------- */
function ResourcesScene({ color }: { color: string }) {
  const group = useScrollRotation();
  useFrame(() => {});
  return (
    <group ref={group}>
      {[-0.5, 0, 0.5].map((y, i) => (
        <Float key={`book-${i}`} speed={1 + i * 0.3} floatIntensity={0.4} rotationIntensity={0.2}>
          <mesh position={[0, y * 0.6, 0]} rotation={[0, i * 0.3, 0.05]}>
            <boxGeometry args={[0.7 - i * 0.05, 0.12, 0.5]} />
            <meshStandardMaterial color={i === 0 ? color : i === 1 ? '#7C3AED' : '#16A34A'} metalness={0.3} roughness={0.5} emissive={i === 0 ? color : i === 1 ? '#7C3AED' : '#16A34A'} emissiveIntensity={0.1} />
          </mesh>
        </Float>
      ))}
      <Float speed={1.5} floatIntensity={0.6} rotationIntensity={0.4}>
        <mesh position={[1, 0.3, 0.2]} rotation={[0.2, 0.5, 0.1]}>
          <planeGeometry args={[0.4, 0.55]} />
          <meshStandardMaterial color="#FFFFFF" metalness={0.05} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
      </Float>
      <Float speed={2} floatIntensity={0.8} rotationIntensity={0.5}>
        <mesh position={[0.8, -0.5, 0.4]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={0.5} metalness={0.5} roughness={0.2} />
        </mesh>
      </Float>
    </group>
  );
}

/* ---------- CONTACT: glowing glass envelope + orbiting message bubbles
   + luminous trail. Realistic, modern, premium feel — replaces the
   old cartoon child+plane scene.
   Built with MeshPhysicalMaterial (transmission, roughness, clearcoat)
   for true glass realism, plus drei <Float> for organic motion. */
function ContactScene({ color }: { color: string }) {
  const group = useScrollRotation();
  const envelopeRef = useRef<THREE.Group>(null);
  const flapRef = useRef<THREE.Mesh>(null);
  const bubbleRefs = useRef<THREE.Mesh[]>([]);
  const trailRefs = useRef<THREE.Mesh[]>([]);
  const ringRef = useRef<THREE.Mesh>(null);

  // Bubble orbit path — each bubble traces its own ellipse around the envelope
  const bubbleOrbit = (i: number, t: number): [number, number, number] => {
    const phase = t * 0.5 + (i * Math.PI * 2) / 5;
    const rx = 1.6 + (i % 2) * 0.2;
    const ry = 0.6 + (i % 3) * 0.15;
    const rz = 1.4 + (i % 2) * 0.2;
    return [
      Math.cos(phase) * rx,
      Math.sin(phase * 1.3) * ry,
      Math.sin(phase) * rz,
    ];
  };

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (envelopeRef.current) {
      envelopeRef.current.position.y = Math.sin(t * 0.9) * 0.08;
      envelopeRef.current.rotation.z = Math.sin(t * 0.5) * 0.04;
      envelopeRef.current.rotation.y += delta * 0.15;
    }
    if (flapRef.current) {
      flapRef.current.rotation.x = -2.4 + Math.sin(t * 1.2) * 0.05;
    }
    bubbleRefs.current.forEach((m, i) => {
      if (!m) return;
      const [x, y, z] = bubbleOrbit(i, t);
      m.position.set(x, y, z);
      m.rotation.y += delta * 0.8;
      m.rotation.x += delta * 0.4;
    });
    trailRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const pt = t * 0.5 - i * 0.04;
      const [x, y, z] = bubbleOrbit(0, pt);
      mesh.position.set(x, y, z);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const fade = 1 - i / 14;
      mat.opacity = fade * 0.55;
      mesh.scale.setScalar(fade * 0.45 + 0.04);
    });
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.3;
      ringRef.current.rotation.x = Math.PI / 2.4 + Math.sin(t * 0.4) * 0.05;
    }
  });

  return (
    <group ref={group}>
      {/* Halo ring */}
      <mesh ref={ringRef} position={[0, 0, -0.3]}>
        <torusGeometry args={[1.4, 0.018, 12, 96]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} />
      </mesh>

      {/* Soft ground shadow */}
      <mesh position={[0, -1.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 48]} />
        <meshBasicMaterial color="#0F172A" transparent opacity={0.10} />
      </mesh>

      {/* Envelope (glass) */}
      <group ref={envelopeRef} position={[0, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.1, 0.75, 0.06]} />
          <meshPhysicalMaterial
            color="#FFFFFF"
            metalness={0.1}
            roughness={0.15}
            transmission={0.85}
            thickness={0.4}
            clearcoat={1}
            clearcoatRoughness={0.1}
            transparent
            opacity={0.7}
          />
        </mesh>

        <mesh ref={flapRef} position={[0, 0.35, 0.03]} rotation={[-2.4, 0, 0]}>
          <coneGeometry args={[0.78, 0.55, 4, 1]} />
          <meshPhysicalMaterial
            color="#FFFFFF"
            metalness={0.1}
            roughness={0.18}
            transmission={0.8}
            thickness={0.35}
            clearcoat={1}
            clearcoatRoughness={0.1}
            transparent
            opacity={0.78}
          />
        </mesh>

        {/* Wax seal */}
        <mesh position={[0, 0, 0.04]} rotation={[0, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.16, 0.16, 0.04, 6]} />
          <meshStandardMaterial
            color={color}
            metalness={0.4}
            roughness={0.25}
            emissive={color}
            emissiveIntensity={0.25}
          />
        </mesh>

        {/* @ symbol hint on seal */}
        <mesh position={[0, 0, 0.065]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.06, 0.012, 8, 24, Math.PI * 1.6]} />
          <meshStandardMaterial color="#FFFFFF" metalness={0.3} roughness={0.3} />
        </mesh>

        {/* Edge highlights */}
        <mesh position={[-0.55, 0, 0]}>
          <boxGeometry args={[0.01, 0.74, 0.07]} />
          <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} emissive={color} emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0.55, 0, 0]}>
          <boxGeometry args={[0.01, 0.74, 0.07]} />
          <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} emissive={color} emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* Orbiting message bubbles */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={`bubble-${i}`}
          ref={(el) => { if (el) bubbleRefs.current[i] = el; }}
        >
          <sphereGeometry args={[0.13, 24, 24]} />
          <meshPhysicalMaterial
            color={i % 2 === 0 ? '#FFFFFF' : color}
            metalness={0.2}
            roughness={0.15}
            transmission={0.7}
            thickness={0.25}
            clearcoat={0.9}
            clearcoatRoughness={0.1}
            transparent
            opacity={0.85}
            emissive={i % 2 === 0 ? '#FFFFFF' : color}
            emissiveIntensity={0.18}
          />
        </mesh>
      ))}

      {/* Light trail */}
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={`trail-${i}`} ref={(el) => { if (el) trailRefs.current[i] = el; }}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0} />
        </mesh>
      ))}

      <Sparkles count={20} scale={4} size={1.5} speed={0.25} opacity={0.6} color={color} />
    </group>
  );
}

/* ---------- STORY: open book with floating sparkles + bookmark ribbon ---------- */
function StoryScene({ color }: { color: string }) {
  const group = useScrollRotation();
  const bookRef = useRef<THREE.Group>(null);
  const pageRefs = useRef<THREE.Mesh[]>([]);
  const ribbonRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (bookRef.current) {
      bookRef.current.position.y = Math.sin(t * 0.8) * 0.05;
      bookRef.current.rotation.y = Math.sin(t * 0.3) * 0.08;
    }
    if (ribbonRef.current) {
      ribbonRef.current.rotation.z = Math.sin(t * 1.2) * 0.08 - 0.4;
    }
    pageRefs.current.forEach((p, i) => {
      if (!p) return;
      p.rotation.y = -0.05 + Math.sin(t * 0.6 + i * 0.4) * 0.03;
    });
  });

  return (
    <group ref={group}>
      <mesh position={[0, 0, -0.4]}>
        <circleGeometry args={[1.5, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} />
      </mesh>

      <group ref={bookRef} rotation={[0.1, 0, 0]}>
        {/* Book base */}
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[1.6, 0.08, 1.1]} />
          <meshStandardMaterial color="#92400E" metalness={0.2} roughness={0.6} />
        </mesh>

        {/* Left page */}
        <mesh
          ref={(el) => { if (el) pageRefs.current[0] = el; }}
          position={[-0.4, 0, 0]}
          rotation={[0, 0.4, 0]}
        >
          <boxGeometry args={[0.8, 0.02, 1.0]} />
          <meshStandardMaterial color="#FFFBF5" metalness={0.05} roughness={0.5} />
        </mesh>

        {/* Right page */}
        <mesh
          ref={(el) => { if (el) pageRefs.current[1] = el; }}
          position={[0.4, 0, 0]}
          rotation={[0, -0.4, 0]}
        >
          <boxGeometry args={[0.8, 0.02, 1.0]} />
          <meshStandardMaterial color="#FFFBF5" metalness={0.05} roughness={0.5} />
        </mesh>

        {/* Spine */}
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[0.04, 0.1, 1.1]} />
          <meshStandardMaterial color="#451A03" metalness={0.3} roughness={0.5} />
        </mesh>

        {/* Bookmark ribbon */}
        <mesh ref={ribbonRef} position={[0.35, 0.1, 0.3]} rotation={[0, 0, -0.4]}>
          <boxGeometry args={[0.06, 0.5, 0.01]} />
          <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} emissive={color} emissiveIntensity={0.2} />
        </mesh>

        {/* Text line abstracts */}
        {[-0.3, -0.15, 0, 0.15, 0.3].map((y, i) => (
          <mesh key={`line-${i}`} position={[0.45, 0.012, y]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.55, 0.04]} />
            <meshBasicMaterial color={i % 2 === 0 ? color : '#94A3B8'} transparent opacity={0.5} />
          </mesh>
        ))}
      </group>

      <Sparkles count={30} scale={3} size={2} speed={0.4} opacity={0.7} color={color} />
    </group>
  );
}

/* ---------- FAQ: floating question-mark bubbles + answer card ---------- */
function FaqScene({ color }: { color: string }) {
  const group = useScrollRotation();
  const cardRef = useRef<THREE.Group>(null);
  const qRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (cardRef.current) {
      cardRef.current.position.y = -0.5 + Math.sin(t * 0.9) * 0.06;
      cardRef.current.rotation.y = Math.sin(t * 0.4) * 0.06;
    }
    qRefs.current.forEach((q, i) => {
      if (!q) return;
      const phase = t * 1.1 + i * 0.7;
      q.position.y = 0.7 + i * 0.32 + Math.sin(phase) * 0.1;
      q.position.x = (i - 1.5) * 0.55 + Math.sin(phase * 0.6) * 0.08;
      q.rotation.z = Math.sin(phase * 0.5) * 0.18;
      const s = 0.7 + Math.sin(phase) * 0.06;
      q.scale.setScalar(s);
    });
  });

  return (
    <group ref={group}>
      <mesh position={[0, 0, -0.4]}>
        <circleGeometry args={[1.4, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.07} />
      </mesh>

      {/* Floating question marks */}
      {[0, 1, 2, 3].map((i) => (
        <group
          key={`q-${i}`}
          ref={(el) => { if (el) qRefs.current[i] = el; }}
        >
          <mesh rotation={[0, 0, 0]}>
            <torusGeometry args={[0.1, 0.03, 10, 24, Math.PI * 1.5]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? color : '#7C3AED'}
              metalness={0.4}
              roughness={0.25}
              emissive={i % 2 === 0 ? color : '#7C3AED'}
              emissiveIntensity={0.25}
            />
          </mesh>
          <mesh position={[0.07, -0.18, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.16, 10]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? color : '#7C3AED'}
              metalness={0.4}
              roughness={0.25}
              emissive={i % 2 === 0 ? color : '#7C3AED'}
              emissiveIntensity={0.25}
            />
          </mesh>
          <mesh position={[0.07, -0.32, 0]}>
            <sphereGeometry args={[0.025, 12, 12]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? color : '#7C3AED'}
              metalness={0.4}
              roughness={0.25}
              emissive={i % 2 === 0 ? color : '#7C3AED'}
              emissiveIntensity={0.25}
            />
          </mesh>
        </group>
      ))}

      {/* Answer card */}
      <group ref={cardRef} position={[0, -0.5, 0]}>
        <mesh>
          <boxGeometry args={[1.4, 0.85, 0.04]} />
          <meshPhysicalMaterial
            color="#FFFFFF"
            metalness={0.1}
            roughness={0.15}
            transmission={0.8}
            thickness={0.3}
            clearcoat={1}
            clearcoatRoughness={0.1}
            transparent
            opacity={0.75}
          />
        </mesh>
        <mesh position={[0, 0.4, 0.025]}>
          <boxGeometry args={[1.4, 0.06, 0.01]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.2} emissive={color} emissiveIntensity={0.3} />
        </mesh>
        {[-0.1, -0.22, -0.34].map((y, i) => (
          <mesh key={`line-${i}`} position={[0, y, 0.025]}>
            <planeGeometry args={[1.1 - i * 0.15, 0.04]} />
            <meshBasicMaterial color="#94A3B8" transparent opacity={0.55} />
          </mesh>
        ))}
      </group>

      <Sparkles count={18} scale={3} size={1.5} speed={0.3} opacity={0.55} color={color} />
    </group>
  );
}

/* ---------- Main component ---------- */
export default function PageHero3D({
  variant,
  accentColor = '#2563EB',
}: {
  variant: Variant;
  accentColor?: string;
}) {
  const scene = (() => {
    switch (variant) {
      case 'courses': return <CoursesScene color={accentColor} />;
      case 'schools': return <SchoolsScene color={accentColor} />;
      case 'events': return <EventsScene color={accentColor} />;
      case 'pricing': return <PricingScene color={accentColor} />;
      case 'about': return <AboutScene color={accentColor} />;
      case 'resources': return <ResourcesScene color={accentColor} />;
      case 'contact': return <ContactScene color={accentColor} />;
      case 'story': return <StoryScene color={accentColor} />;
      case 'faq': return <FaqScene color={accentColor} />;
      default: return <CoursesScene color={accentColor} />;
    }
  })();

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5], fov: 55 }}
      gl={{ antialias: true, alpha: true, depth: false, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
      performance={{ min: 0.5 }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} />
      <directionalLight position={[-3, -2, -3]} intensity={0.5} color="#7C3AED" />
      <pointLight position={[0, 0, 2]} color={accentColor} intensity={1.5} distance={4} />
      <Suspense fallback={null}>
        {scene}
        <Sparkles count={25} scale={8} size={2} speed={0.3} opacity={0.4} color={accentColor} />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}
