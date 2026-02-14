'use client'

import { motion, useReducedMotion } from 'framer-motion'

// Pre-compute floating element positions to avoid Math.cos/sin per render
const FLOATING_ELEMENTS = Array.from({ length: 6 }, (_, i) => ({
    left: `${50 + Math.cos(i) * 40}%`,
    top: `${50 + Math.sin(i * 1.5) * 35}%`,
    duration: 3 + i,
    delay: i * 0.5,
}))

export function CosmicGraphic() {
    const prefersReducedMotion = useReducedMotion()

    return (
        <div className="relative w-[500px] h-[500px] flex items-center justify-center">
            {/* Core Glow */}
            <motion.div
                className="absolute w-64 h-64 rounded-full blur-[60px]"
                style={{
                    background: 'radial-gradient(circle, rgba(255,215,0,0.5) 0%, rgba(249,115,22,0.2) 100%)',
                }}
                animate={prefersReducedMotion ? undefined : { scale: [1, 1.2, 1], opacity: [0.6, 0.8, 0.6] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Main Planet */}
            <div
                className="relative z-10 w-48 h-48 rounded-full shadow-2xl overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 50%, #ea580c 100%)',
                    boxShadow: 'inset -20px -20px 40px rgba(0,0,0,0.5), 0 0 50px rgba(255,215,0,0.3)',
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-80 rounded-full" />
            </div>

            {/* Orbital Rings */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 500">
                <motion.ellipse
                    cx="250" cy="250" rx="180" ry="40"
                    fill="none" stroke="#00D4FF" strokeWidth="2" strokeOpacity="0.5"
                    animate={prefersReducedMotion ? undefined : { rotateX: [0, 5, 0], rotateY: [0, 5, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ transformOrigin: 'center' }}
                />
                <motion.ellipse
                    cx="250" cy="250" rx="200" ry="60"
                    fill="none" stroke="#FFD700" strokeWidth="1.5" strokeDasharray="20 10"
                    animate={prefersReducedMotion ? undefined : { rotate: [30, 390] }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: 'center' }}
                />
                <motion.ellipse
                    cx="250" cy="250" rx="60" ry="220"
                    fill="none" stroke="#F97316" strokeWidth="1" strokeOpacity="0.4"
                    animate={prefersReducedMotion ? undefined : { rotate: [120, 480] }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: 'center' }}
                />

                {!prefersReducedMotion && (
                    <motion.circle r="6" fill="#00D4FF">
                        <animateMotion dur="8s" repeatCount="indefinite" path="M250,250 m-180,0 a180,40 0 1,0 360,0 a180,40 0 1,0 -360,0" />
                    </motion.circle>
                )}
            </svg>

            {/* Floating Elements */}
            {!prefersReducedMotion &&
                FLOATING_ELEMENTS.map((el, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-8 h-8 border border-white/10 rounded-full backdrop-blur-md flex items-center justify-center bg-white/5"
                        style={{ left: el.left, top: el.top }}
                        animate={{ y: [0, -15, 0], opacity: [0.3, 0.7, 0.3], scale: [1, 1.2, 1] }}
                        transition={{ duration: el.duration, repeat: Infinity, delay: el.delay, ease: 'easeInOut' }}
                    >
                        <div className="w-2 h-2 rounded-full bg-cyan-400/50" />
                    </motion.div>
                ))}
        </div>
    )
}
