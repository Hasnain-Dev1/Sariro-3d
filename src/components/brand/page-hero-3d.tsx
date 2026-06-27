'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Environment, Float, MeshDistortMaterial } from '@react-three/drei';
import { useRef, useMemo, Suspense } from 'react';
import * as THREE from 'three';

/* ===============================================================
   PAGE HERO 3D — Reusable 3D scene for EVERY inner page hero.
   Each page passes a "variant" prop → unique 3D identity.
   Shares ONE Canvas (perf-friendly), only renders when in view.
=============================================================== */

type Variant = 'courses' | 'schools' | 'events' | 'pricing' | 'about' | 'resources' | 'contact';

/* ---------- COURSES variant: floating 3D book/cube shapes ---------- */
function CoursesScene({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.15;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
  });
  const shapes = useMemo(() => {
    const arr: { pos: [number, number, number]; size: number; type: 'box' | 'octa' }[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 1.8;
      arr.push({
        pos: [Math.cos(angle) * r, Math.sin(angle) * r * 0.5, (Math.random() - 0.5) * 2],
        size: 0.25 + Math.random() * 0.2,
        type: i % 2 === 0 ? 'box' : 'octa',
      });
    }
    return arr;
  }, []);
  return (
    <group ref={group}>
      {shapes.map((s, i) => (
        <Float key={i} speed={1.5} floatIntensity={1.5} rotationIntensity={1}>
          <mesh position={s.pos}>
            {s.type === 'box' ? <boxGeometry args={[s.size, s.size * 1.3, s.size * 0.3]} /> : <octahedronGeometry args={[s.size]} />}
            <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} emissive={color} emissiveIntensity={0.2} />
          </mesh>
        </Float>
      ))}
      {/* Central distorted orb */}
      <mesh>
        <icosahedronGeometry args={[0.5, 3]} />
        <MeshDistortMaterial color={color} speed={2} distort={0.3} roughness={0.2} metalness={0.5} />
      </mesh>
    </group>
  );
}

/* ---------- SCHOOLS variant: orbiting campus spheres ---------- */
function SchoolsScene({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.2;
  });
  const orbits = useMemo(() => {
    const arr: { pos: [number, number, number]; size: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      arr.push({
        pos: [Math.cos(angle) * 2, 0, Math.sin(angle) * 2],
        size: 0.2 + Math.random() * 0.15,
      });
    }
    return arr;
  }, []);
  return (
    <group ref={group}>
      {/* Central campus */}
      <mesh>
        <boxGeometry args={[0.6, 0.8, 0.6]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} emissive={color} emissiveIntensity={0.15} />
      </mesh>
      {/* Orbiting nodes */}
      {orbits.map((o, i) => (
        <Float key={i} speed={2} floatIntensity={1} rotationIntensity={0.5}>
          <mesh position={o.pos}>
            <sphereGeometry args={[o.size, 16, 16]} />
            <meshStandardMaterial color={i % 2 === 0 ? color : '#7C3AED'} metalness={0.4} roughness={0.3} emissive={i % 2 === 0 ? color : '#7C3AED'} emissiveIntensity={0.3} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

/* ---------- EVENTS variant: 3D timeline with pulses ---------- */
function EventsScene({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.1;
    if (pulseRef.current) {
      const t = (state.clock.elapsedTime % 3) / 3;
      pulseRef.current.position.x = -2 + t * 4;
      const mat = pulseRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.sin(t * Math.PI);
    }
  });
  return (
    <group ref={group}>
      {/* Timeline bar */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 4, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {/* Event nodes on timeline */}
      {[-1.5, 0, 1.5].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} metalness={0.5} roughness={0.3} />
        </mesh>
      ))}
      {/* Traveling pulse */}
      <mesh ref={pulseRef} position={[-2, 0, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0} />
      </mesh>
    </group>
  );
}

/* ---------- PRICING variant: 3D pillars ---------- */
function PricingScene({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.12;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
  });
  return (
    <group ref={group}>
      {[-1.2, 0, 1.2].map((x, i) => (
        <mesh key={i} position={[x, i === 1 ? 0.2 : 0, 0]}>
          <cylinderGeometry args={[0.25, 0.3, 1 + (i === 1 ? 0.4 : 0), 6]} />
          <meshStandardMaterial color={i === 1 ? color : '#7C3AED'} metalness={0.6} roughness={0.2} emissive={i === 1 ? color : '#7C3AED'} emissiveIntensity={i === 1 ? 0.3 : 0.15} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- ABOUT variant: glowing AI orb with orbiting ring + nodes ---------- */
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

/* ---------- RESOURCES variant: 3D grid of floating shapes ---------- */
function ResourcesScene({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.08;
  });
  const grid = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        arr.push([x * 1.2, y * 1.2, (Math.random() - 0.5) * 1]);
      }
    }
    return arr;
  }, []);
  return (
    <group ref={group}>
      {grid.map((pos, i) => (
        <Float key={i} speed={1 + i * 0.1} floatIntensity={0.8} rotationIntensity={0.5}>
          <mesh position={pos}>
            <icosahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial color={i % 3 === 0 ? color : i % 3 === 1 ? '#7C3AED' : '#16A34A'} metalness={0.4} roughness={0.3} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

/* ---------- CONTACT variant: message particles flowing ---------- */
function ContactScene({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Mesh[]>([]);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.1;
    particlesRef.current.forEach((mesh, i) => {
      if (!mesh) return;
      const t = (state.clock.elapsedTime * 0.5 + i * 0.3) % 1;
      mesh.position.y = -2 + t * 4;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.sin(t * Math.PI) * 0.8;
    });
  });
  const positions = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < 10; i++) {
      arr.push([(Math.random() - 0.5) * 2.5, 0, (Math.random() - 0.5) * 2]);
    }
    return arr;
  }, []);
  return (
    <group ref={group}>
      {/* Central message orb */}
      <mesh>
        <icosahedronGeometry args={[0.5, 3]} />
        <MeshDistortMaterial color={color} speed={2} distort={0.35} roughness={0.2} metalness={0.5} />
      </mesh>
      {/* Rising message particles */}
      {positions.map((pos, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) particlesRef.current[i] = el; }}
          position={[pos[0], -2, pos[2]]}
        >
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color={i % 2 === 0 ? color : '#FFFFFF'} transparent opacity={0} />
        </mesh>
      ))}
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
