'use client'

import { motion } from 'framer-motion'

interface FloatingShapeProps {
  className?: string
  delay?: number
  duration?: number
}

/** Glowing orb that floats and pulses */
export function GlowOrb({
  color = '#F2CB05',
  size = 200,
  blur = 80,
  className = '',
  opacity = 0.04,
}: {
  color?: string
  size?: number
  blur?: number
  className?: string
  opacity?: number
}) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.15, 1],
        opacity: [opacity, opacity * 1.8, opacity],
      }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      className={`absolute rounded-full pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
      }}
    />
  )
}

/** Floating hexagon shape */
export function FloatingHexagon({
  className = '',
  delay = 0,
  duration = 8,
}: FloatingShapeProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 0.15, 0.15, 0],
        y: [0, -20, -20, 0],
        rotate: [0, 45, 90, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={`absolute pointer-events-none ${className}`}
    >
      <div className="hexagon w-full h-full bg-gradient-to-br from-[#F2CB05]/20 to-transparent" />
    </motion.div>
  )
}

/** Floating diamond shape */
export function FloatingDiamond({
  className = '',
  delay = 0,
  duration = 10,
}: FloatingShapeProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 0.12, 0.12, 0],
        y: [0, 15, -15, 0],
        rotate: [0, -30, 30, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={`absolute pointer-events-none ${className}`}
    >
      <div className="diamond w-full h-full border border-[#22D3EE]/20" />
    </motion.div>
  )
}

/** Orbital ring with a dot moving along it */
export function OrbitalRing({
  size = 300,
  borderColor = 'rgba(242, 203, 5, 0.08)',
  dotColor = '#F2CB05',
  duration = 20,
  className = '',
}: {
  size?: number
  borderColor?: string
  dotColor?: string
  duration?: number
  className?: string
}) {
  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ border: `1px solid ${borderColor}` }}
      />
      {/* Orbiting dot */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0"
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
          style={{ backgroundColor: dotColor, boxShadow: `0 0 10px ${dotColor}` }}
        />
      </motion.div>
    </div>
  )
}

/** Grid of small dots as a decorative pattern */
export function DotGrid({
  rows = 6,
  cols = 6,
  gap = 24,
  className = '',
}: {
  rows?: number
  cols?: number
  gap?: number
  className?: string
}) {
  return (
    <div
      className={`absolute pointer-events-none opacity-[0.06] ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${gap}px)`,
        gridTemplateRows: `repeat(${rows}, ${gap}px)`,
      }}
    >
      {Array.from({ length: rows * cols }).map((_, i) => (
        <div
          key={i}
          className="w-1 h-1 rounded-full bg-white"
        />
      ))}
    </div>
  )
}

/** Animated gradient border ring */
export function GradientRing({
  size = 400,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      className={`absolute pointer-events-none ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="w-full h-full rounded-full"
        style={{
          background: `conic-gradient(from 0deg, transparent, rgba(242, 203, 5, 0.1), transparent, rgba(34, 211, 238, 0.08), transparent)`,
          mask: `radial-gradient(farthest-side, transparent calc(100% - 1px), #000 calc(100% - 1px))`,
          WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - 1px), #000 calc(100% - 1px))`,
        }}
      />
    </motion.div>
  )
}

/** Section divider with animated gradient line and floating particles */
export function SectionDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`relative w-full h-px ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F2CB05]/20 to-transparent" />
      <motion.div
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="absolute top-0 w-20 h-px bg-gradient-to-r from-transparent via-[#F2CB05]/60 to-transparent"
      />
    </div>
  )
}
