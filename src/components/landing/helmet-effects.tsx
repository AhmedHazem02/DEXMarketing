'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface HelmetEffectsProps {
    /** Enable/disable particle effects */
    showParticles?: boolean
    /** Enable/disable glow effects */
    showGlow?: boolean
    /** Enable/disable light rays */
    showLightRays?: boolean
    /** Enable/disable dynamic reflections */
    showReflections?: boolean
    /** Current ambient light intensity (0 to 1) */
    ambientLight?: any
}

export function HelmetEffects({
    showParticles = true,
    showGlow = true,
    showLightRays = true,
    showReflections = true,
    ambientLight = 1,
}: HelmetEffectsProps) {
    const containerRef = useRef<HTMLDivElement>(null)

    // Only render decorative random elements on client to avoid hydration mismatch
    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => { setIsMounted(true) }, [])

    // Mouse tracking for dynamic lighting
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    // Smooth spring animation for mouse movement
    const springConfig = { damping: 25, stiffness: 150 }
    const smoothMouseX = useSpring(mouseX, springConfig)
    const smoothMouseY = useSpring(mouseY, springConfig)

    // Scale reflecting opacity by ambient light intensity
    // Handles both raw numbers and motion values
    const reflectionOpacity = useTransform(
        ambientLight instanceof Object && 'get' in ambientLight ? ambientLight : useMotionValue(ambientLight || 1),
        (val: number) => Math.min(0.95, (val as number) * 1.5) // Boost visibility slightly but bound at 0.95
    )

    // Transform mouse position to light position
    const lightX = useTransform(smoothMouseX, [-1, 1], [-30, 30])
    const lightY = useTransform(smoothMouseY, [-1, 1], [-20, 20])

    // Reflection position
    const reflectionX = useTransform(smoothMouseX, [-1, 1], [42, 52])
    const reflectionRotate = useTransform(smoothMouseX, [-1, 1], [-35, -15])

    const [containerRect, setContainerRect] = useState({ left: 0, top: 0, width: 0, height: 0 })

    useEffect(() => {
        const updateRect = () => {
            if (containerRef.current) {
                setContainerRect(containerRef.current.getBoundingClientRect())
            }
        }
        updateRect()
        window.addEventListener('resize', updateRect)

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
            const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
            mouseX.set(x)
            mouseY.set(y)
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => {
            window.removeEventListener('resize', updateRect)
            window.removeEventListener('mousemove', handleMouseMove)
        }
    }, [mouseX, mouseY]) // Removed containerRect from dependencies

    return (
        <div ref={containerRef} className="absolute inset-0">
            {/* Enhanced Dynamic Key Light */}
            {showGlow && (
                <motion.div
                    className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[200px] h-[200px] lg:top-[10%] lg:w-[280px] lg:h-[280px] rounded-full pointer-events-none"
                    style={{
                        x: lightX,
                        y: lightY,
                    }}
                >
                    {/* Primary Animated Glow */}
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{
                            opacity: [0.4, 0.7, 0.4],
                            scale: [1, 1.15, 1],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{
                            background: 'radial-gradient(circle, rgba(251,191,36,0.6) 0%, rgba(251,146,60,0.35) 40%, rgba(245,158,11,0.15) 60%, transparent 80%)',
                            filter: 'blur(45px)',
                        }}
                    />

                    {/* Inner Bright Core */}
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] lg:w-[140px] lg:h-[140px] rounded-full"
                        animate={{
                            opacity: [0.6, 1, 0.6],
                            scale: [0.9, 1, 0.9],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{
                            background: 'radial-gradient(circle, rgba(251,191,36,0.8) 0%, rgba(251,146,60,0.4) 50%, transparent 70%)',
                            filter: 'blur(25px)',
                            boxShadow: '0 0 60px rgba(251,191,36,0.5)',
                        }}
                    />
                </motion.div>
            )}

            {/* Visor Glow - Cyan/Blue with enhanced realism */}
            {showGlow && (
                <motion.div
                    className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[120px] h-[120px] lg:top-[12%] lg:w-[180px] lg:h-[180px] rounded-full pointer-events-none"
                    style={{
                        x: useTransform(smoothMouseX, [-1, 1], [-15, 15]),
                        y: useTransform(smoothMouseY, [-1, 1], [-10, 10]),
                    }}
                >
                    {/* Main Visor Glow */}
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{
                            opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.5,
                        }}
                        style={{
                            background: 'radial-gradient(circle, rgba(34,211,238,0.7) 0%, rgba(59,130,246,0.45) 40%, rgba(14,165,233,0.2) 60%, transparent 75%)',
                            filter: 'blur(30px)',
                            boxShadow: '0 0 40px rgba(34,211,238,0.4)',
                        }}
                    />

                    {/* Bright Inner Core */}
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60px] h-[60px] lg:w-[90px] lg:h-[90px] rounded-full"
                        animate={{
                            opacity: [0.7, 1, 0.7],
                            scale: [0.95, 1.05, 0.95],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{
                            background: 'radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(34,211,238,0.4) 50%, transparent 85%)',
                            filter: 'blur(20px)',
                        }}
                    />
                </motion.div>
            )}

            {/* Dynamic Visor Reflection - Following mouse */}
            {showReflections && (
                <motion.div
                    className="absolute top-[10%] w-[60px] h-[80px] lg:top-[12%] lg:w-[90px] lg:h-[120px] rounded-full pointer-events-none"
                    style={{
                        left: reflectionX,
                        rotate: reflectionRotate,
                        opacity: reflectionOpacity,
                    }}
                >
                    {/* Main Specular Highlight */}
                    <motion.div
                        className="absolute inset-0 rounded-[40%]"
                        animate={{
                            opacity: [0.7, 1, 0.7],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(34,211,238,0.7) 30%, rgba(59,130,246,0.4) 60%, transparent 100%)',
                            filter: 'blur(18px)',
                        }}
                    />

                    {/* Sharp Bright Spot */}
                    <motion.div
                        className="absolute top-[20%] left-[30%] w-[25px] h-[35px] lg:w-[35px] lg:h-[50px] rounded-full"
                        animate={{
                            opacity: [0.8, 1, 0.8],
                            scale: [0.9, 1.1, 0.9],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{
                            background: 'radial-gradient(ellipse, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.6) 40%, transparent 70%)',
                            filter: 'blur(8px)',
                            boxShadow: '0 0 20px rgba(255,255,255,0.8)',
                        }}
                    />
                </motion.div>
            )}

            {/* Secondary Reflection - Opposite side */}
            {showReflections && (
                <motion.div
                    className="absolute top-[11%] left-[40%] w-[30px] h-[40px] lg:top-[13%] lg:w-[45px] lg:h-[60px] rounded-full pointer-events-none"
                    style={{
                        x: useTransform(smoothMouseX, [-1, 1], [10, -10]),
                        y: useTransform(smoothMouseY, [-1, 1], [5, -5]),
                        rotate: useTransform(smoothMouseX, [-1, 1], [10, -10]),
                        opacity: useTransform(reflectionOpacity, (v) => (v as number) * 0.6),
                    }}
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 3.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <div
                        className="w-full h-full"
                        style={{
                            background: 'linear-gradient(145deg, rgba(255,255,255,0.5) 0%, rgba(34,211,238,0.4) 50%, transparent 100%)',
                            filter: 'blur(12px)',
                        }}
                    />
                </motion.div>
            )}

            {/* Ambient Light Scatter */}
            {showGlow && (
                <motion.div
                    className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[350px] h-[350px] lg:top-[10%] lg:w-[500px] lg:h-[500px] rounded-full pointer-events-none"
                    animate={{
                        opacity: [0.05, 0.12, 0.05],
                        scale: [0.98, 1.02, 0.98],
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    style={{
                        background: 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, rgba(34,211,238,0.1) 35%, transparent 65%)',
                        filter: 'blur(60px)',
                    }}
                />
            )}

            {/* Particle Ring around Helmet */}
            {showParticles && [...Array(16)].map((_, i) => {
                const angle = (i * 360) / 16
                const radius = 150
                const x = Math.cos((angle * Math.PI) / 180) * radius
                const y = Math.sin((angle * Math.PI) / 180) * radius

                return (
                    <motion.div
                        key={`particle-${i}`}
                        className="absolute top-[12%] left-1/2 w-[2px] h-[2px] lg:w-[3px] lg:h-[3px] rounded-full pointer-events-none"
                        style={{
                            left: `calc(50% + ${x}px)`,
                            top: `calc(12% + ${y}px)`,
                            background: i % 2 === 0
                                ? 'radial-gradient(circle, rgba(34,211,238,1) 0%, rgba(59,130,246,0.8) 50%, transparent 100%)'
                                : 'radial-gradient(circle, rgba(251,191,36,1) 0%, rgba(251,146,60,0.8) 50%, transparent 100%)',
                            boxShadow: i % 2 === 0
                                ? '0 0 12px rgba(34,211,238,0.9), 0 0 6px rgba(34,211,238,0.6)'
                                : '0 0 12px rgba(251,191,36,0.9), 0 0 6px rgba(251,191,36,0.6)',
                        }}
                        animate={{
                            opacity: [0.3, 1, 0.3],
                            scale: [0.6, 1.4, 0.6],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut",
                        }}
                    />
                )
            })}

            {/* Floating Energy Particles - client only to avoid hydration mismatch */}
            {isMounted && showParticles && [...Array(12)].map((_, i) => {
                const startX = Math.random() * 120 - 60
                const startY = 20 + Math.random() * 60
                const isLeft = i % 2 === 0

                return (
                    <motion.div
                        key={`energy-${i}`}
                        className="absolute w-[2px] h-[2px] lg:w-[3px] lg:h-[3px] rounded-full pointer-events-none"
                        style={{
                            left: `calc(50% + ${startX}px)`,
                            top: `${startY}%`,
                            background: isLeft
                                ? 'radial-gradient(circle, rgba(251,191,36,1) 0%, rgba(251,146,60,0.7) 50%, transparent 100%)'
                                : 'radial-gradient(circle, rgba(34,211,238,1) 0%, rgba(59,130,246,0.7) 50%, transparent 100%)',
                            boxShadow: isLeft
                                ? '0 0 10px rgba(251,191,36,0.8)'
                                : '0 0 10px rgba(34,211,238,0.8)',
                        }}
                        animate={{
                            y: [-20, -120],
                            x: [0, (Math.random() - 0.5) * 40],
                            opacity: [0, 1, 1, 0],
                            scale: [0, 1.2, 1, 0],
                        }}
                        transition={{
                            duration: 4 + Math.random() * 2,
                            repeat: Infinity,
                            delay: i * 0.4,
                            ease: "easeOut",
                        }}
                    />
                )
            })}

            {/* Enhanced Light Rays from Helmet */}
            {showLightRays && (
                <motion.div
                    className="absolute top-[12%] left-1/2 -translate-x-1/2 w-[350px] h-[350px] lg:w-[450px] lg:h-[450px] pointer-events-none"
                    animate={{
                        rotate: [0, 360],
                        opacity: [0.15, 0.25, 0.15],
                    }}
                    transition={{
                        rotate: { duration: 25, repeat: Infinity, ease: "linear" },
                        opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                    }}
                    style={{
                        background: `conic-gradient(
                            from 0deg,
                            transparent 0deg,
                            rgba(251,191,36,0.25) 20deg,
                            transparent 40deg,
                            transparent 80deg,
                            rgba(34,211,238,0.25) 100deg,
                            transparent 120deg,
                            transparent 160deg,
                            rgba(251,146,60,0.2) 180deg,
                            transparent 200deg,
                            transparent 240deg,
                            rgba(59,130,246,0.2) 260deg,
                            transparent 280deg,
                            transparent 320deg,
                            rgba(251,191,36,0.25) 340deg,
                            transparent 360deg
                        )`,
                        filter: 'blur(25px)',
                    }}
                />
            )}

            {/* Counter-rotating Light Rays */}
            {showLightRays && (
                <motion.div
                    className="absolute top-[12%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] lg:w-[400px] lg:h-[400px] pointer-events-none"
                    animate={{
                        rotate: [360, 0],
                        opacity: [0.1, 0.2, 0.1],
                    }}
                    transition={{
                        rotate: { duration: 30, repeat: Infinity, ease: "linear" },
                        opacity: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                    }}
                    style={{
                        background: `conic-gradient(
                            from 45deg,
                            transparent 0deg,
                            rgba(34,211,238,0.2) 30deg,
                            transparent 60deg,
                            rgba(251,191,36,0.18) 210deg,
                            transparent 240deg
                        )`,
                        filter: 'blur(30px)',
                    }}
                />
            )}

            {/* HUD-style scan rings - Enhanced */}
            {[...Array(4)].map((_, i) => (
                <motion.div
                    key={`scan-ring-${i}`}
                    className="absolute top-[12%] left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
                    style={{
                        width: `${200 + i * 50}px`,
                        height: `${200 + i * 50}px`,
                        border: '1px solid',
                        borderColor: i % 2 === 0 ? 'rgba(34,211,238,0.3)' : 'rgba(251,191,36,0.25)',
                        boxShadow: i % 2 === 0
                            ? '0 0 15px rgba(34,211,238,0.2), inset 0 0 15px rgba(34,211,238,0.1)'
                            : '0 0 15px rgba(251,191,36,0.2), inset 0 0 15px rgba(251,191,36,0.1)',
                    }}
                    animate={{
                        scale: [1, 1.4],
                        opacity: [0.5, 0],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: i * 1,
                        ease: "easeOut",
                    }}
                />
            ))}

            {/* Orbital Ring Animation */}
            {showParticles && (
                <motion.div
                    className="absolute top-[12%] left-1/2 -translate-x-1/2 w-[180px] h-[180px] lg:w-[240px] lg:h-[240px] rounded-full pointer-events-none"
                    style={{
                        border: '1px dashed rgba(34,211,238,0.2)',
                    }}
                    animate={{
                        rotate: [0, 360],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                >
                    {/* Orbiting dot */}
                    <motion.div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(34,211,238,1) 0%, rgba(59,130,246,0.8) 50%, transparent 100%)',
                            boxShadow: '0 0 15px rgba(34,211,238,0.9)',
                        }}
                    />
                </motion.div>
            )}

            {/* Data stream lines - client only to avoid hydration mismatch */}
            {isMounted && [...Array(6)].map((_, i) => {
                const colors = [
                    { from: 'rgba(34,211,238,0)', mid: 'rgba(34,211,238,0.7)', to: 'rgba(34,211,238,0)' },
                    { from: 'rgba(251,191,36,0)', mid: 'rgba(251,191,36,0.7)', to: 'rgba(251,191,36,0)' },
                ]
                const colorSet = colors[i % 2]

                return (
                    <motion.div
                        key={`data-stream-${i}`}
                        className="absolute h-[2px] rounded-full pointer-events-none"
                        style={{
                            width: `${40 + Math.random() * 50}px`,
                            left: `${42 + Math.random() * 12}%`,
                            top: `${14 + i * 6}%`,
                            background: `linear-gradient(90deg, ${colorSet.from} 0%, ${colorSet.mid} 50%, ${colorSet.to} 100%)`,
                            boxShadow: `0 0 10px ${colorSet.mid}`,
                        }}
                        animate={{
                            x: [0, 40, 0],
                            opacity: [0, 0.9, 0],
                        }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            delay: i * 0.4,
                            ease: "easeInOut",
                        }}
                    />
                )
            })}

            {/* Lens Flare Effect */}
            {showGlow && (
                <motion.div
                    className="absolute top-[11%] left-[48%] pointer-events-none"
                    animate={{
                        opacity: [0.3, 0.7, 0.3],
                        scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    {/* Primary flare */}
                    <div
                        className="w-[120px] h-[120px] lg:w-[160px] lg:h-[160px] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(251,191,36,0.3) 20%, transparent 60%)',
                            filter: 'blur(20px)',
                        }}
                    />
                    {/* Secondary flares */}
                    <div
                        className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[80px] h-[80px] lg:w-[110px] lg:h-[110px] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(34,211,238,0.4) 0%, rgba(59,130,246,0.2) 40%, transparent 70%)',
                            filter: 'blur(15px)',
                        }}
                    />
                </motion.div>
            )}

            {/* Chromatic Aberration Edges */}
            {showReflections && (
                <>
                    {/* Red channel */}
                    <motion.div
                        className="absolute top-[10%] left-[45%] w-[140px] h-[160px] lg:top-[12%] lg:w-[200px] lg:h-[220px] rounded-[45%] pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse, transparent 50%, rgba(239,68,68,0.15) 60%, transparent 80%)',
                            filter: 'blur(10px)',
                            mixBlendMode: 'screen',
                        }}
                        animate={{
                            opacity: [0.2, 0.4, 0.2],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                    {/* Blue channel */}
                    <motion.div
                        className="absolute top-[10%] left-[47%] w-[140px] h-[160px] lg:top-[12%] lg:w-[200px] lg:h-[220px] rounded-[45%] pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse, transparent 50%, rgba(59,130,246,0.15) 60%, transparent 80%)',
                            filter: 'blur(10px)',
                            mixBlendMode: 'screen',
                        }}
                        animate={{
                            opacity: [0.2, 0.4, 0.2],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.5,
                        }}
                    />
                </>
            )}
        </div>
    )
}
