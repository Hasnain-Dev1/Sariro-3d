'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { StudioEnvironment } from '@/components/sariro-3d/studio-environment';

/* ===============================================================
   AI NEURAL NETWORK HERO SCENE
   - Floating nodes (spheres) arranged in a brain-like cluster
   - Glowing connections between nearby nodes
   - Data pulses (small bright spheres) travel along connections
   - Whole cluster rotates slowly + reacts to scroll
   - Color: signature blue (#2563EB) + violet (#7C3AED) + green (#16A34A)
=============================================================== */

type NodeT = {
  position: [number, number, number];
  size: number;
  color: string;
};

type EdgeT = {
  from: number;
  to: number;
};

type PulseT = {
  edgeIdx: number;
  progress: number;
  speed: number;
  color: string;
};

function generateNetwork(): { nodes: NodeT[]; edges: EdgeT[] } {
  const nodes: NodeT[] = [];
  const colors = ['#2563EB', '#7C3AED', '#16A34A', '#06B6D4'];

  // Create nodes in a brain-like cluster (two hemispheres)
  for (let i = 0; i < 28; i++) {
    const hemisphere = i < 14 ? -1 : 1;
    const t = (i % 14) / 14;
    const angle = t * Math.PI * 2;
    const r = 1.5 + Math.random() * 1.3;
    const y = (Math.random() - 0.5) * 3;
    nodes.push({
      position: [
        Math.cos(angle) * r * 0.7 + hemisphere * 0.8,
        y,
        Math.sin(angle) * r * 0.8,
      ],
      size: 0.08 + Math.random() * 0.12,
      color: colors[i % colors.length],
    });
  }
  // Add a central "mind" node
  nodes.push({ position: [0, 0, 0], size: 0.22, color: '#2563EB' });

  // Connect nearby nodes
  const edges: EdgeT[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].position[0] - nodes[j].position[0];
      const dy = nodes[i].position[1] - nodes[j].position[1];
      const dz = nodes[i].position[2] - nodes[j].position[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 1.8) {
        edges.push({ from: i, to: j });
      }
    }
  }
  return { nodes, edges };
}

function NeuralNetwork({
  scrollProgress,
}: {
  scrollProgress: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const nodeRefs = useRef<THREE.Mesh[]>([]);
  const lineRefs = useRef<THREE.LineSegments>(null);
  const pulseRefs = useRef<THREE.Mesh[]>([]);

  const { nodes, edges } = useMemo(() => generateNetwork(), []);

  // Build pulse states — each pulse travels along a random edge
  const pulses = useMemo<PulseT[]>(() => {
    const arr: PulseT[] = [];
    const pulseCount = Math.min(12, edges.length);
    const colors = ['#FFFFFF', '#06B6D4', '#16A34A'];
    for (let i = 0; i < pulseCount; i++) {
      arr.push({
        edgeIdx: Math.floor(Math.random() * edges.length),
        progress: Math.random(),
        speed: 0.3 + Math.random() * 0.5,
        color: colors[i % colors.length],
      });
    }
    return arr;
  }, [edges.length]);

  // Pre-compute line geometry positions
  const lineGeometry = useMemo(() => {
    const positions: number[] = [];
    edges.forEach((edge) => {
      const a = nodes[edge.from].position;
      const b = nodes[edge.to].position;
      positions.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [edges, nodes]);

  useFrame((state, delta) => {
    const p = scrollProgress.current;

    // Rotate the whole cluster
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (0.08 + p * 0.1);
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1 + p * 0.15;
    }

    // Pulse nodes (emissive intensity oscillation)
    nodeRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const pulse = 0.4 + Math.sin(state.clock.elapsedTime * 1.5 + i * 0.5) * 0.3;
      mat.emissiveIntensity = pulse;
    });

    // Move pulses along their edges
    pulseRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const pulse = pulses[i];
      pulse.progress += delta * pulse.speed;
      if (pulse.progress > 1) {
        pulse.progress = 0;
        pulse.edgeIdx = Math.floor(Math.random() * edges.length);
      }
      const edge = edges[pulse.edgeIdx];
      const a = nodes[edge.from].position;
      const b = nodes[edge.to].position;
      mesh.position.set(
        a[0] + (b[0] - a[0]) * pulse.progress,
        a[1] + (b[1] - a[1]) * pulse.progress,
        a[2] + (b[2] - a[2]) * pulse.progress,
      );
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.sin(pulse.progress * Math.PI) * 0.9;
    });
  });

  return (
    <group ref={groupRef}>
      {/* Connection lines */}
      <lineSegments ref={lineRefs} geometry={lineGeometry}>
        <lineBasicMaterial color="#2563EB" transparent opacity={0.25} />
      </lineSegments>

      {/* Nodes */}
      {nodes.map((node, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) nodeRefs.current[i] = el;
          }}
          position={node.position}
        >
          <sphereGeometry args={[node.size, 16, 16]} />
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={0.5}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
      ))}

      {/* Data pulses traveling along edges */}
      {pulses.map((pulse, i) => (
        <mesh
          key={`pulse-${i}`}
          ref={(el) => {
            if (el) pulseRefs.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={pulse.color} transparent opacity={0} />
        </mesh>
      ))}

      {/* Central glow point light */}
      <pointLight position={[0, 0, 0]} color="#2563EB" intensity={2} distance={5} />
    </group>
  );
}

/**
 * `lite` is the phone and tablet tier. Three changes, all about fill rate
 * rather than geometry — a phone GPU is bound by pixels shaded, not by the
 * handful of meshes in this scene:
 *
 *   dpr 1              a 3x screen would otherwise shade nine times the pixels
 *   antialias off      MSAA on a 3x buffer is the most expensive setting here
 *   fewer sparkles     each is a transparent quad, and overdraw is what turns
 *                      a smooth scene into a warm phone
 *
 * The network itself is untouched — same nodes, same links, same motion. It is
 * the same design drawn cheaper, not a cut-down version of it.
 */
export default function NeuralNetworkScene({
  scrollProgress,
  lite = false,
}: {
  scrollProgress: React.MutableRefObject<number>;
  lite?: boolean;
}) {
  return (
    <Canvas
      dpr={lite ? 1 : [1, 1.5]}
      camera={{ position: [0, 0, 6], fov: 55 }}
      gl={{ antialias: !lite, alpha: true, depth: false, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
      performance={{ min: 0.5 }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} />
      <directionalLight position={[-3, -2, -3]} intensity={0.5} color="#7C3AED" />

      <NeuralNetwork scrollProgress={scrollProgress} />

      <Sparkles count={lite ? 16 : 40} scale={10} size={2} speed={0.3} opacity={0.5} color="#2563EB" />
      <Sparkles count={lite ? 10 : 20} scale={8} size={3} speed={0.2} opacity={0.3} color="#7C3AED" />
      <Suspense fallback={null}>
        <StudioEnvironment />
      </Suspense>
    </Canvas>
  );
}
