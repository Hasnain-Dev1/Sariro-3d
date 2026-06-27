'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Environment, Float, MeshDistortMaterial } from '@react-three/drei';
import { useRef, Suspense, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/* ===============================================================
   GSAP-POWERED 3D CAMERA SCROLL (Oryzo-style)
   - Uses GSAP ScrollTrigger with scrub for buttery scroll-binding
   - Camera orbits the 3D object as you scroll
   - Works on ANY page hero
   - Smooth inertia via scrub: 1
=============================================================== */

gsap.registerPlugin(ScrollTrigger);

type Variant = 'courses' | 'schools' | 'events' | 'pricing' | 'about' | 'resources' | 'contact' | 'story';

/* ---------- COURSES: premium laptop + notebook + pen (soft 3D style) ---------- */
function CoursesObject({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.12;
    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.7 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group ref={group}>
      {/* ===== LAPTOP (clear clamshell, screen facing camera) ===== */}
      <Float speed={0.8} floatIntensity={0.3} rotationIntensity={0.1}>
        <group position={[0, -0.1, 0]} rotation={[0.2, -0.15, 0]}>
          {/* --- Base (keyboard deck, flat) --- */}
          <mesh position={[0, -0.2, 0.25]}>
            <boxGeometry args={[1.5, 0.05, 1.0]} />
            <meshStandardMaterial color="#D1D5DB" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Keyboard inset */}
          <mesh position={[0, -0.17, 0.2]}>
            <boxGeometry args={[1.25, 0.005, 0.65]} />
            <meshStandardMaterial color="#374151" metalness={0.3} roughness={0.7} />
          </mesh>
          {/* Trackpad */}
          <mesh position={[0, -0.17, 0.55]}>
            <boxGeometry args={[0.45, 0.005, 0.22]} />
            <meshStandardMaterial color="#4B5563" metalness={0.2} roughness={0.6} />
          </mesh>

          {/* --- Screen (hinged at back, tilted toward camera ~80°) --- */}
          <group position={[0, -0.2, -0.25]} rotation={[-1.35, 0, 0]}>
            {/* Screen back (silver) */}
            <mesh position={[0, 0.55, -0.03]}>
              <boxGeometry args={[1.5, 1.05, 0.05]} />
              <meshStandardMaterial color="#C4CAD2" metalness={0.75} roughness={0.25} />
            </mesh>
            {/* Screen display (dark glossy, FACING CAMERA) */}
            <mesh position={[0, 0.55, 0.01]}>
              <planeGeometry args={[1.4, 0.95]} />
              <meshStandardMaterial color="#0F172A" metalness={0.3} roughness={0.05} />
            </mesh>
            {/* Colorful UI cards on screen */}
            <mesh ref={screenRef} position={[-0.3, 0.6, 0.02]}>
              <planeGeometry args={[0.5, 0.6]} />
              <meshBasicMaterial color="#14B8A6" transparent opacity={0.8} />
            </mesh>
            <mesh position={[0.2, 0.7, 0.02]}>
              <planeGeometry args={[0.45, 0.22]} />
              <meshBasicMaterial color="#7C3AED" transparent opacity={0.7} />
            </mesh>
            <mesh position={[0.25, 0.42, 0.02]}>
              <planeGeometry args={[0.35, 0.16]} />
              <meshBasicMaterial color="#F59E0B" transparent opacity={0.6} />
            </mesh>
            <mesh position={[0.4, 0.85, 0.02]}>
              <planeGeometry args={[0.2, 0.1]} />
              <meshBasicMaterial color="#22C55E" transparent opacity={0.55} />
            </mesh>
            {/* Notch */}
            <mesh position={[0, 1.02, 0.03]}>
              <boxGeometry args={[0.18, 0.035, 0.01]} />
              <meshStandardMaterial color="#111827" />
            </mesh>
          </group>
        </group>
      </Float>

      {/* ===== NOTEBOOK (repositioned — clearly separate from laptop, bigger) ===== */}
      <Float speed={1.3} floatIntensity={0.4} rotationIntensity={0.2}>
        <group position={[1.35, 0.25, 0]} rotation={[-0.2, -0.6, 0.12]}>
          {/* Book body — single clean box */}
          <mesh>
            <boxGeometry args={[0.8, 0.15, 1.05]} />
            <meshStandardMaterial color="#14B8A6" metalness={0.3} roughness={0.4} />
          </mesh>
          {/* Page strip on the right (white edge, clearly visible) */}
          <mesh position={[0.41, 0, 0]}>
            <boxGeometry args={[0.04, 0.13, 1.03]} />
            <meshStandardMaterial color="#FFFFFF" metalness={0.05} roughness={0.5} />
          </mesh>
          {/* Page strip on the bottom */}
          <mesh position={[0, -0.08, 0]}>
            <boxGeometry args={[0.78, 0.02, 1.03]} />
            <meshStandardMaterial color="#F8FAFC" metalness={0.05} roughness={0.5} />
          </mesh>
          {/* Spine (left edge) */}
          <mesh position={[-0.41, 0, 0]}>
            <boxGeometry args={[0.025, 0.15, 1.05]} />
            <meshStandardMaterial color="#0F766E" metalness={0.3} roughness={0.4} />
          </mesh>
          {/* Bookmark ribbon */}
          <mesh position={[0.15, -0.25, 0.35]}>
            <boxGeometry args={[0.08, 0.35, 0.02]} />
            <meshStandardMaterial color="#F43F5E" metalness={0.2} roughness={0.3} />
          </mesh>
          {/* Cover emblem (lighter circle on cover) */}
          <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.18, 32]} />
            <meshStandardMaterial color="#0D9488" metalness={0.35} roughness={0.35} />
          </mesh>
        </group>
      </Float>

      {/* ===== PEN (teal/white/gold — already correct, keeping as-is) ===== */}
      <Float speed={1.8} floatIntensity={0.4} rotationIntensity={0.3}>
        <group position={[-1.1, 0.3, 0.2]} rotation={[0, 0, 0.6]}>
          {/* Lower barrel (teal) */}
          <mesh position={[0, -0.25, 0]}>
            <cylinderGeometry args={[0.05, 0.045, 0.4, 16]} />
            <meshStandardMaterial color="#14B8A6" metalness={0.5} roughness={0.3} />
          </mesh>
          {/* Middle barrel (white) */}
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.25, 16]} />
            <meshStandardMaterial color="#FFFFFF" metalness={0.2} roughness={0.25} />
          </mesh>
          {/* Gold band */}
          <mesh position={[0, 0.19, 0]}>
            <cylinderGeometry args={[0.052, 0.052, 0.03, 16]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Upper cap (teal) */}
          <mesh position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.048, 0.05, 0.15, 16]} />
            <meshStandardMaterial color="#14B8A6" metalness={0.5} roughness={0.3} />
          </mesh>
          {/* Gold tip (top) */}
          <mesh position={[0, 0.42, 0]}>
            <sphereGeometry args={[0.025, 12, 12]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Gold tip (writing end) */}
          <mesh position={[0, -0.48, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.035, 0.08, 12]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.15} />
          </mesh>
          {/* Gold clip */}
          <mesh position={[0.06, 0.1, 0]}>
            <boxGeometry args={[0.015, 0.15, 0.04]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>
      </Float>
    </group>
  );
}

/* ---------- SCHOOLS: graduation cap + orbiting student spheres ---------- */
function SchoolsObject({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  const capRef = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.12;
    if (capRef.current) {
      capRef.current.position.y = 0.6 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }
  });
  return (
    <group ref={group}>
      {/* Graduation cap (mortarboard) floating above */}
      <Float speed={1.5} floatIntensity={0.5} rotationIntensity={0.2}>
        <group ref={capRef} position={[0, 0.6, 0]}>
          {/* Cap base (flat square) */}
          <mesh rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[0.7, 0.04, 0.7]} />
            <meshStandardMaterial color="#0F172A" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Cap dome (under the flat part) */}
          <mesh position={[0, -0.12, 0]}>
            <sphereGeometry args={[0.18, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#1E293B" metalness={0.5} roughness={0.3} />
          </mesh>
          {/* Tassel (cylinder + sphere) */}
          <mesh position={[0.28, -0.05, 0.28]}>
            <cylinderGeometry args={[0.01, 0.01, 0.25, 4]} />
            <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
          </mesh>
          <mesh position={[0.28, -0.2, 0.28]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} metalness={0.3} roughness={0.4} />
          </mesh>
        </group>
      </Float>
      {/* Orbiting student spheres */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <Float key={i} speed={1 + i * 0.2} floatIntensity={0.4} rotationIntensity={0.2}>
            <mesh position={[Math.cos(angle) * 1.6, Math.sin(angle * 2) * 0.3 - 0.3, Math.sin(angle) * 1.6]}>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial color={i % 3 === 0 ? color : i % 3 === 1 ? '#7C3AED' : '#16A34A'} emissive={i % 3 === 0 ? color : i % 3 === 1 ? '#7C3AED' : '#16A34A'} emissiveIntensity={0.25} metalness={0.4} roughness={0.3} />
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

/* ---------- EVENTS: floating calendar + pulsing event markers ---------- */
function EventsObject({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  const markerRefs = useRef<THREE.Mesh[]>([]);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.1;
    markerRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + i * 0.8) * 0.2;
      mesh.scale.setScalar(pulse);
    });
  });
  return (
    <group ref={group}>
      {/* Calendar/book (flat tilted plane = calendar page) */}
      <Float speed={1} floatIntensity={0.3} rotationIntensity={0.1}>
        <mesh rotation={[-0.3, 0.2, 0]} position={[0, 0.1, 0]}>
          <boxGeometry args={[1.1, 0.04, 0.85]} />
          <meshStandardMaterial color="#FFFFFF" metalness={0.05} roughness={0.4} />
        </mesh>
        {/* Calendar top binding (colored bar) */}
        <mesh position={[0, 0.06, -0.38]} rotation={[-0.3, 0.2, 0]}>
          <boxGeometry args={[1.1, 0.06, 0.08]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.35} emissive={color} emissiveIntensity={0.15} />
        </mesh>
        {/* Calendar rings (2 rings at top) */}
        {[-0.3, 0.3].map((x, i) => (
          <mesh key={i} position={[x, 0.1, -0.38]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.06, 0.015, 8, 16]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
      </Float>
      {/* Event marker dots floating above calendar */}
      {[
        { x: -0.35, y: 0.4, z: 0.1, c: color },
        { x: 0, y: 0.5, z: 0.15, c: '#7C3AED' },
        { x: 0.35, y: 0.35, z: 0.05, c: '#16A34A' },
      ].map((m, i) => (
        <Float key={i} speed={1.5 + i * 0.3} floatIntensity={0.3} rotationIntensity={0.2}>
          <mesh ref={(el) => { if (el) markerRefs.current[i] = el; }} position={[m.x, m.y, m.z]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color={m.c} emissive={m.c} emissiveIntensity={0.4} metalness={0.5} roughness={0.25} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

/* ---------- PRICING: floating coins/tokens with sparkle ---------- */
function PricingObject({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  const coinRefs = useRef<THREE.Mesh[]>([]);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.12;
    coinRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.rotation.y += delta * (1 + i * 0.3);
      mesh.position.y = Math.sin(state.clock.elapsedTime * 1.2 + i * 0.8) * 0.15 + (i === 1 ? 0.2 : 0);
    });
  });
  return (
    <group ref={group}>
      {/* 3 floating coins (cylinders, like tokens) */}
      {[-0.8, 0, 0.8].map((x, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) coinRefs.current[i] = el; }}
          position={[x, i === 1 ? 0.2 : 0, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.3 + (i === 1 ? 0.08 : 0), 0.3 + (i === 1 ? 0.08 : 0), 0.06, 32]} />
          <meshStandardMaterial
            color={i === 1 ? color : i === 0 ? '#94A3B8' : '#7C3AED'}
            metalness={0.9}
            roughness={0.15}
            emissive={i === 1 ? color : i === 0 ? '#94A3B8' : '#7C3AED'}
            emissiveIntensity={i === 1 ? 0.2 : 0.1}
          />
        </mesh>
      ))}
      {/* Sparkle on the center (popular) coin */}
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

/* ---------- ABOUT: glowing AI orb + orbiting nodes ---------- */
function AboutObject({ color }: { color: string }) {
  const orbRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (!orbRef.current) return;
    orbRef.current.rotation.y += delta * 0.3;
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.4;
      ringRef.current.rotation.x = Math.PI / 3;
    }
  });
  return (
    <group>
      {/* Central glowing orb */}
      <mesh ref={orbRef}>
        <icosahedronGeometry args={[0.6, 3]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Orbiting ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[1.2, 0.03, 8, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      {/* Small orbiting nodes */}
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

/* ---------- RESOURCES: floating books + documents ---------- */
function ResourcesObject({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.08;
  });
  return (
    <group ref={group}>
      {/* Stacked books */}
      {[-0.5, 0, 0.5].map((y, i) => (
        <Float key={`book-${i}`} speed={1 + i * 0.3} floatIntensity={0.4} rotationIntensity={0.2}>
          <mesh position={[0, y * 0.6, 0]} rotation={[0, i * 0.3, 0.05]}>
            <boxGeometry args={[0.7 - i * 0.05, 0.12, 0.5]} />
            <meshStandardMaterial
              color={i === 0 ? color : i === 1 ? '#7C3AED' : '#16A34A'}
              metalness={0.3}
              roughness={0.5}
              emissive={i === 0 ? color : i === 1 ? '#7C3AED' : '#16A34A'}
              emissiveIntensity={0.1}
            />
          </mesh>
        </Float>
      ))}
      {/* Floating papers/documents */}
      <Float speed={1.5} floatIntensity={0.6} rotationIntensity={0.4}>
        <mesh position={[1, 0.3, 0.2]} rotation={[0.2, 0.5, 0.1]}>
          <planeGeometry args={[0.4, 0.55]} />
          <meshStandardMaterial color="#FFFFFF" metalness={0.05} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
      </Float>
      <Float speed={1.8} floatIntensity={0.5} rotationIntensity={0.3}>
        <mesh position={[-0.9, 0.5, -0.2]} rotation={[-0.1, -0.4, 0.15]}>
          <planeGeometry args={[0.35, 0.45]} />
          <meshStandardMaterial color="#F8FAFC" metalness={0.05} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
      </Float>
      {/* Small download icon orb */}
      <Float speed={2} floatIntensity={0.8} rotationIntensity={0.5}>
        <mesh position={[0.8, -0.5, 0.4]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={0.5} metalness={0.5} roughness={0.2} />
        </mesh>
      </Float>
    </group>
  );
}

/* ---------- Paper plane geometry builder ---------- */
function createPaperPlaneGeometry(): THREE.BufferGeometry {
  // Realistic folded paper airplane — V-shaped wings, pointed nose, keel
  // Vertices: nose, leftWingTip, rightWingTip, spine, leftKeel, rightKeel, tailTop
  const vertices = new Float32Array([
    // Nose (front point)
    0,    0,     0.6,    // 0: nose
    // Wing tips (angled up slightly = dihedral)
    -0.7, 0.06, -0.35,   // 1: left wing tip
     0.7, 0.06, -0.35,   // 2: right wing tip
    // Center spine (back center, slightly below wing root)
     0,   0.0,  -0.35,   // 3: spine back
    // Keel (bottom V-fold — gives the plane body)
    -0.08, -0.18, -0.2,  // 4: left keel
     0.08, -0.18, -0.2,  // 5: right keel
     0,   -0.18,  0.3,   // 6: keel nose (under the nose)
    // Tail fin
     0,    0.2,  -0.35,  // 7: tail top
  ]);

  const indices = [
    // Left wing (top face — nose to left tip to spine)
    0, 1, 3,
    // Right wing (top face — nose to spine to right tip)
    0, 3, 2,
    // Left wing bottom (nose to keel-nose to left keel to left tip)
    0, 6, 4,  // left wing underside front
    4, 1, 0,  // left wing underside back
    // Right wing bottom
    0, 5, 6,  // right wing underside front
    0, 2, 5,  // right wing underside back
    // Keel (bottom V — left keel to right keel to keel nose)
    4, 6, 5,
    // Keel back (left keel to spine to right keel)
    4, 5, 3,
    // Tail fin (left)
    3, 7, 1,
    // Tail fin (right)
    3, 2, 7,
  ];

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/* ---------- CONTACT: paper plane flying around the hero with trail ---------- */
function ContactObject({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  const planeRef = useRef<THREE.Group>(null);
  const trailRefs = useRef<THREE.Mesh[]>([]);

  // Pre-build the plane geometry once
  const planeGeo = useMemo(() => createPaperPlaneGeometry(), []);

  // Flight path function — wide, sweeping path that covers the hero area
  const getPathPoint = (t: number): [number, number, number] => {
    // Lissajous-like figure — sweeps wide horizontally, dips vertically
    const x = Math.sin(t) * 2.2;
    const y = Math.sin(t * 1.5) * 0.8 + 0.2;
    const z = Math.cos(t * 0.7) * 0.8;
    return [x, y, z];
  };

  useFrame((state, delta) => {
    if (!group.current) return;
    // Gentle group sway — not full rotation
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.15;

    const t = state.clock.elapsedTime * 0.4;

    // Paper plane flies the wide path
    if (planeRef.current) {
      const [px, py, pz] = getPathPoint(t);
      planeRef.current.position.set(px, py, pz);

      // Calculate heading from velocity (derivative)
      const dt = 0.01;
      const [nx, ny, nz] = getPathPoint(t + dt);
      const dx = nx - px;
      const dy = ny - py;
      const dz = nz - pz;

      // Face direction of travel
      const heading = Math.atan2(dx, dz);
      planeRef.current.rotation.y = heading;

      // Bank into turns (roll based on horizontal curvature)
      const turnRate = Math.cos(t) * 0.5 + Math.cos(t * 1.5) * 0.3;
      planeRef.current.rotation.z = -turnRate * 0.4;

      // Pitch up/down based on vertical velocity
      planeRef.current.rotation.x = -dy * 0.5;
    }

    // Trail — 30 particles following the flight path (longer, more visible)
    trailRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const lag = i * 0.04;
      const tt = t - lag;
      const [tx, ty, tz] = getPathPoint(tt);
      mesh.position.set(tx, ty, tz);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const fade = 1 - i / 30;
      mat.opacity = fade * 0.7;
      mesh.scale.setScalar(fade * 0.6 + 0.05);
    });
  });

  return (
    <group ref={group}>
      {/* Paper plane — proper folded geometry, flying the path */}
      <group ref={planeRef}>
        <mesh geometry={planeGeo}>
          <meshStandardMaterial
            color="#FFFFFF"
            metalness={0.15}
            roughness={0.35}
            emissive={color}
            emissiveIntensity={0.08}
            side={THREE.DoubleSide}
            flatShading
          />
        </mesh>
        {/* Center fold line */}
        <mesh position={[0, 0.005, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.015, 0.9]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} />
        </mesh>
      </group>

      {/* Trail — 30 fading particles (longer trail like the SVG) */}
      {Array.from({ length: 30 }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) trailRefs.current[i] = el; }}
        >
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshBasicMaterial
            color={i < 10 ? color : i < 20 ? '#7C3AED' : '#FFFFFF'}
            transparent
            opacity={0}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- GSAP Camera Controller ---------- */
function GSAPCameraController({ triggerRef }: { triggerRef: React.RefObject<HTMLElement> }) {
  const cameraOrbit = useRef({ angle: 0, radius: 5, y: 0 });

  useEffect(() => {
    if (!triggerRef.current) return;
    const ctx = gsap.context(() => {
      // GSAP ScrollTrigger — the REAL Oryzo scrub
      gsap.to(cameraOrbit.current, {
        angle: Math.PI * 2, // full 360° orbit
        radius: 4, // zoom in slightly
        y: 1, // tilt up
        ease: 'none',
        scrollTrigger: {
          trigger: triggerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1, // 1-second smooth dampening
        },
      });
    }, triggerRef);

    return () => ctx.revert();
  }, [triggerRef]);

  useFrame((state) => {
    const { angle, radius, y } = cameraOrbit.current;
    state.camera.position.x = Math.sin(angle) * radius;
    state.camera.position.z = Math.cos(angle) * radius;
    state.camera.position.y = y;
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ---------- Main Component ---------- */
export default function GSAPHero3D({
  variant,
  accentColor = '#2563EB',
  triggerRef,
}: {
  variant: Variant;
  accentColor?: string;
  triggerRef: React.RefObject<HTMLElement>;
}) {
  const scene = (() => {
    switch (variant) {
      case 'courses': return <CoursesObject color={accentColor} />;
      case 'schools': return <SchoolsObject color={accentColor} />;
      case 'events': return <EventsObject color={accentColor} />;
      case 'pricing': return <PricingObject color={accentColor} />;
      case 'about': return <AboutObject color={accentColor} />;
      case 'resources': return <ResourcesObject color={accentColor} />;
      case 'contact': return <ContactObject color={accentColor} />;
      case 'story': return <AboutObject color={accentColor} />;
      default: return <CoursesObject color={accentColor} />;
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
        <GSAPCameraController triggerRef={triggerRef} />
        {scene}
        <Sparkles count={25} scale={8} size={2} speed={0.3} opacity={0.4} color={accentColor} />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}
