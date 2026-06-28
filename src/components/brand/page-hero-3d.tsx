'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Environment, Float, MeshDistortMaterial } from '@react-three/drei';
import { useRef, useMemo, Suspense } from 'react';
import * as THREE from 'three';

type Variant = 'courses' | 'schools' | 'events' | 'pricing' | 'about' | 'resources' | 'contact' | 'story' | 'faq';

/* ===============================================================
   COURSES: Laptop + Notebook + Pen
=============================================================== */
function CoursesScene({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.12;
  });
  return (
    <group ref={group}>
      {/* Laptop base */}
      <Float speed={0.8} floatIntensity={0.3} rotationIntensity={0.1}>
        <group position={[0, -0.1, 0]} rotation={[0.2, -0.15, 0]}>
          <mesh position={[0, -0.2, 0.25]}>
            <boxGeometry args={[1.5, 0.05, 1.0]} />
            <meshStandardMaterial color="#D1D5DB" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.17, 0.2]}>
            <boxGeometry args={[1.25, 0.005, 0.65]} />
            <meshStandardMaterial color="#374151" metalness={0.3} roughness={0.7} />
          </mesh>
          {/* Screen */}
          <group position={[0, -0.2, -0.25]} rotation={[-1.35, 0, 0]}>
            <mesh position={[0, 0.55, -0.03]}>
              <boxGeometry args={[1.5, 1.05, 0.05]} />
              <meshStandardMaterial color="#C4CAD2" metalness={0.75} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.55, 0.01]}>
              <planeGeometry args={[1.4, 0.95]} />
              <meshStandardMaterial color="#0F172A" metalness={0.3} roughness={0.05} />
            </mesh>
            {/* Colorful cards on screen */}
            <mesh position={[-0.3, 0.6, 0.02]}><planeGeometry args={[0.5, 0.6]} /><meshBasicMaterial color="#14B8A6" transparent opacity={0.8} /></mesh>
            <mesh position={[0.2, 0.7, 0.02]}><planeGeometry args={[0.45, 0.22]} /><meshBasicMaterial color="#7C3AED" transparent opacity={0.7} /></mesh>
            <mesh position={[0.25, 0.42, 0.02]}><planeGeometry args={[0.35, 0.16]} /><meshBasicMaterial color="#F59E0B" transparent opacity={0.6} /></mesh>
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

/* ===============================================================
   SCHOOLS: Graduation cap + FISH swimming (schools of fish pun!)
=============================================================== */
function SchoolsScene({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  const fishRefs = useRef<THREE.Group[]>([]);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.08;
    // Fish swim in figure-8 patterns
    fishRefs.current.forEach((fish, i) => {
      if (!fish) return;
      const t = state.clock.elapsedTime * 0.5 + i * 0.8;
      const radius = 1.5 + i * 0.15;
      fish.position.x = Math.sin(t) * radius;
      fish.position.y = Math.sin(t * 2) * 0.4;
      fish.position.z = Math.cos(t) * radius * 0.7;
      fish.rotation.y = Math.atan2(Math.cos(t) * radius, -Math.sin(t) * radius * 0.7);
      fish.rotation.z = Math.sin(t * 2) * 0.15;
    });
  });

  return (
    <group ref={group}>
      {/* Graduation cap floating in center */}
      <Float speed={1.5} floatIntensity={0.5} rotationIntensity={0.2}>
        <group position={[0, 0.6, 0]}>
          {/* Cap base (flat square) */}
          <mesh rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[0.7, 0.04, 0.7]} />
            <meshStandardMaterial color="#0F172A" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Cap dome */}
          <mesh position={[0, -0.12, 0]}>
            <sphereGeometry args={[0.18, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#1E293B" metalness={0.5} roughness={0.3} />
          </mesh>
          {/* Tassel */}
          <mesh position={[0.28, -0.05, 0.28]}><cylinderGeometry args={[0.01, 0.01, 0.25, 4]} /><meshStandardMaterial color={color} metalness={0.3} roughness={0.4} /></mesh>
          <mesh position={[0.28, -0.2, 0.28]}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} /></mesh>
        </group>
      </Float>

      {/* 5 FISH swimming around (schools of fish = "schools" pun) */}
      {[0, 1, 2, 3, 4].map((i) => {
        const fishColor = [color, '#7C3AED', '#16A34A', '#F59E0B', '#06B6D4'][i];
        return (
          <group
            key={i}
            ref={(el) => { if (el) fishRefs.current[i] = el; }}
            position={[0, 0, 0]}
          >
            {/* Fish body (stretched sphere) */}
            <mesh scale={[1.5, 0.7, 0.5]}>
              <sphereGeometry args={[0.15, 12, 12]} />
              <meshStandardMaterial color={fishColor} metalness={0.4} roughness={0.3} emissive={fishColor} emissiveIntensity={0.15} />
            </mesh>
            {/* Fish tail (cone) */}
            <mesh position={[-0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.08, 0.15, 4]} />
              <meshStandardMaterial color={fishColor} metalness={0.4} roughness={0.3} />
            </mesh>
            {/* Fish eye */}
            <mesh position={[0.12, 0.04, 0.06]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshStandardMaterial color="#000000" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ===============================================================
   EVENTS: Calendar + ROOSTER doing morning call + papers in wind
=============================================================== */
function EventsScene({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  const roosterRef = useRef<THREE.Group>(null);
  const paperRefs = useRef<THREE.Mesh[]>([]);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.1;

    // Rooster bobs head (morning call animation)
    if (roosterRef.current) {
      const t = state.clock.elapsedTime;
      // Head bobs up and down like calling
      roosterRef.current.rotation.z = Math.sin(t * 3) * 0.15;
      roosterRef.current.position.y = 0.3 + Math.abs(Math.sin(t * 3)) * 0.1;
    }

    // Papers fly around in wind patterns
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
      {/* Calendar (flat, tilted) */}
      <Float speed={1} floatIntensity={0.3} rotationIntensity={0.1}>
        <group rotation={[-0.2, 0.2, 0]} position={[0, -0.3, 0]}>
          {/* Calendar page */}
          <mesh><boxGeometry args={[1.1, 0.04, 0.85]} /><meshStandardMaterial color="#FFFFFF" metalness={0.05} roughness={0.4} /></mesh>
          {/* Top binding bar */}
          <mesh position={[0, 0.06, -0.38]}><boxGeometry args={[1.1, 0.06, 0.08]} /><meshStandardMaterial color={color} metalness={0.3} roughness={0.35} emissive={color} emissiveIntensity={0.15} /></mesh>
          {/* Calendar rings */}
          {[-0.3, 0.3].map((x, i) => (
            <mesh key={i} position={[x, 0.1, -0.38]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.06, 0.015, 8, 16]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.2} />
            </mesh>
          ))}
          {/* Date number on calendar */}
          <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.15, 32]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
          </mesh>
        </group>
      </Float>

      {/* ROOSTER doing morning call! */}
      <group ref={roosterRef} position={[0, 0.3, 0.5]}>
        {/* Body (sphere, orange/brown) */}
        <mesh scale={[1, 1.2, 1.3]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#D97706" metalness={0.2} roughness={0.5} />
        </mesh>
        {/* Head (smaller sphere on top) */}
        <mesh position={[0.1, 0.25, 0.1]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#F59E0B" metalness={0.2} roughness={0.5} />
        </mesh>
        {/* Beak (cone, orange) */}
        <mesh position={[0.2, 0.22, 0.1]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.04, 0.1, 8]} />
          <meshStandardMaterial color="#EA580C" metalness={0.3} roughness={0.4} />
        </mesh>
        {/* Comb (red cones on top of head) */}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0.05 + i * 0.05, 0.36, 0.1]}>
            <coneGeometry args={[0.025, 0.06, 6]} />
            <meshStandardMaterial color="#DC2626" metalness={0.2} roughness={0.4} />
          </mesh>
        ))}
        {/* Wattle (small red sphere under beak) */}
        <mesh position={[0.18, 0.12, 0.1]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#DC2626" metalness={0.2} roughness={0.4} />
        </mesh>
        {/* Tail feathers (fanned triangles) */}
        {[-0.3, -0.35, -0.4].map((x, i) => (
          <mesh key={i} position={[-0.2, 0.15 + i * 0.05, 0]} rotation={[0, 0, 0.3 + i * 0.2]}>
            <coneGeometry args={[0.06, 0.25, 4]} />
            <meshStandardMaterial color={i === 0 ? '#16A34A' : i === 1 ? '#2563EB' : '#7C3AED'} metalness={0.3} roughness={0.4} />
          </mesh>
        ))}
        {/* Legs */}
        {[-0.05, 0.05].map((x, i) => (
          <mesh key={i} position={[x, -0.3, 0.05]}>
            <cylinderGeometry args={[0.015, 0.015, 0.15, 6]} />
            <meshStandardMaterial color="#F59E0B" metalness={0.3} roughness={0.4} />
          </mesh>
        ))}
        {/* Eyes */}
        {[-0.01, 0.01].map((z, i) => (
          <mesh key={i} position={[0.16, 0.27, 0.1 + z * 0.06]}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        ))}
      </group>

      {/* Papers flying in wind */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) paperRefs.current[i] = el; }}
          position={[0, 0, 0]}
        >
          <planeGeometry args={[0.2, 0.28]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#FFFFFF' : '#F8FAFC'}
            metalness={0.05}
            roughness={0.5}
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ===============================================================
   PRICING: Coins + PIGGY BANK
=============================================================== */
function PricingScene({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  const piggyRef = useRef<THREE.Group>(null);
  const coinDropRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.1;
    // Piggy gentle bob
    if (piggyRef.current) {
      piggyRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
      piggyRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8) * 0.03;
    }
    // Coin dropping into piggy bank
    if (coinDropRef.current) {
      const t = (state.clock.elapsedTime % 2.5) / 2.5;
      coinDropRef.current.position.y = 0.7 - t * 0.6;
      const mat = coinDropRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = t < 0.8 ? 1 : 1 - (t - 0.8) * 5;
      coinDropRef.current.rotation.x = t * Math.PI * 3;
      coinDropRef.current.rotation.z = t * Math.PI * 2;
    }
  });

  return (
    <group ref={group}>
      {/* PIGGY BANK */}
      <group ref={piggyRef} position={[0, 0, 0]}>
        {/* Body (pink sphere) */}
        <mesh scale={[1.2, 1, 1.1]}>
          <sphereGeometry args={[0.35, 20, 20]} />
          <meshStandardMaterial color="#F9A8D4" metalness={0.15} roughness={0.4} />
        </mesh>
        {/* Snout (cylinder) */}
        <mesh position={[0.38, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.08, 16]} />
          <meshStandardMaterial color="#F472B6" metalness={0.15} roughness={0.4} />
        </mesh>
        {/* Nostrils */}
        {[-0.03, 0.03].map((y, i) => (
          <mesh key={i} position={[0.42, y, 0]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshStandardMaterial color="#831843" />
          </mesh>
        ))}
        {/* Ears (triangles) */}
        {[-0.15, 0.15].map((z, i) => (
          <mesh key={i} position={[0.15, 0.3, z]} rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.06, 0.12, 4]} />
            <meshStandardMaterial color="#F472B6" metalness={0.15} roughness={0.4} />
          </mesh>
        ))}
        {/* Eyes */}
        {[-0.08, 0.08].map((z, i) => (
          <mesh key={i} position={[0.28, 0.12, z]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        ))}
        {/* Coin slot (dark rectangle on top) */}
        <mesh position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.15, 0.03, 0.01]} />
          <meshStandardMaterial color="#1F2937" metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Legs */}
        {[[0.15, 0.15], [0.15, -0.15], [-0.15, 0.15], [-0.15, -0.15]].map(([x, z], i) => (
          <mesh key={i} position={[x, -0.32, z]}>
            <cylinderGeometry args={[0.03, 0.03, 0.1, 6]} />
            <meshStandardMaterial color="#F472B6" metalness={0.15} roughness={0.4} />
          </mesh>
        ))}
        {/* Curly tail */}
        <mesh position={[-0.42, 0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.06, 0.015, 8, 16, Math.PI * 1.5]} />
          <meshStandardMaterial color="#F472B6" metalness={0.15} roughness={0.4} />
        </mesh>
      </group>

      {/* Coin dropping into piggy */}
      <mesh ref={coinDropRef} position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.03, 24]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.15} emissive={color} emissiveIntensity={0.2} transparent opacity={1} />
      </mesh>

      {/* Floating coins around */}
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

/* ===============================================================
   ABOUT: Glowing AI orb + orbiting nodes
=============================================================== */
function AboutScene({ color }: { color: string }) {
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
      <mesh ref={orbRef}>
        <icosahedronGeometry args={[0.6, 3]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh ref={ringRef}>
        <torusGeometry args={[1.2, 0.03, 8, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
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

/* ===============================================================
   RESOURCES: Floating books + papers
=============================================================== */
function ResourcesScene({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.08;
  });
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

/* ===============================================================
   CONTACT: Paper plane + CAT chasing it!
=============================================================== */
function ContactScene({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  const planeRef = useRef<THREE.Group>(null);
  const catRef = useRef<THREE.Group>(null);
  const catLegRefs = useRef<THREE.Mesh[]>([]);
  const trailRefs = useRef<THREE.Mesh[]>([]);

  const getPathPoint = (t: number): [number, number, number] => {
    const x = Math.sin(t) * 2.2;
    const y = Math.sin(t * 1.5) * 0.8 + 0.2;
    const z = Math.cos(t * 0.7) * 0.8;
    return [x, y, z];
  };

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.1;

    const t = state.clock.elapsedTime * 0.4;

    // Paper plane flies the path
    if (planeRef.current) {
      const [px, py, pz] = getPathPoint(t);
      planeRef.current.position.set(px, py, pz);
      const [nx, ny, nz] = getPathPoint(t + 0.01);
      const dx = nx - px, dy = ny - py, dz = nz - pz;
      planeRef.current.rotation.y = Math.atan2(dx, dz);
      planeRef.current.rotation.z = -Math.cos(t) * 0.35;
      planeRef.current.rotation.x = -dy * 0.5;
    }

    // CAT chases the plane (follows with a delay, running)
    if (catRef.current) {
      const catT = t - 0.5; // 0.5 second delay = chasing
      const [cx, cy, cz] = getPathPoint(catT);
      catRef.current.position.set(cx, cy - 0.3, cz);
      const [nx2, ny2, nz2] = getPathPoint(catT + 0.01);
      catRef.current.rotation.y = Math.atan2(nx2 - cx, nz2 - cz);
      // Cat bobs while running
      catRef.current.position.y = (cy - 0.3) + Math.abs(Math.sin(state.clock.elapsedTime * 8)) * 0.05;

      // Legs animate (running)
      catLegRefs.current.forEach((leg, i) => {
        if (!leg) return;
        leg.rotation.x = Math.sin(state.clock.elapsedTime * 8 + i * Math.PI / 2) * 0.5;
      });
    }

    // Trail particles
    trailRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const tt = t - i * 0.04;
      const [tx, ty, tz] = getPathPoint(tt);
      mesh.position.set(tx, ty, tz);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const fade = 1 - i / 20;
      mat.opacity = fade * 0.6;
      mesh.scale.setScalar(fade * 0.6 + 0.05);
    });
  });

  return (
    <group ref={group}>
      {/* PAPER PLANE (simple cone + wings) */}
      <group ref={planeRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.15, 0.5, 4]} />
          <meshStandardMaterial color="#FFFFFF" metalness={0.1} roughness={0.3} flatShading />
        </mesh>
        <mesh>
          <planeGeometry args={[0.6, 0.2]} />
          <meshStandardMaterial color="#F8FAFC" metalness={0.1} roughness={0.3} side={THREE.DoubleSide} flatShading />
        </mesh>
      </group>

      {/* CAT chasing the plane! */}
      <group ref={catRef} position={[0, -0.3, 0]}>
        {/* Body (stretched sphere) */}
        <mesh scale={[1.5, 0.8, 0.7]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#F97316" metalness={0.1} roughness={0.5} />
        </mesh>
        {/* Head (sphere) */}
        <mesh position={[0.3, 0.1, 0]}>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color="#F97316" metalness={0.1} roughness={0.5} />
        </mesh>
        {/* Ears (cones) */}
        {[-0.05, 0.05].map((z, i) => (
          <mesh key={i} position={[0.32, 0.22, z]}>
            <coneGeometry args={[0.04, 0.08, 4]} />
            <meshStandardMaterial color="#F97316" metalness={0.1} roughness={0.5} />
          </mesh>
        ))}
        {/* Inner ears (pink) */}
        {[-0.05, 0.05].map((z, i) => (
          <mesh key={`inner-${i}`} position={[0.33, 0.21, z]}>
            <coneGeometry args={[0.02, 0.05, 4]} />
            <meshStandardMaterial color="#FCA5A5" metalness={0.1} roughness={0.4} />
          </mesh>
        ))}
        {/* Eyes */}
        {[-0.04, 0.04].map((z, i) => (
          <mesh key={`eye-${i}`} position={[0.4, 0.13, z]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        ))}
        {/* Nose */}
        <mesh position={[0.42, 0.07, 0]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshStandardMaterial color="#EC4899" />
        </mesh>
        {/* Tail (curved cylinder) */}
        <mesh position={[-0.3, 0.1, 0]} rotation={[0, 0, 0.8]}>
          <cylinderGeometry args={[0.02, 0.03, 0.3, 8]} />
          <meshStandardMaterial color="#F97316" metalness={0.1} roughness={0.5} />
        </mesh>
        {/* Tail tip (white) */}
        <mesh position={[-0.42, 0.25, 0]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#FFFFFF" metalness={0.1} roughness={0.4} />
        </mesh>
        {/* 4 Legs (animated running) */}
        {[[0.15, 0.08], [0.15, -0.08], [-0.15, 0.08], [-0.15, -0.08]].map(([x, z], i) => (
          <mesh
            key={`leg-${i}`}
            ref={(el) => { if (el) catLegRefs.current[i] = el; }}
            position={[x, -0.12, z]}
          >
            <cylinderGeometry args={[0.02, 0.02, 0.12, 6]} />
            <meshStandardMaterial color="#F97316" metalness={0.1} roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* Trail particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh key={`trail-${i}`} ref={(el) => { if (el) trailRefs.current[i] = el; }}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color={i < 7 ? color : i < 14 ? '#7C3AED' : '#FFFFFF'} transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
}

/* ===============================================================
   STORY: Cosmic open book with glowing star particles
=============================================================== */
function StoryScene({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  const bookRef = useRef<THREE.Group>(null);
  const particleRefs = useRef<THREE.Mesh[]>([]);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.08;
    if (bookRef.current) {
      bookRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4) * 0.05;
    }
    particleRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const t = state.clock.elapsedTime * (0.4 + i * 0.05);
      const r = 1.2 + Math.sin(t * 0.5 + i) * 0.2;
      const angle = (i / 12) * Math.PI * 2 + t * 0.3;
      mesh.position.set(
        Math.cos(angle) * r,
        Math.sin(t + i) * 0.6,
        Math.sin(angle) * r
      );
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 + Math.sin(t * 2 + i) * 0.3;
    });
  });

  return (
    <group ref={group}>
      {/* Open book */}
      <group ref={bookRef} rotation={[0, 0, 0]}>
        {/* Left page */}
        <mesh position={[-0.32, 0, 0]} rotation={[0, -0.35, 0]}>
          <boxGeometry args={[0.6, 0.04, 0.8]} />
          <meshStandardMaterial color="#FFFFFF" metalness={0.1} roughness={0.4} />
        </mesh>
        {/* Right page */}
        <mesh position={[0.32, 0, 0]} rotation={[0, 0.35, 0]}>
          <boxGeometry args={[0.6, 0.04, 0.8]} />
          <meshStandardMaterial color="#FFFFFF" metalness={0.1} roughness={0.4} />
        </mesh>
        {/* Spine */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.06, 0.06, 0.8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} metalness={0.5} roughness={0.3} />
        </mesh>
      </group>

      {/* Glowing central orb (the story spark) */}
      <mesh position={[0, 0.4, 0]}>
        <icosahedronGeometry args={[0.18, 3]} />
        <MeshDistortMaterial color={color} speed={2} distort={0.4} roughness={0.2} metalness={0.5} emissive={color} emissiveIntensity={0.5} />
      </mesh>

      {/* Cosmic star particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) particleRefs.current[i] = el; }}
        >
          <sphereGeometry args={[0.03 + (i % 3) * 0.01, 8, 8]} />
          <meshBasicMaterial
            color={i % 3 === 0 ? color : i % 3 === 1 ? '#FCD34D' : '#FFFFFF'}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ===============================================================
   FAQ: Floating question-mark bubbles bouncing around
=============================================================== */
function FaqScene({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  const bubbleRefs = useRef<THREE.Group[]>([]);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.05;

    // Bubbles float and bob independently
    bubbleRefs.current.forEach((bubble, i) => {
      if (!bubble) return;
      const t = state.clock.elapsedTime * (0.5 + i * 0.1);
      bubble.position.y = Math.sin(t) * 0.4 + (i % 2 === 0 ? 0.3 : -0.2);
      bubble.position.x = Math.cos(t * 0.7 + i) * 0.3;
      bubble.rotation.z = Math.sin(t * 0.5) * 0.1;
    });
  });

  const bubbleColors = [color, '#7C3AED', '#16A34A', '#F59E0B', '#06B6D4', '#EC4899'];

  return (
    <group ref={group}>
      {/* Floating question-mark bubbles (speech bubble shapes) */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        const r = 1.3;
        const c = bubbleColors[i];
        return (
          <group
            key={i}
            ref={(el) => { if (el) bubbleRefs.current[i] = el; }}
            position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]}
          >
            {/* Bubble body (sphere) */}
            <mesh>
              <sphereGeometry args={[0.22 + (i % 3) * 0.05, 16, 16]} />
              <meshStandardMaterial color={c} transparent opacity={0.85} metalness={0.2} roughness={0.3} emissive={c} emissiveIntensity={0.15} />
            </mesh>
            {/* Bubble tail (small cone pointing down) */}
            <mesh position={[0, -0.2, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.06, 0.1, 8]} />
              <meshStandardMaterial color={c} transparent opacity={0.85} metalness={0.2} roughness={0.3} />
            </mesh>
            {/* "?" mark — represented as a small white torus + sphere */}
            <mesh position={[0, 0.05, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.06, 0.015, 8, 16, Math.PI * 1.5]} />
              <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[0.05, -0.05, 0.15]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.3} />
            </mesh>
          </group>
        );
      })}

      {/* Central glowing orb */}
      <mesh>
        <icosahedronGeometry args={[0.3, 3]} />
        <MeshDistortMaterial color={color} speed={2} distort={0.3} roughness={0.2} metalness={0.5} emissive={color} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

/* ---------- Scroll-driven camera that reacts to page scroll ---------- */
function ScrollCamera() {
  useFrame((state) => {
    // Read scrollY as a 0..1 progress based on window scroll
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    const maxScroll = typeof window !== 'undefined' ? document.documentElement.scrollHeight - window.innerHeight : 1;
    const progress = maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0;

    // Camera dollies forward + orbits slightly as you scroll
    const cam = state.camera;
    const targetZ = 5 - progress * 1.5;
    const targetX = Math.sin(progress * Math.PI) * 0.8;
    const targetY = progress * 0.5;

    cam.position.x += (targetX - cam.position.x) * 0.05;
    cam.position.y += (targetY - cam.position.y) * 0.05;
    cam.position.z += (targetZ - cam.position.z) * 0.05;
    cam.lookAt(0, 0, 0);
  });
  return null;
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
        <ScrollCamera />
        {scene}
        <Sparkles count={25} scale={8} size={2} speed={0.3} opacity={0.4} color={accentColor} />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}
