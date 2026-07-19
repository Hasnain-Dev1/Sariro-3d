#!/usr/bin/env python3
"""Surgically replace the rooster in EventsScene with a floating glass
event ticket + orbiting confetti particles. Keeps the calendar and
flying papers — only swaps the bird for something more on-brand."""

import re
from pathlib import Path

FILE = Path('/home/z/my-project/src/components/brand/page-hero-3d.tsx')
src = FILE.read_text()

# Match from the rooster group comment to the start of "Flying papers"
# This captures the entire rooster block (body, head, tail, wings, legs)
rooster_pattern = re.compile(
    r'      \{/\* Realistic rooster \*/\}\n.*?(?=\n      \{/\* Flying papers \*/\})',
    re.DOTALL,
)

new_ticket_block = '''      {/* Floating glass event ticket — replaces the old rooster.
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
'''

new_src, n = rooster_pattern.subn(new_ticket_block, src)
assert n == 1, f'Expected 1 rooster replacement, got {n}'

# Also rename the ref from roosterRef → ticketRef for clarity (optional but cleaner)
# Actually, keep roosterRef name to minimize diff — the var name doesn't affect users.

FILE.write_text(new_src)
print(f'Wrote {len(new_src):,} bytes to {FILE}')
print(f'Rooster → ticket replacement count: {n}')
