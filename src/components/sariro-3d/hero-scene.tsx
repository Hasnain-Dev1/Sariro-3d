'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Environment, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

/* -----------------------------------------------------------
   3D HERO SCENE — scroll-reactive
   The whole scene reacts to scrollProgress (0..1):
   - Camera dollies forward (z: 7 → 3.5)
   - Camera tilts up slightly
   - Torus knot scales up + spins faster
   - Orbs drift outward
   - Sparkles disperse
   - Whole group rotates slightly
----------------------------------------------------------- */

function ScrollReactiveScene({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const knotRef = useRef<THREE.Mesh>(null);
  const orb1Ref = useRef<THREE.Mesh>(null);
  const orb2Ref = useRef<THREE.Mesh>(null);
  const orb3Ref = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const p = scrollProgress.current; // 0..1
    const cam = state.camera;

    // Camera dolly forward + slight tilt (using lerp on camera position via a ref-tracked target)
    const targetZ = 7 - p * 3.5;
    const targetY = p * 0.5;
    cam.position.z = THREE.MathUtils.lerp(cam.position.z, targetZ, 0.08);
    cam.position.y = THREE.MathUtils.lerp(cam.position.y, targetY, 0.08);
    cam.lookAt(0, 0, 0);

    // Whole group rotates with scroll
    if (groupRef.current) {
      groupRef.current.rotation.y = p * 0.6;
      groupRef.current.rotation.x = p * 0.2;
    }

    // Torus knot scales + spins faster with scroll
    if (knotRef.current) {
      const targetScale = 1 + p * 0.4;
      knotRef.current.scale.setScalar(targetScale);
      knotRef.current.rotation.x += delta * (0.15 + p * 0.5);
      knotRef.current.rotation.y += delta * (0.2 + p * 0.6);
    }

    // Orbs drift outward with scroll
    const drift = p * 0.8;
    if (orb1Ref.current) {
      orb1Ref.current.position.x = 2.8 + drift;
      orb1Ref.current.position.y = 1.1 + Math.sin(state.clock.elapsedTime * 1.1) * 0.25 + drift * 0.3;
    }
    if (orb2Ref.current) {
      orb2Ref.current.position.x = -2.9 - drift;
      orb2Ref.current.position.y = -0.6 + Math.sin(state.clock.elapsedTime * 0.9) * 0.25 - drift * 0.2;
    }
    if (orb3Ref.current) {
      orb3Ref.current.position.x = -2.4 - drift * 0.7;
      orb3Ref.current.position.y = 1.6 + Math.sin(state.clock.elapsedTime * 1.3) * 0.25 + drift * 0.4;
    }

    // Particles rotate faster
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * (0.1 + p * 0.4);
      particlesRef.current.rotation.z = p * 0.3;
    }
  });

  const orbPositions = useMemo(() => {
    const arr: [number, number, number][] = [];
    const count = 14;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 3.2 + Math.random() * 0.6;
      const y = (Math.random() - 0.5) * 2;
      arr.push([Math.cos(angle) * radius, y, Math.sin(angle) * radius]);
    }
    return arr;
  }, []);

  const colors = ['#16A34A', '#7C3AED', '#F59E0B', '#06B6D4', '#2563EB'];

  return (
    <group ref={groupRef}>
      {/* Central torus knot */}
      <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.8}>
        <mesh ref={knotRef}>
          <torusKnotGeometry args={[1, 0.32, 128, 16]} />
          <meshStandardMaterial
            color="#2563EB"
            metalness={0.65}
            roughness={0.18}
            emissive="#1D4ED8"
            emissiveIntensity={0.18}
          />
        </mesh>
      </Float>

      {/* Distorted orbs */}
      <Float speed={1.2} floatIntensity={1.2} rotationIntensity={0.6}>
        <mesh ref={orb1Ref} position={[2.8, 1.1, -1]} scale={0.9}>
          <icosahedronGeometry args={[0.6, 4]} />
          <MeshDistortMaterial color="#7C3AED" speed={2} distort={0.35} roughness={0.2} metalness={0.5} />
        </mesh>
      </Float>
      <Float speed={1.5} floatIntensity={1.4} rotationIntensity={0.5}>
        <mesh ref={orb2Ref} position={[-2.9, -0.6, -0.5]} scale={0.7}>
          <icosahedronGeometry args={[0.6, 4]} />
          <MeshDistortMaterial color="#16A34A" speed={2} distort={0.35} roughness={0.2} metalness={0.5} />
        </mesh>
      </Float>
      <Float speed={1.0} floatIntensity={1.0} rotationIntensity={0.4}>
        <mesh ref={orb3Ref} position={[-2.4, 1.6, -1.8]} scale={0.55}>
          <icosahedronGeometry args={[0.6, 4]} />
          <MeshDistortMaterial color="#F59E0B" speed={2} distort={0.35} roughness={0.2} metalness={0.5} />
        </mesh>
      </Float>

      {/* Floating cubes (self-rotating) */}
      <FloatingCube position={[2.4, -1.6, 0.5]} color="#2563EB" size={0.5} speed={0.8} />
      <FloatingCube position={[-3.1, 0.4, 1.2]} color="#06B6D4" size={0.4} speed={1.1} />
      <FloatingCube position={[1.4, 2.2, -1.5]} color="#16A34A" size={0.35} speed={1.4} />

      {/* Orbiting particle ring */}
      <group ref={particlesRef}>
        {orbPositions.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.08 + Math.random() * 0.06, 16, 16]} />
            <meshStandardMaterial
              color={colors[i % colors.length]}
              emissive={colors[i % colors.length]}
              emissiveIntensity={0.6}
              metalness={0.4}
              roughness={0.3}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function FloatingCube({
  position,
  color,
  size = 0.4,
  speed = 1,
}: {
  position: [number, number, number];
  color: string;
  size?: number;
  speed?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * 0.5 * speed;
    ref.current.rotation.z += delta * 0.3 * speed;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.3;
  });
  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial
        color={color}
        metalness={0.7}
        roughness={0.25}
        emissive={color}
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}

export default function HeroScene3D({
  scrollProgress,
}: {
  scrollProgress: React.MutableRefObject<number>;
}) {
  return (
    <Canvas
      shadows={false}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 7], fov: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', depth: false }}
      style={{ background: 'transparent' }}
      performance={{ min: 0.5 }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.4}
      />
      <directionalLight position={[-5, -3, -5]} intensity={0.5} color="#7C3AED" />
      <pointLight position={[0, -3, 4]} intensity={0.8} color="#16A34A" />

      <ScrollReactiveScene scrollProgress={scrollProgress} />

      <Sparkles count={30} scale={10} size={2} speed={0.4} opacity={0.6} color="#2563EB" />
      <Sparkles count={20} scale={8} size={3} speed={0.3} opacity={0.4} color="#7C3AED" />

      <Environment preset="city" />
    </Canvas>
  );
}
