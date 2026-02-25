'use client'

import { motion, useReducedMotion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import dynamic from 'next/dynamic'
import { HeroOverlay } from './hero-overlay'
import { CustomCursor } from './custom-cursor'
import { useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { HelmetEffects } from './helmet-effects'

/* ─── seeded RNG for deterministic star positions (no hydration mismatch) ─── */
function seededRandom(seed: number): number {
    const x = Math.sin(seed * 9301 + 49297) * 49297
    return x - Math.floor(x)
}

export function HeroSection() {
    const prefersReducedMotion = useReducedMotion()
    const locale = useLocale()
    const isAr = locale === 'ar'
    const sectionRef = useRef<HTMLDivElement>(null)
    const astronautContainerRef = useRef<HTMLDivElement>(null)

    // Only render decorative random elements on client to avoid hydration mismatch
    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => { setIsMounted(true) }, [])

    // Mouse position tracking
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    // Ultra-smooth spring animations
    const springConfig = { damping: 40, stiffness: 50 }
    const smoothMouseX = useSpring(mouseX, springConfig)
    const smoothMouseY = useSpring(mouseY, springConfig)

    // Handle mouse movement
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!sectionRef.current) return
        const rect = sectionRef.current.getBoundingClientRect()
        const xNormalized = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
        const yNormalized = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
        mouseX.set(xNormalized)
        mouseY.set(yNormalized)
    }

    return (
        <section
            ref={sectionRef}
            onMouseMove={handleMouseMove}
            className="relative min-h-[100dvh] w-full overflow-hidden bg-transparent"
        >
            {/* Custom red-dot cursor */}
            <CustomCursor />

            {/* 3D Background - Now Global */}
            <div className="absolute inset-0 z-0" />

            {/* Hero Image with Advanced Helmet Effects */}
            <div className="absolute inset-0 z-[5] pointer-events-none flex items-start justify-center lg:justify-end overflow-hidden pt-[10vh] lg:pt-[5vh]">
                <div
                    ref={astronautContainerRef}
                    className={`relative w-full max-w-[600px] lg:max-w-[850px] h-[70vh] lg:h-[95vh] lg:translate-y-[5%] ${isAr ? 'lg:-translate-x-[15%]' : 'lg:translate-x-[5%]'
                        }`}
                >
                    {/* Parallax Container for Images */}
                    <motion.div
                        className="relative w-full h-full"
                        style={{
                            x: useTransform(smoothMouseX, [-1, 1], [15, -15]),
                            transformStyle: 'preserve-3d',
                        }}
                    >
                        <HelmetEffects />

                        {/* Full Detail Photorealistic Astronaut */}
                        <motion.img
                            src="/images/astronaut_hero.png"
                            alt="Astronaut Hero"
                            className="absolute inset-0 w-full h-full object-contain z-[12]"
                            style={{
                                filter: 'brightness(1.1) contrast(1.1) saturate(1.05) drop-shadow(0 0 30px rgba(0,0,0,0.5))',
                                scaleX: isAr ? 1 : -1,
                            }}
                        />
                    </motion.div>
                </div>
            </div>

            {/* Dynamic Energy Field */}
            <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                animate={{
                    opacity: [0, 0.15, 0],
                    scale: [0.95, 1.05, 0.95],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 30%, rgba(251,191,36,0.1) 50%, transparent 100%)',
                    filter: 'blur(15px)',
                }}
            />

            {/* Pulsating Aura */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                    x: useTransform(smoothMouseX, [-1, 1], [5, -5]),
                    y: useTransform(smoothMouseY, [-1, 1], [5, -5]),
                }}
            >
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] rounded-full"
                    animate={{
                        opacity: [0.05, 0.1, 0.05],
                        scale: [0.98, 1.02, 0.98],
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.1) 0%, transparent 70%)',
                        filter: 'blur(20px)',
                    }}
                />
                {/* Secondary cyan aurora */}
                <div
                    className="absolute -bottom-[10%] -right-[10%] w-[70%] h-[60%]"
                    style={{
                        background: 'radial-gradient(ellipse 60% 45% at 70% 60%, rgba(56,189,248,0.04) 0%, transparent 55%)',
                        animation: prefersReducedMotion ? 'none' : 'hero-aurora 22s ease-in-out 4s infinite',
                        filter: 'blur(70px)',
                    }}
                />
                {/* Faint purple nebula accent */}
                <div
                    className="absolute top-[30%] right-[5%] w-[40%] h-[40%]"
                    style={{
                        background: 'radial-gradient(circle at 50% 50%, rgba(168,85,247,0.035) 0%, transparent 50%)',
                        animation: prefersReducedMotion ? 'none' : 'hero-aurora 25s ease-in-out 8s infinite',
                        filter: 'blur(50px)',
                    }}
                />
            </motion.div>

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
                className="pointer-events-none absolute inset-0 z-[2] opacity-20"
                style={{
                    background: useTransform(
                        [smoothMouseX, smoothMouseY],
                        ([x, y]: number[]) =>
                            `radial-gradient(circle at ${50 + x * 10}% ${50 + y * 10}%, rgba(251,191,36,0.05) 0%, transparent 60%)`
                    ),
                }}
            />

            {/* Subtle grid pattern overlay */}
            <div
                className="pointer-events-none absolute inset-0 z-[1]"
                aria-hidden="true"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: '80px 80px',
                    maskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black 20%, transparent 70%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black 20%, transparent 70%)',
                    animation: prefersReducedMotion ? 'none' : 'hero-grid-fade 8s ease-in-out infinite',
                }}
            />

            {/* Bottom fade to next section */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 z-[2] bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
            {/* Top vignette */}
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-32 z-[2] bg-gradient-to-b from-[#050505]/60 to-transparent" />

            {/* Ambient Floating Particles - client only to avoid hydration mismatch */}
            {isMounted && [...Array(8)].map((_, i) => (
                <motion.div
                    key={`ambient-particle-${i}`}
                    className="pointer-events-none absolute rounded-full z-[3]"
                    style={{
                        left: `${seededRandom(i * 3) * 100}%`,
                        top: `${seededRandom(i * 3 + 1) * 100}%`,
                        width: `${1 + seededRandom(i * 3 + 2) * 2}px`,
                        height: `${1 + seededRandom(i * 3 + 2) * 2}px`,
                        background: i % 3 === 0
                            ? 'rgba(251,191,36,0.4)'
                            : 'rgba(34,211,238,0.4)',
                    }}
                    animate={{
                        y: [0, -20, 0],
                        opacity: [0, 0.4, 0],
                        scale: [0, 1, 0],
                    }}
                    transition={{
                        duration: 10 + seededRandom(i) * 10,
                        repeat: Infinity,
                        delay: seededRandom(i + 5) * 5,
                        ease: "linear",
                    }}
                />
            ))}

            {/* Light Streaks - client only to avoid hydration mismatch */}
            {isMounted && [...Array(2)].map((_, i) => (
                <motion.div
                    key={`streak-${i}`}
                    className="pointer-events-none absolute h-[1px] z-[3]"
                    style={{
                        width: `${150}px`,
                        top: `${20 + i * 40}%`,
                        left: `-200px`,
                        background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.3), transparent)',
                        transform: 'rotate(-15deg)',
                    }}
                    animate={{
                        x: ['0vw', '120vw'],
                        opacity: [0, 0.4, 0],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: i * 3,
                        ease: "linear",
                    }}
                />
            ))}

            {/* Content */}
            <div className="relative z-10 w-full h-full">
                <HeroOverlay />
            </div>

            {/* Scroll indicator */}
            {!prefersReducedMotion && (
                <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5, duration: 1 }}
                >
                    <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/25">
                        Scroll
                    </span>
                    <motion.div
                        animate={{ y: [0, 6, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <ChevronDown className="h-4 w-4 text-white/20" />
                    </motion.div>
                    <div className="w-[1px] h-8 bg-gradient-to-b from-white/15 to-transparent" />
                </motion.div>
            )}

            {/* Procedural Texture Filters (Hidden SVG) */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs />
            </svg>
        </section >
    )
}
