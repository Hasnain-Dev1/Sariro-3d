'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Environment, Float, MeshDistortMaterial } from '@react-three/drei';
import { useRef, Suspense, useEffect } from 'react';
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

type Variant = 'courses' | 'schools' | 'events' | 'pricing' | 'about' | 'resources' | 'contact';

/* ---------- 3D Objects (one per page) ---------- */
function CoursesObject({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.2;
  });
  return (
    <group ref={group}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <Float key={i} speed={1.5} floatIntensity={1} rotationIntensity={0.5}>
            <mesh position={[Math.cos(angle) * 1.5, Math.sin(angle) * 1.5, 0]}>
              <boxGeometry args={[0.3, 0.4, 0.08]} />
              <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} emissive={color} emissiveIntensity={0.15} />
            </mesh>
          </Float>
        );
      })}
      <mesh>
        <icosahedronGeometry args={[0.4, 3]} />
        <MeshDistortMaterial color={color} speed={2} distort={0.3} roughness={0.2} metalness={0.5} />
      </mesh>
    </group>
  );
}

function SchoolsObject({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.15;
  });
  return (
    <group ref={group}>
      <mesh>
        <boxGeometry args={[0.7, 0.9, 0.7]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} emissive={color} emissiveIntensity={0.15} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 1.8, Math.sin(angle) * 0.5, Math.sin(angle) * 1.8]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color={i % 2 === 0 ? color : '#7C3AED'} emissive={i % 2 === 0 ? color : '#7C3AED'} emissiveIntensity={0.3} metalness={0.4} roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

function EventsObject({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.1;
    if (pulse.current) {
      const t = (state.clock.elapsedTime % 2) / 2;
      pulse.current.position.x = -1.5 + t * 3;
      const mat = pulse.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.sin(t * Math.PI) * 0.9;
    }
  });
  return (
    <group ref={group}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 3, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {[-1, 0, 1].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} metalness={0.5} roughness={0.3} />
        </mesh>
      ))}
      <mesh ref={pulse} position={[-1.5, 0, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0} />
      </mesh>
    </group>
  );
}

function PricingObject({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.15;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
  });
  return (
    <group ref={group}>
      {[-1, 0, 1].map((x, i) => (
        <mesh key={i} position={[x, i === 1 ? 0.15 : 0, 0]}>
          <cylinderGeometry args={[0.2, 0.25, 0.8 + (i === 1 ? 0.3 : 0), 6]} />
          <meshStandardMaterial color={i === 1 ? color : '#7C3AED'} metalness={0.6} roughness={0.2} emissive={i === 1 ? color : '#7C3AED'} emissiveIntensity={i === 1 ? 0.3 : 0.15} />
        </mesh>
      ))}
    </group>
  );
}

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

function ResourcesObject({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.08;
  });
  return (
    <group ref={group}>
      {[-1, 0, 1].map((x) =>
        [-1, 0, 1].map((y) => (
          <Float key={`${x}-${y}`} speed={1 + (x + y) * 0.1} floatIntensity={0.6} rotationIntensity={0.3}>
            <mesh position={[x * 1, y * 1, 0]}>
              <icosahedronGeometry args={[0.18, 0]} />
              <meshStandardMaterial color={(x + y) % 2 === 0 ? color : (x + y) % 3 === 0 ? '#7C3AED' : '#16A34A'} metalness={0.4} roughness={0.3} />
            </mesh>
          </Float>
        ))
      )}
    </group>
  );
}

function ContactObject({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  const particles = useRef<THREE.Mesh[]>([]);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.1;
    particles.current.forEach((mesh, i) => {
      if (!mesh) return;
      const t = (state.clock.elapsedTime * 0.4 + i * 0.2) % 1;
      mesh.position.y = -1.5 + t * 3;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.sin(t * Math.PI) * 0.8;
    });
  });
  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[0.4, 3]} />
        <MeshDistortMaterial color={color} speed={2} distort={0.35} roughness={0.2} metalness={0.5} />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) particles.current[i] = el; }}
          position={[(Math.random() - 0.5) * 2, -1.5, (Math.random() - 0.5) * 1.5]}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={i % 2 === 0 ? color : '#FFFFFF'} transparent opacity={0} />
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
