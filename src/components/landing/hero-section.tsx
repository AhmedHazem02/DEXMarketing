'use client'

import { Suspense, useRef } from 'react'
import dynamic from 'next/dynamic'
import { HeroOverlay } from './hero-overlay'
import { HelmetEffects } from './helmet-effects'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

const SceneCanvas = dynamic(() => import('@/components/scene/SceneCanvas'), {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-[#022026]" />,
})

export function HeroSection() {
    const sectionRef = useRef<HTMLDivElement>(null)
    
    // Mouse position tracking
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    
    // Smooth spring animations
    const springConfig = { damping: 20, stiffness: 100 }
    const smoothMouseX = useSpring(mouseX, springConfig)
    const smoothMouseY = useSpring(mouseY, springConfig)
    
    // Parallax transformations for astronaut
    const astronautX = useTransform(smoothMouseX, [-1, 1], [-20, 20])
    const astronautY = useTransform(smoothMouseY, [-1, 1], [-15, 15])
    const astronautRotateX = useTransform(smoothMouseY, [-1, 1], [3, -3])
    const astronautRotateY = useTransform(smoothMouseX, [-1, 1], [-3, 3])
    
    // Handle mouse movement
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!sectionRef.current) return
        const rect = sectionRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
        const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
        mouseX.set(x)
        mouseY.set(y)
    }
    
    return (
        <section 
            ref={sectionRef}
            onMouseMove={handleMouseMove}
            className="relative min-h-[100dvh] w-full overflow-hidden bg-[#022026]"
        >
            {/* 3D Background */}
            <div className="absolute inset-0 z-0">
                <Suspense fallback={<div className="absolute inset-0 bg-[#022026]" />}>
                    <SceneCanvas />
                </Suspense>
            </div>

            {/* Hero Image with Advanced Helmet Effects */}
            <div className="absolute inset-0 z-[5] pointer-events-none flex items-end justify-center lg:justify-end overflow-hidden">
                <motion.div 
                    className="relative w-full max-w-[600px] lg:max-w-[900px] h-[70vh] lg:h-[90vh] translate-y-[10%] lg:translate-x-[1%] lg:translate-y-[5%]"
                    style={{
                        x: astronautX,
                        y: astronautY,
                        rotateX: astronautRotateX,
                        rotateY: astronautRotateY,
                        transformStyle: 'preserve-3d',
                    }}
                >
                    {/* All Helmet Visual Effects */}
                    <HelmetEffects 
                        showParticles={true} 
                        showGlow={true} 
                        showLightRays={true} 
                        showReflections={true}
                    />

                    {/* Astronaut Image with 3D Parallax */}
                    <motion.img
                        src="/images/Gemini_Generated_Image_gndw9zgndw9zgndw-removebg-preview.png"
                        alt="Astronaut"
                        className="relative w-full h-full object-contain z-10"
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ 
                            opacity: 1, 
                            y: [0, -15, 0],
                            scale: 1,
                        }}
                        transition={{
                            opacity: { duration: 1.2, delay: 0.5 },
                            scale: { duration: 1.2, delay: 0.5 },
                            y: { 
                                duration: 6, 
                                repeat: Infinity, 
                                ease: "easeInOut",
                                delay: 1,
                            },
                        }}
                        style={{ 
                            filter: 'drop-shadow(0 0 40px rgba(0,0,0,0.7)) drop-shadow(0 0 25px rgba(251,191,36,0.3)) drop-shadow(0 0 15px rgba(34,211,238,0.2))',
                            transformStyle: 'preserve-3d',
                        }}
                    />

                    {/* Dynamic Energy Field around Astronaut */}
                    <motion.div
                        className="absolute inset-0 rounded-full pointer-events-none"
                        animate={{
                            opacity: [0, 0.2, 0],
                            scale: [0.92, 1.08, 0.92],
                        }}
                        transition={{
                            duration: 6,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{
                            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(251,191,36,0.15) 50%, rgba(34,211,238,0.1) 70%, transparent 100%)',
                            filter: 'blur(40px)',
                        }}
                    />

                    {/* Pulsating Aura */}
                    <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            x: useTransform(smoothMouseX, [-1, 1], [10, -10]),
                            y: useTransform(smoothMouseY, [-1, 1], [10, -10]),
                        }}
                    >
                        <motion.div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full"
                            animate={{
                                opacity: [0.05, 0.15, 0.05],
                                scale: [0.95, 1.05, 0.95],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            style={{
                                background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.2) 0%, rgba(34,211,238,0.15) 40%, transparent 70%)',
                                filter: 'blur(80px)',
                            }}
                        />
                    </motion.div>
                </motion.div>
            </div>

            {/* Cinematic vignette with subtle parallax */}
            <motion.div 
                className="pointer-events-none absolute inset-0 z-[1]"
                style={{
                    x: useTransform(smoothMouseX, [-1, 1], [-5, 5]),
                    y: useTransform(smoothMouseY, [-1, 1], [-5, 5]),
                    background: 'radial-gradient(ellipse at center,transparent 30%,#022026 100%)',
                }}
            />

            {/* Dynamic gradient overlay following mouse */}
            <motion.div 
                className="pointer-events-none absolute inset-0 z-[2] opacity-30"
                style={{
                    background: useTransform(
                        [smoothMouseX, smoothMouseY],
                        ([x, y]: number[]) => 
                            `radial-gradient(circle at ${50 + x * 20}% ${50 + y * 20}%, rgba(251,191,36,0.08) 0%, rgba(34,211,238,0.05) 40%, transparent 70%)`
                    ),
                }}
            />

            {/* Subtle scan-lines for sci-fi feel */}
            <div
                className="pointer-events-none absolute inset-0 z-[1] opacity-[0.03]"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
                }}
            />

            {/* Enhanced Horizontal scanning line effect */}
            <motion.div
                className="pointer-events-none absolute w-full h-[3px] z-[6]"
                style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.9) 30%, rgba(251,191,36,0.9) 50%, rgba(34,211,238,0.9) 70%, transparent 100%)',
                    boxShadow: '0 0 25px rgba(34,211,238,0.7), 0 0 15px rgba(251,191,36,0.5)',
                }}
                animate={{
                    top: ['0%', '100%'],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                    top: { duration: 8, repeat: Infinity, ease: "linear" },
                    opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                }}
            />

            {/* Vertical accent lines */}
            {[...Array(3)].map((_, i) => (
                <motion.div
                    key={`v-line-${i}`}
                    className="pointer-events-none absolute h-full w-[2px] z-[6]"
                    style={{
                        left: `${20 + i * 30}%`,
                        background: 'linear-gradient(180deg, transparent 0%, rgba(34,211,238,0.3) 50%, transparent 100%)',
                        boxShadow: '0 0 10px rgba(34,211,238,0.4)',
                    }}
                    animate={{
                        opacity: [0.1, 0.4, 0.1],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: i * 0.5,
                        ease: "easeInOut",
                    }}
                />
            ))}

            {/* Bottom fade to next section */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 z-[2] bg-gradient-to-t from-[#022026] to-transparent" />

            {/* Ambient Floating Particles */}
            {[...Array(20)].map((_, i) => {
                const randomX = Math.random() * 100
                const randomY = Math.random() * 100
                const randomDelay = Math.random() * 5
                const randomDuration = 8 + Math.random() * 12
                const randomSize = 1 + Math.random() * 3
                const isGold = i % 3 === 0
                
                return (
                    <motion.div
                        key={`ambient-particle-${i}`}
                        className="pointer-events-none absolute rounded-full z-[3]"
                        style={{
                            left: `${randomX}%`,
                            top: `${randomY}%`,
                            width: `${randomSize}px`,
                            height: `${randomSize}px`,
                            background: isGold 
                                ? 'radial-gradient(circle, rgba(251,191,36,0.8) 0%, rgba(251,146,60,0.4) 50%, transparent 100%)'
                                : 'radial-gradient(circle, rgba(34,211,238,0.8) 0%, rgba(59,130,246,0.4) 50%, transparent 100%)',
                            boxShadow: isGold
                                ? '0 0 10px rgba(251,191,36,0.6)'
                                : '0 0 10px rgba(34,211,238,0.6)',
                        }}
                        animate={{
                            y: [0, -30, 0],
                            x: [0, Math.random() * 20 - 10, 0],
                            opacity: [0, 0.6, 0],
                            scale: [0, 1, 0],
                        }}
                        transition={{
                            duration: randomDuration,
                            repeat: Infinity,
                            delay: randomDelay,
                            ease: "easeInOut",
                        }}
                    />
                )
            })}

            {/* Light Streaks */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={`streak-${i}`}
                    className="pointer-events-none absolute h-[1px] z-[3]"
                    style={{
                        width: `${100 + Math.random() * 200}px`,
                        top: `${10 + i * 15}%`,
                        left: `-${100 + Math.random() * 100}px`,
                        background: 'linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.6) 50%, transparent 100%)',
                        boxShadow: '0 0 10px rgba(34,211,238,0.5)',
                        transform: 'rotate(-15deg)',
                    }}
                    animate={{
                        x: ['0vw', '120vw'],
                        opacity: [0, 0.8, 0],
                    }}
                    transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: i * 2,
                        ease: "easeIn",
                    }}
                />
            ))}

            {/* Content */}
            <div className="relative z-10 w-full h-full">
                <HeroOverlay />
            </div>
        </section>
    )
}
