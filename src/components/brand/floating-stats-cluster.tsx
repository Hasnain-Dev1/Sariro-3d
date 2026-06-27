'use client';

import { motion } from 'framer-motion';
import { useRef, ReactNode } from 'react';
import * as THREE from 'three';

/* ===============================================================
   FLOATING STATS CLUSTER — replaces the old rotating cube
   - Stat cards float at different Z-depths (layered 3D)
   - Each card gently bobs + tilts
   - Mouse-reactive parallax (desktop)
   - More readable + more premium than a cube
=============================================================== */

type StatFace = {
  value: string;
  label: string;
  color: string;
};

export function FloatingStatsCluster({
  stats,
  size = 220,
}: {
  stats: StatFace[];
  size?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg)`;
  };
  const handleLeave = () => {
    const el = containerRef.current;
    if (!el) return;
    el.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg)';
  };

  // Arrange cards in a circular cluster
  const cardCount = Math.min(stats.length, 6);
  const radius = size * 0.35;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative transition-transform duration-300 ease-out"
      style={{ width: size, height: size, transformStyle: 'preserve-3d', perspective: '800px' }}
    >
      {/* Central glow orb */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.4), transparent 70%)',
        }}
      />

      {/* Central icon */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
        style={{ transform: 'translate(-50%, -50%) translateZ(60px)' }}
      >
        <div
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-2xl"
          style={{ boxShadow: '0 20px 50px -15px rgba(37, 99, 235, 0.6)' }}
        >
          <span
            className="text-2xl font-extrabold text-white"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            MP
          </span>
        </div>
      </motion.div>

      {/* Floating stat cards around the center */}
      {stats.slice(0, cardCount).map((stat, i) => {
        const angle = (i / cardCount) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const z = 30 + Math.sin(i * 1.2) * 20;
        const delay = i * 0.5;

        return (
          <motion.div
            key={i}
            animate={{
              y: [y, y - 8, y],
              z: [z, z + 10, z],
              rotateY: [0, 5, 0],
            }}
            transition={{
              duration: 3 + i * 0.3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay,
            }}
            className="absolute top-1/2 left-1/2"
            style={{
              transform: `translate(-50%, -50%) translate(${x}px, ${y}px) translateZ(${z}px)`,
              transformStyle: 'preserve-3d',
            }}
          >
            <div
              className="glass-panel rounded-2xl px-3 py-2.5 text-center shadow-xl"
              style={{
                borderColor: `${stat.color}40`,
                borderWidth: '1px',
                borderStyle: 'solid',
                boxShadow: `0 10px 30px -10px ${stat.color}80`,
              }}
            >
              <div
                className="text-lg font-extrabold leading-none"
                style={{ color: stat.color, fontFamily: 'var(--font-jakarta)' }}
              >
                {stat.value}
              </div>
              <div
                className="text-[8px] font-bold uppercase tracking-wider text-slate-500 mt-0.5"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                {stat.label}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
