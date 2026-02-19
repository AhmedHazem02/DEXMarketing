'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface HelmetEffectsProps {
    showParticles?: boolean
    showGlow?: boolean
    showLightRays?: boolean
    showReflections?: boolean
    ambientLight?: any
}

// Pre-generate stable random positions outside component
const ENERGY_PARTICLES = Array.from({ length: 8 }, (_, i) => ({
    startX: Math.random() * 100 - 50,
    startY: 20 + Math.random() * 55,
    isLeft: i % 2 === 0,
    driftX: (Math.random() - 0.5) * 35,
    duration: 4 + Math.random() * 2,
}))

const DATA_STREAMS = Array.from({ length: 4 }, (_, i) => ({
    width: 35 + Math.random() * 45,
    left: 42 + Math.random() * 12,
    isGold: i % 2 === 0,
}))

export function HelmetEffects({
    showParticles = true,
    showGlow = true,
    showLightRays = true,
    showReflections = true,
    ambientLight = 1,
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

    const reflectionOpacity = useTransform(
        ambientLight instanceof Object && 'get' in ambientLight ? ambientLight : useMotionValue(ambientLight || 1),
        (val: number) => Math.min(0.9, val * 1.5)
    )

    const lightX = useTransform(smoothMouseX, [-1, 1], [-30, 30])
    const lightY = useTransform(smoothMouseY, [-1, 1], [-20, 20])
    const reflectionX = useTransform(smoothMouseX, [-1, 1], [42, 52])
    const reflectionRotate = useTransform(smoothMouseX, [-1, 1], [-35, -15])

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

    return (
        <div ref={containerRef} className="absolute inset-0">
            {/* Key Light Glow */}
            {showGlow && (
                <motion.div
                    className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[200px] h-[200px] lg:w-[280px] lg:h-[280px] rounded-full pointer-events-none"
                    style={{ x: lightX, y: lightY }}
                >
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{ opacity: [0.35, 0.65, 0.35], scale: [1, 1.12, 1] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            background: 'radial-gradient(circle, rgba(251,191,36,0.55) 0%, rgba(251,146,60,0.3) 40%, transparent 75%)',
                            filter: 'blur(45px)',
                        }}
                    />
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] lg:w-[140px] lg:h-[140px] rounded-full"
                        animate={{ opacity: [0.55, 0.9, 0.55], scale: [0.9, 1, 0.9] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            background: 'radial-gradient(circle, rgba(251,191,36,0.75) 0%, rgba(251,146,60,0.35) 50%, transparent 70%)',
                            filter: 'blur(25px)',
                        }}
                    />
                </motion.div>
            )}

            {/* Visor Glow */}
            {showGlow && (
                <motion.div
                    className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[120px] h-[120px] lg:top-[12%] lg:w-[180px] lg:h-[180px] rounded-full pointer-events-none"
                    style={{
                        x: useTransform(smoothMouseX, [-1, 1], [-15, 15]),
                        y: useTransform(smoothMouseY, [-1, 1], [-10, 10]),
                    }}
                >
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{ opacity: [0.45, 0.75, 0.45] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                        style={{
                            background: 'radial-gradient(circle, rgba(34,211,238,0.65) 0%, rgba(59,130,246,0.4) 40%, transparent 70%)',
                            filter: 'blur(30px)',
                        }}
                    />
                </motion.div>
            )}

            {/* Dynamic Visor Reflection */}
            {showReflections && (
                <motion.div
                    className="absolute top-[10%] w-[60px] h-[80px] lg:top-[12%] lg:w-[90px] lg:h-[120px] rounded-full pointer-events-none"
                    style={{ left: reflectionX, rotate: reflectionRotate, opacity: reflectionOpacity }}
                >
                    <motion.div
                        className="absolute inset-0 rounded-[40%]"
                        animate={{ opacity: [0.65, 1, 0.65] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(34,211,238,0.65) 30%, rgba(59,130,246,0.35) 60%, transparent 100%)',
                            filter: 'blur(18px)',
                        }}
                    />
                    <motion.div
                        className="absolute top-[20%] left-[30%] w-[25px] h-[35px] lg:w-[35px] lg:h-[50px] rounded-full"
                        animate={{ opacity: [0.75, 1, 0.75], scale: [0.9, 1.1, 0.9] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            background: 'radial-gradient(ellipse, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.55) 40%, transparent 70%)',
                            filter: 'blur(8px)',
                        }}
                    />
                </motion.div>
            )}

            {/* Ambient Light Scatter */}
            {showGlow && (
                <motion.div
                    className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[350px] h-[350px] lg:top-[10%] lg:w-[500px] lg:h-[500px] rounded-full pointer-events-none"
                    animate={{ opacity: [0.04, 0.1, 0.04], scale: [0.98, 1.02, 0.98] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, rgba(34,211,238,0.08) 35%, transparent 65%)',
                        filter: 'blur(60px)',
                    }}
                />
            )}

            {/* Particle Ring (reduced from 16 to 8) */}
            {showParticles && Array.from({ length: 8 }, (_, i) => {
                const angle = (i * 360) / 8
                const radius = 145
                const x = Math.cos((angle * Math.PI) / 180) * radius
                const y = Math.sin((angle * Math.PI) / 180) * radius
                return (
                    <motion.div
                        key={`particle-${i}`}
                        className="absolute w-[2px] h-[2px] lg:w-[3px] lg:h-[3px] rounded-full pointer-events-none"
                        style={{
                            left: `calc(50% + ${x}px)`,
                            top: `calc(12% + ${y}px)`,
                            background: i % 2 === 0
                                ? 'rgba(34,211,238,1)'
                                : 'rgba(251,191,36,1)',
                            boxShadow: i % 2 === 0
                                ? '0 0 10px rgba(34,211,238,0.8)'
                                : '0 0 10px rgba(251,191,36,0.8)',
                        }}
                        animate={{ opacity: [0.25, 1, 0.25], scale: [0.6, 1.3, 0.6] }}
                        transition={{ duration: 3.5, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
                    />
                )
            })}

            {/* Floating Energy Particles (reduced from 12 to 8, pre-generated) */}
            {isMounted && showParticles && ENERGY_PARTICLES.map((p, i) => (
                <motion.div
                    key={`energy-${i}`}
                    className="absolute w-[2px] h-[2px] lg:w-[3px] lg:h-[3px] rounded-full pointer-events-none"
                    style={{
                        left: `calc(50% + ${p.startX}px)`,
                        top: `${p.startY}%`,
                        background: p.isLeft
                            ? 'rgba(251,191,36,1)'
                            : 'rgba(34,211,238,1)',
                        boxShadow: p.isLeft
                            ? '0 0 8px rgba(251,191,36,0.7)'
                            : '0 0 8px rgba(34,211,238,0.7)',
                    }}
                    animate={{ y: [-20, -110], x: [0, p.driftX], opacity: [0, 1, 1, 0], scale: [0, 1.2, 1, 0] }}
                    transition={{ duration: p.duration, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
                />
            ))}

            {/* Single Light Ray (replaced 2 counter-rotating with 1) */}
            {showLightRays && (
                <motion.div
                    className="absolute top-[12%] left-1/2 -translate-x-1/2 w-[320px] h-[320px] lg:w-[420px] lg:h-[420px] pointer-events-none"
                    animate={{ rotate: [0, 360], opacity: [0.1, 0.2, 0.1] }}
                    transition={{
                        rotate: { duration: 28, repeat: Infinity, ease: 'linear' },
                        opacity: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                    }}
                    style={{
                        background: `conic-gradient(
                            from 0deg,
                            transparent 0deg,
                            rgba(251,191,36,0.2) 20deg,
                            transparent 40deg,
                            transparent 80deg,
                            rgba(34,211,238,0.2) 100deg,
                            transparent 120deg,
                            transparent 160deg,
                            rgba(251,146,60,0.15) 180deg,
                            transparent 200deg,
                            transparent 320deg,
                            rgba(251,191,36,0.2) 340deg,
                            transparent 360deg
                        )`,
                        filter: 'blur(28px)',
                    }}
                />
            )}

            {/* HUD scan rings (reduced from 4 to 2) */}
            {[0, 2].map((i) => (
                <motion.div
                    key={`scan-ring-${i}`}
                    className="absolute top-[12%] left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
                    style={{
                        width: `${200 + i * 50}px`,
                        height: `${200 + i * 50}px`,
                        border: '1px solid',
                        borderColor: i === 0 ? 'rgba(34,211,238,0.25)' : 'rgba(251,191,36,0.2)',
                    }}
                    animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: i * 1.5, ease: 'easeOut' }}
                />
            ))}

            {/* Orbital Ring */}
            {showParticles && (
                <motion.div
                    className="absolute top-[12%] left-1/2 -translate-x-1/2 w-[180px] h-[180px] lg:w-[240px] lg:h-[240px] rounded-full pointer-events-none"
                    style={{ border: '1px dashed rgba(34,211,238,0.18)' }}
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
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

            {/* Data streams (reduced from 6 to 4, pre-generated) */}
            {isMounted && DATA_STREAMS.map((s, i) => (
                <motion.div
                    key={`data-stream-${i}`}
                    className="absolute h-[2px] rounded-full pointer-events-none"
                    style={{
                        width: `${s.width}px`,
                        left: `${s.left}%`,
                        top: `${14 + i * 7}%`,
                        background: s.isGold
                            ? 'linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.65) 50%, transparent 100%)'
                            : 'linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.65) 50%, transparent 100%)',
                    }}
                    animate={{ x: [0, 35, 0], opacity: [0, 0.85, 0] }}
                    transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
                />
            ))}
        </div>
    )
}
