#!/usr/bin/env python3
"""Surgically replace ContactScene in page-hero-3d.tsx with a new
realistic version, add StoryScene + FaqScene, and update the Variant
type union + main switch statement."""

import re
from pathlib import Path

FILE = Path('/home/z/my-project/src/components/brand/page-hero-3d.tsx')
src = FILE.read_text()

# ---- 1. Replace ContactScene wholesale ----
contact_pattern = re.compile(
    r'/\* ---------- CONTACT:.*?\n\}\n\n(?=/\* ---------- Main component)',
    re.DOTALL,
)

new_contact_block = '''/* ---------- CONTACT: glowing glass envelope + orbiting message bubbles
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
  const qRefs = useRef<THREE.Group>([]);

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

'''

new_src, n_contact = contact_pattern.subn(new_contact_block, src)
assert n_contact == 1, f'Expected 1 ContactScene replacement, got {n_contact}'

# Update the Variant type union
new_src = new_src.replace(
    "type Variant = 'courses' | 'schools' | 'events' | 'pricing' | 'about' | 'resources' | 'contact';",
    "type Variant = 'courses' | 'schools' | 'events' | 'pricing' | 'about' | 'resources' | 'contact' | 'story' | 'faq';",
)

# Update the main switch statement
new_src = new_src.replace(
    "      case 'contact': return <ContactScene color={accentColor} />;\n      default: return <CoursesScene color={accentColor} />;",
    "      case 'contact': return <ContactScene color={accentColor} />;\n      case 'story': return <StoryScene color={accentColor} />;\n      case 'faq': return <FaqScene color={accentColor} />;\n      default: return <CoursesScene color={accentColor} />;",
)

# Update page-hero.tsx variant type union
ph_file = Path('/home/z/my-project/src/components/brand/page-hero.tsx')
ph_src = ph_file.read_text()
ph_src_new = ph_src.replace(
    "  variant?: 'courses' | 'schools' | 'events' | 'pricing' | 'about' | 'resources' | 'contact';",
    "  variant?: 'courses' | 'schools' | 'events' | 'pricing' | 'about' | 'resources' | 'contact' | 'story' | 'faq';",
)
if ph_src_new != ph_src:
    ph_file.write_text(ph_src_new)
    print('Updated page-hero.tsx Variant union')
else:
    print('page-hero.tsx already had story/faq in union (no change)')

FILE.write_text(new_src)
print(f'Wrote {len(new_src):,} bytes to {FILE}')
print(f'ContactScene replacement count: {n_contact}')
