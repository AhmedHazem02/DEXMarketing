'use client'

import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface HelmetEffectsProps {
    showParticles?: boolean
    showGlow?: boolean
    showLightRays?: boolean
    showReflections?: boolean
    ambientLight?: number | MotionValue<number>
}

/* Seeded RNG — deterministic, prevents hydration mismatch */
function seededRandom(seed: number): number {
    const x = Math.sin(seed * 9301 + 49297) * 49297
    return x - Math.floor(x)
}

// Pre-generate stable positions using seeded RNG — no hydration mismatch
const ENERGY_PARTICLES = Array.from({ length: 8 }, (_, i) => ({
    startX: seededRandom(i * 5 + 1) * 100 - 50,
    startY: 20 + seededRandom(i * 5 + 2) * 55,
    isLeft: i % 2 === 0,
    driftX: (seededRandom(i * 5 + 3) - 0.5) * 35,
    duration: 4 + seededRandom(i * 5 + 4) * 2,
}))

const DATA_STREAMS = Array.from({ length: 4 }, (_, i) => ({
    width: 35 + seededRandom(i * 3 + 1) * 45,
    left: 42 + seededRandom(i * 3 + 2) * 12,
    isGold: i % 2 === 0,
}))

export function HelmetEffects({
    showParticles = true,
    showGlow = true,
    showLightRays = true,
    showReflections = true,
}: HelmetEffectsProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => { setIsMounted(true) }, [])

    // Mouse tracking for dynamic lighting
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const springConfig = { damping: 25, stiffness: 150 }
    const smoothMouseX = useSpring(mouseX, springConfig)
    const smoothMouseY = useSpring(mouseY, springConfig)

    // Always call hooks unconditionally — resolves Rules of Hooks violation
    const reflectionOpacity = 0.6

    const lightX = useTransform(smoothMouseX, [-1, 1], [-10, 10])
    const lightY = useTransform(smoothMouseY, [-1, 1], [-5, 5])
    const reflectionX = useTransform(smoothMouseX, [-1, 1], [42, 52])
    const reflectionRotate = useTransform(smoothMouseX, [-1, 1], [-35, -15])

    // Pre-computed transforms for conditional JSX
    const visorLightX = useTransform(smoothMouseX, [-1, 1], [-15, 15])
    const visorLightY = useTransform(smoothMouseY, [-1, 1], [-10, 10])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            mouseX.set((e.clientX - rect.left - rect.width / 2) / (rect.width / 2))
            mouseY.set((e.clientY - rect.top - rect.height / 2) / (rect.height / 2))
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [mouseX, mouseY])

    if (!isMounted) return null

    return (
        <div ref={containerRef} className="absolute inset-0 z-[15]">
            {/* Key Light Glow */}
            {showGlow && (
                <motion.div
                    className="absolute top-[18%] left-[48%] -translate-x-1/2 w-[200px] h-[200px] lg:top-[20%] lg:w-[280px] lg:h-[280px] rounded-full pointer-events-none"
                    style={{ x: lightX, y: lightY }}
                >
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(251,191,36,0.5) 0%, transparent 80%)',
                            filter: 'blur(20px)',
                            opacity: 0.6,
                        }}
                    />
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] lg:w-[140px] lg:h-[140px] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(251,191,36,0.75) 0%, rgba(251,146,60,0.35) 50%, transparent 70%)',
                            filter: 'blur(25px)',
                            boxShadow: '0 0 60px rgba(251,191,36,0.5)',
                            opacity: 0.8,
                        }}
                    />
                </motion.div>
            )}

            {/* Visor Glow */}
            {showGlow && (
                <motion.div
                    className="absolute top-[20%] left-[48%] -translate-x-1/2 w-[120px] h-[120px] lg:top-[22%] lg:w-[180px] lg:h-[180px] rounded-full pointer-events-none"
                    style={{ x: visorLightX, y: visorLightY }}
                >
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{ opacity: [0.45, 0.75, 0.45] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            background: 'radial-gradient(circle, rgba(34,211,238,0.3) 0%, transparent 80%)',
                            filter: 'blur(15px)',
                        }}
                    />
                </motion.div>
            )}

            {/* Dynamic Visor Reflection */}
            {showReflections && (
                <motion.div
                    className="absolute top-[20%] w-[60px] h-[80px] lg:top-[22%] lg:w-[90px] lg:h-[120px] rounded-full pointer-events-none"
                    style={{ left: reflectionX, rotate: reflectionRotate, opacity: reflectionOpacity }}
                >
                    <div
                        className="absolute inset-0 rounded-[40%]"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(34,211,238,0.65) 30%, rgba(59,130,246,0.35) 60%, transparent 100%)',
                            filter: 'blur(18px)',
                            opacity: 0.85,
                        }}
                    />
                    <div
                        className="absolute top-[20%] left-[30%] w-[25px] h-[35px] lg:w-[35px] lg:h-[50px] rounded-full"
                        style={{
                            background: 'radial-gradient(ellipse, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.55) 40%, transparent 70%)',
                            filter: 'blur(8px)',
                            boxShadow: '0 0 20px rgba(255,255,255,0.8)',
                            opacity: 0.9,
                        }}
                    />
                </motion.div>
            )}

            {/* Ambient Light Scatter */}
            {showGlow && (
                <motion.div
                    className="absolute top-[18%] left-[48%] -translate-x-1/2 w-[350px] h-[350px] lg:top-[20%] lg:w-[500px] lg:h-[500px] rounded-full pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 70%)',
                        filter: 'blur(30px)',
                        opacity: 0.08,
                    }}
                />
            )}

            {/* Particle Ring around Helmet */}
            {showParticles && Array.from({ length: 8 }, (_, i) => {
                const angle = (i * 360) / 8
                const radius = 150
                const x = Math.cos((angle * Math.PI) / 180) * radius
                const y = Math.sin((angle * Math.PI) / 180) * radius
                return (
                    <motion.div
                        key={`particle-${i}`}
                        className="absolute top-[22%] left-[48%] w-[2px] h-[2px] lg:w-[3px] lg:h-[3px] rounded-full pointer-events-none"
                        style={{
                            left: `calc(48% + ${x}px)`,
                            top: `calc(22% + ${y}px)`,
                            background: i % 2 === 0 ? 'rgba(34,211,238,0.8)' : 'rgba(251,191,36,0.8)',
                            opacity: 0.6,
                        }}
                        animate={{ opacity: [0.25, 1, 0.25], scale: [0.6, 1.3, 0.6] }}
                        transition={{ duration: 3.5, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
                    />
                )
            })}

            {/* Floating Energy Particles */}
            {showParticles && ENERGY_PARTICLES.map((p, i) => (
                <motion.div
                    key={`energy-${i}`}
                    className="absolute w-[2px] h-[2px] lg:w-[3px] lg:h-[3px] rounded-full pointer-events-none"
                    style={{
                        left: `calc(50% + ${p.startX}px)`,
                        top: `${p.startY}%`,
                        background: p.isLeft ? 'rgba(251,191,36,0.5)' : 'rgba(34,211,238,0.5)',
                    }}
                    animate={{ y: [-20, -110], x: [0, p.driftX], opacity: [0, 1, 1, 0], scale: [0, 1.2, 1, 0] }}
                    transition={{ duration: p.duration, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
                />
            ))}

            {/* Enhanced Light Rays from Helmet */}
            {showLightRays && (
                <motion.div
                    className="absolute top-[22%] left-[48%] -translate-x-1/2 w-[300px] h-[300px] lg:w-[400px] lg:h-[400px] pointer-events-none"
                    style={{
                        background: `conic-gradient(from 0deg, transparent 0deg, rgba(251,191,36,0.1) 20deg, transparent 40deg, transparent 80deg, rgba(34,211,238,0.1) 100deg, transparent 360deg)`,
                        filter: 'blur(20px)',
                        opacity: 0.15,
                    }}
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                />
            )}

            {/* HUD-style scan rings */}
            <motion.div
                className="absolute top-[22%] left-[48%] -translate-x-1/2 rounded-full pointer-events-none"
                style={{
                    width: `250px`,
                    height: `250px`,
                    border: '1px solid rgba(34,211,238,0.2)',
                }}
                animate={{ scale: [1, 1.2], opacity: [0.3, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeOut' }}
            />

            {/* Orbital Ring */}
            {showParticles && (
                <motion.div
                    className="absolute top-[22%] left-[48%] -translate-x-1/2 w-[180px] h-[180px] lg:w-[240px] lg:h-[240px] rounded-full pointer-events-none"
                    style={{ border: '1px dashed rgba(34,211,238,0.2)' }}
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                    <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                        style={{
                            background: 'rgba(34,211,238,1)',
                            boxShadow: '0 0 12px rgba(34,211,238,0.8)',
                        }}
                    />
                </motion.div>
            )}

            {/* Data streams */}
            {DATA_STREAMS.map((s, i) => (
                <motion.div
                    key={`data-stream-${i}`}
                    className="absolute h-[2px] rounded-full pointer-events-none"
                    style={{
                        width: `${s.width}px`,
                        left: `${s.left}%`,
                        top: `${20 + i * 8}%`,
                        background: s.isGold
                            ? 'linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.65) 50%, transparent 100%)'
                            : 'linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.65) 50%, transparent 100%)',
                    }}
                    animate={{ x: [0, 35, 0], opacity: [0, 0.85, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.7, ease: 'easeInOut' }}
                />
            ))}

            {/* Chromatic Aberration Edges */}
            {showReflections && (
                <>
                    <motion.div
                        className="absolute top-[20%] left-[43%] w-[140px] h-[160px] lg:top-[22%] lg:w-[200px] lg:h-[220px] rounded-[45%] pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse, transparent 50%, rgba(239,68,68,0.1) 60%, transparent 80%)',
                            filter: 'blur(10px)',
                            mixBlendMode: 'screen',
                        }}
                        animate={{ opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute top-[20%] left-[45%] w-[140px] h-[160px] lg:top-[22%] lg:w-[200px] lg:h-[220px] rounded-[45%] pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse, transparent 50%, rgba(59,130,246,0.1) 60%, transparent 80%)',
                            filter: 'blur(10px)',
                            mixBlendMode: 'screen',
                        }}
                        animate={{ opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 4, repeat: Infinity, delay: 2 }}
                    />
                </>
            )}
        </div>
    )
}
