'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { HeroOverlay } from './hero-overlay'
import { HelmetEffects } from './helmet-effects'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

const SceneCanvas = dynamic(() => import('../scene/SceneCanvas'), {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-[#022026]" />,
})

export function HeroSection() {
    const sectionRef = useRef<HTMLDivElement>(null)
    // State to cache dimensions for performance (prevents layout thrashing)
    const astronautContainerRef = useRef<HTMLDivElement>(null)
    const [containerRect, setContainerRect] = useState({ left: 0, top: 0, width: 0, height: 0 })

    useEffect(() => {
        const updateRect = () => {
            if (astronautContainerRef.current) {
                setContainerRect(astronautContainerRef.current.getBoundingClientRect())
            }
        }
        updateRect()
        window.addEventListener('resize', updateRect)
        return () => window.removeEventListener('resize', updateRect)
    }, [])

    // Only render decorative random elements on client to avoid hydration mismatch
    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => { setIsMounted(true) }, [])

    // Mouse position tracking
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    // Precise pixel tracking for spotlight - relative to the STATIC section
    const spotlightX = useMotionValue(0)
    const spotlightY = useMotionValue(0)

    // Ultra-smooth spring animations for a fluid, weightless feel
    const springConfig = { damping: 40, stiffness: 50 }
    const smoothMouseX = useSpring(mouseX, springConfig)
    const smoothMouseY = useSpring(mouseY, springConfig)

    // Snap-to-mouse spotlight: Higher stiffness, lower damping, no feedback loop coordinate logic
    const smoothSpotlightX = useSpring(spotlightX, { damping: 20, stiffness: 300 })
    const smoothSpotlightY = useSpring(spotlightY, { damping: 20, stiffness: 300 })

    // Inverted Parallax: Mouse Right (+1) -> Astronaut Left (-15px)
    // Decreased range and increased smoothing for a "premium" feel
    const astronautX = useTransform(smoothMouseX, [-1, 1], [15, -15])
    const astronautY = 0 // use standard container positioning

    // Minimal rotation for depth without jitter
    const astronautRotateX = useTransform(smoothMouseY, [-1, 1], [1.5, -1.5])
    const astronautRotateY = useTransform(smoothMouseX, [-1, 1], [-1.5, 1.5])

    // Handle mouse movement
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!sectionRef.current) return
        const rect = sectionRef.current.getBoundingClientRect()

        // Relative percentage (-1 to 1) for parallax
        const xNormalized = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
        const yNormalized = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
        mouseX.set(xNormalized)
        mouseY.set(yNormalized)

        // Spotlight coordinates relative to the STATIC SECTION top-left
        spotlightX.set(e.clientX - rect.left)
        spotlightY.set(e.clientY - rect.top)
    }

    // Spotlight intensity based on proximity to the visor
    const spotlightIntensity = useTransform(
        [smoothSpotlightX, smoothSpotlightY, astronautX],
        ([x, y, ax]: any) => {
            if (!containerRect.width) return 0
            // Targeted visor center in pixels relative to section
            const visorCenterX = containerRect.left + containerRect.width * 0.5 + ax
            const visorCenterY = containerRect.top + containerRect.height * 0.28

            const dist = Math.sqrt(Math.pow(x - visorCenterX, 2) + Math.pow(y - visorCenterY, 2))
            // Wider range: Show reflection if light is within 600px of visor
            return Math.pow(Math.max(0, 1 - dist / 600), 2.0)
        }
    )

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
            <div className="absolute inset-0 z-[5] pointer-events-none flex items-start justify-center lg:justify-end overflow-hidden pt-[10vh] lg:pt-[5vh]">
                <div ref={astronautContainerRef} className="relative w-full max-w-[600px] lg:max-w-[850px] h-[70vh] lg:h-[95vh] lg:translate-x-[5%] lg:translate-y-[5%]">
                    {/* Parallax Container for Images */}
                    <motion.div
                        className="relative w-full h-full"
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
                            ambientLight={spotlightIntensity}
                        />

                        {/* 0. Atmospheric Back-Glow (Behind Silhouette) - Simulates light scattering */}
                        <motion.div
                            className="absolute inset-0 pointer-events-none z-0"
                            style={{
                                background: useTransform(
                                    [smoothSpotlightX, smoothSpotlightY],
                                    ([x, y]: any) => {
                                        // Use cached containerRect instead of getBoundingClientRect()
                                        return `radial-gradient(600px circle at ${x - containerRect.left}px ${y - containerRect.top}px, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05) 40%, transparent 85%)`
                                    }
                                ),
                                mixBlendMode: 'screen',
                                filter: 'blur(10px)'
                            }}
                        />

                        {/* 1. Base Darkened Astronaut silhouette - Nearly Black */}
                        <motion.img
                            src="/images/photorealistic_astronaut.png"
                            alt="Astronaut Silhouette"
                            className="absolute inset-0 w-full h-full object-contain grayscale brightness-0 contrast-150 z-[10]"
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
                                transformStyle: 'preserve-3d',
                            }}
                        />

                        {/* 2. Revealed Bright Astronaut (Masked by Spotlight) - High Contrast Metallic LUT */}
                        <motion.img
                            src="/images/photorealistic_astronaut.png"
                            alt="Astronaut Foreground"
                            className="absolute inset-0 w-full h-full object-contain z-[12]"
                            style={{
                                // High Fidelity Lighting - No digital grain
                                filter: 'brightness(1.5) contrast(1.4) saturate(1.1) drop-shadow(0 0 40px rgba(255,255,255,0.08))',
                                maskImage: useTransform(
                                    [smoothSpotlightX, smoothSpotlightY, astronautX],
                                    ([x, y, ax]: any) => {
                                        if (!astronautContainerRef.current) return 'none'
                                        const astroRect = astronautContainerRef.current.getBoundingClientRect()
                                        return `radial-gradient(450px circle at ${x - astroRect.left + (window?.scrollX || 0)}px ${y - astroRect.top + (window?.scrollY || 0)}px, black 0%, rgba(0,0,0,0.8) 35%, rgba(0,0,0,0.2) 70%, transparent 90%)`
                                    }
                                ),
                                WebkitMaskImage: useTransform(
                                    [smoothSpotlightX, smoothSpotlightY, astronautX],
                                    ([x, y, ax]: any) => {
                                        if (!astronautContainerRef.current) return 'none'
                                        const astroRect = astronautContainerRef.current.getBoundingClientRect()
                                        return `radial-gradient(450px circle at ${x - astroRect.left + (window?.scrollX || 0)}px ${y - astroRect.top + (window?.scrollY || 0)}px, black 0%, rgba(0,0,0,0.8) 35%, rgba(0,0,0,0.2) 70%, transparent 90%)`
                                    }
                                ),
                            }}
                        />

                        {/* 3. Rim Lighting (Edge separation) - High intensity white rim */}
                        <motion.img
                            src="/images/photorealistic_astronaut.png"
                            alt="Astronaut Rim Light"
                            className="absolute inset-0 w-full h-full object-contain z-[13] mix-blend-plus-lighter opacity-80"
                            style={{
                                filter: 'brightness(5) contrast(2.2) grayscale(1) blur(0.8px)', // Softer rim
                                maskImage: useTransform(
                                    [smoothSpotlightX, smoothSpotlightY, astronautX],
                                    ([x, y, ax]: any) => {
                                        // Use cached dimensions
                                        return `radial-gradient(430px circle at ${x - containerRect.left}px ${y - containerRect.top}px, black 0%, rgba(0,0,0,0.4) 40%, transparent 70%)`
                                    }
                                ),
                                WebkitMaskImage: useTransform(
                                    [smoothSpotlightX, smoothSpotlightY, astronautX],
                                    ([x, y, ax]: any) => {
                                        return `radial-gradient(430px circle at ${x - containerRect.left}px ${y - containerRect.top}px, black 0%, rgba(0,0,0,0.4) 40%, transparent 70%)`
                                    }
                                ),
                            }}
                        />
                    </motion.div>

                    {/* Spotlight Layers - Refined Multi-Layer Specularity */}
                    <div ref={astronautContainerRef} className="absolute inset-0 pointer-events-none">
                        {/* Layer 2: Wide Soft Glow */}
                        <motion.div
                            className="absolute inset-0 z-[12] mix-blend-screen opacity-40"
                            style={{
                                background: useTransform(
                                    [smoothSpotlightX, smoothSpotlightY],
                                    ([x, y]: any) => {
                                        if (!astronautContainerRef.current) return 'none'
                                        const astroRect = astronautContainerRef.current.getBoundingClientRect()
                                        return `radial-gradient(450px circle at ${x - astroRect.left}px ${y - astroRect.top}px, rgba(255, 255, 255, 0.4), transparent 70%)`
                                    }
                                ),
                            }}
                        />
                        {/* Layer 3: Sharp Hotspot (Direct Light Source Center) */}
                        <motion.div
                            className="absolute inset-0 z-[13] mix-blend-plus-lighter opacity-80"
                            style={{
                                background: useTransform(
                                    [smoothSpotlightX, smoothSpotlightY],
                                    ([x, y]: any) => {
                                        if (!astronautContainerRef.current) return 'none'
                                        const astroRect = astronautContainerRef.current.getBoundingClientRect()
                                        return `radial-gradient(100px circle at ${x - astroRect.left}px ${y - astroRect.top}px, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.4) 40%, transparent 80%)`
                                    }
                                ),
                            }}
                        />

                        {/* 4. PHOTOREALISTIC NEBULAR VISOR REFLECTION */}
                        {/* Layer A: Multi-color Nebular Base with Grain */}
                        <motion.div
                            className="absolute inset-0 z-[14] mix-blend-screen"
                            style={{
                                background: useTransform(
                                    [smoothSpotlightX, smoothSpotlightY, astronautX],
                                    ([x, y, ax]: any) => {
                                        if (!astronautContainerRef.current) return 'none'
                                        const astroRect = astronautContainerRef.current.getBoundingClientRect()
                                        // NEW ASSET: Centered Symmetrical Visor Mapping
                                        const visorCenterX = astroRect.width * 0.5 + ax // Symmetrical center
                                        const visorCenterY = astroRect.height * 0.28 // Corrected height for new helmet
                                        const dist = Math.sqrt(Math.pow(x - astroRect.left - visorCenterX, 2) + Math.pow(y - astroRect.top - visorCenterY, 2))
                                        const intensity = Math.pow(Math.max(0, 1 - dist / 300), 1.2)
                                        return `radial-gradient(350px circle at ${x - astroRect.left}px ${y - astroRect.top}px, rgba(236, 72, 153, ${0.4 * intensity}), rgba(59, 130, 246, ${0.3 * intensity}) 60%, transparent 100%)`
                                    }
                                ),
                                filter: 'blur(35px)',
                            }}
                        >
                            {/* SVG Noise Filter for realistic material grain */}
                            <div
                                className="absolute inset-0 opacity-[0.2] mix-blend-overlay"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                                }}
                            />
                        </motion.div>
                        {/* Layer B: Micro-Specular Hotspot (Visor) with Procedural Noise */}
                        <motion.div
                            className="absolute inset-0 z-[15] mix-blend-plus-lighter"
                            style={{
                                // Transparent glossy layer
                                opacity: 0.6,
                                background: useTransform(
                                    [smoothSpotlightX, smoothSpotlightY, astronautX],
                                    ([x, y, ax]: any) => {
                                        if (!astronautContainerRef.current) return 'none'
                                        const astroRect = astronautContainerRef.current.getBoundingClientRect()
                                        const visorCenterX = astroRect.width * 0.5 + ax
                                        const visorCenterY = astroRect.height * 0.28
                                        const dist = Math.sqrt(Math.pow(x - astroRect.left - visorCenterX, 2) + Math.pow(y - astroRect.top - visorCenterY, 2))
                                        const intensity = Math.pow(Math.max(0, 1 - dist / 180), 4)

                                        return `radial-gradient(50px circle at ${x - astroRect.left}px ${y - astroRect.top}px, rgba(255, 255, 255, ${intensity}), rgba(255, 255, 255, 0) 80%)`
                                    }
                                ),
                            }}
                        />
                        {/* Layer C: Glossy Surface Glint (Micro-Detail) */}
                        <motion.div
                            className="absolute inset-0 z-[16] mix-blend-screen"
                            style={{
                                background: useTransform(
                                    [smoothSpotlightX, smoothSpotlightY, astronautX],
                                    ([x, y, ax]: any) => {
                                        if (!astronautContainerRef.current) return 'none'
                                        const astroRect = astronautContainerRef.current.getBoundingClientRect()
                                        const visorCenterX = astroRect.width * 0.5 + ax
                                        const visorCenterY = astroRect.height * 0.35
                                        const dist = Math.sqrt(Math.pow(x - astroRect.left - visorCenterX, 2) + Math.pow(y - astroRect.top - visorCenterY, 2))
                                        const intensity = Math.pow(Math.max(0, 1 - dist / 300), 2)

                                        return `radial-gradient(150px circle at ${x - astroRect.left - 15}px ${y - astroRect.top - 15}px, rgba(255, 255, 255, ${0.3 * intensity}), transparent 80%)`
                                    }
                                ),
                            }}
                        />
                    </div>
                </div>
            </div>

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
            {
                [...Array(3)].map((_, i) => (
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
                ))
            }

            {/* Bottom fade to next section */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 z-[2] bg-gradient-to-t from-[#022026] to-transparent" />

            {/* Ambient Floating Particles - client only to avoid hydration mismatch */}
            {
                isMounted && [...Array(20)].map((_, i) => {
                    const randomX = Math.random() * 100
                    const randomY = Math.random() * 100
                    const randomDelay = Math.random() * 5
                    const randomDuration = 8 + Math.random() * 12
                    const randomSize = 1 + Math.random() * 3
                    const isGold = i % 3 === 0
                    const driftX = Math.random() * 20 - 10

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
                                x: [0, driftX, 0],
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
                })
            }

            {/* Light Streaks - client only to avoid hydration mismatch */}
            {
                isMounted && [...Array(5)].map((_, i) => (
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
                ))
            }

            {/* Content */}
            <div className="relative z-10 w-full h-full">
                <HeroOverlay />
            </div>
            {/* Procedural Texture Filters (Hidden SVG) */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs />
            </svg>
        </section>
    )
}
