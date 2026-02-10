'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

// ============================================
// STAR FIELD - Animated Twinkling Stars
// ============================================
export function StarField({ count = 40 }: { count?: number }) {
    const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; delay: number }>>([])

    useEffect(() => {
        // Reduced max count for mobile performance
        const generatedStars = Array.from({ length: count }, () => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 2 + 1,
            delay: Math.random() * 3,
        }))
        setStars(generatedStars)
    }, [count])

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {stars.map((star, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full bg-white"
                    style={{
                        left: `${star.x}%`,
                        top: `${star.y}%`,
                        width: star.size,
                        height: star.size,
                        willChange: 'opacity', // Hint to browser
                    }}
                    animate={{
                        opacity: [0.2, 0.8, 0.2], // Removed scale animation for performance
                    }}
                    transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: star.delay,
                    }}
                />
            ))}
        </div>
    )
}

// ============================================
// NEBULA - Gradient Cloud Effects
// ============================================
export function Nebula() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Cyan Nebula - Reduced Blur */}
            <motion.div
                className="absolute w-[600px] h-[600px] rounded-full opacity-20"
                style={{
                    background: 'radial-gradient(circle, rgba(0,212,255,0.4) 0%, transparent 70%)',
                    left: '60%',
                    top: '20%',
                    filter: 'blur(40px)', // Reduced from 60px
                    willChange: 'transform',
                }}
                animate={{
                    scale: [1, 1.1, 1], // Reduced scale range
                    x: [0, 20, 0],
                    y: [0, -10, 0],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: 'linear', // Simplified ease
                }}
            />
            {/* Golden Nebula - Reduced Blur */}
            <motion.div
                className="absolute w-[500px] h-[500px] rounded-full opacity-15"
                style={{
                    background: 'radial-gradient(circle, rgba(255,215,0,0.5) 0%, rgba(249,115,22,0.3) 50%, transparent 70%)',
                    left: '10%',
                    bottom: '10%',
                    filter: 'blur(50px)', // Reduced from 80px
                    willChange: 'transform',
                }}
                animate={{
                    scale: [1.1, 1, 1.1],
                    x: [0, -10, 0],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />
            {/* Deep Purple Nebula - Reduced Blur */}
            <motion.div
                className="absolute w-[400px] h-[400px] rounded-full opacity-10"
                style={{
                    background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
                    right: '20%',
                    bottom: '30%',
                    filter: 'blur(40px)', // Reduced from 70px
                    willChange: 'transform',
                }}
                animate={{
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />
        </div>
    )
}

// ============================================
// FLOATING PLANETS
// ============================================
export function FloatingPlanets() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Small Planet 1 */}
            <motion.div
                className="absolute w-8 h-8 rounded-full"
                style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #F97316 100%)',
                    boxShadow: '0 0 20px rgba(255,215,0,0.5)',
                    right: '15%',
                    top: '25%',
                }}
                animate={{
                    y: [0, -20, 0],
                    rotate: [0, 360],
                }}
                transition={{
                    y: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
                    rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                }}
            />
            {/* Small Planet 2 */}
            <motion.div
                className="absolute w-5 h-5 rounded-full"
                style={{
                    background: 'linear-gradient(135deg, #00D4FF 0%, #0EA5E9 100%)',
                    boxShadow: '0 0 15px rgba(0,212,255,0.5)',
                    left: '10%',
                    top: '40%',
                }}
                animate={{
                    y: [0, 15, 0],
                    x: [0, 10, 0],
                }}
                transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
            {/* Ring Planet */}
            <motion.div
                className="absolute w-12 h-12 rounded-full"
                style={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    boxShadow: '0 0 25px rgba(139,92,246,0.4)',
                    left: '5%',
                    bottom: '20%',
                }}
                animate={{
                    y: [0, -10, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            >
                {/* Ring */}
                <div
                    className="absolute w-20 h-4 border-2 border-purple-400/50 rounded-full"
                    style={{
                        left: '-40%',
                        top: '35%',
                        transform: 'rotateX(60deg)',
                    }}
                />
            </motion.div>
        </div>
    )
}

// ============================================
// SHOOTING STARS
// ============================================
export function ShootingStars() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(3)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    style={{
                        left: `${20 + i * 30}%`,
                        top: `${10 + i * 15}%`,
                        boxShadow: '0 0 6px 2px rgba(255,255,255,0.8)',
                    }}
                    animate={{
                        x: [0, 200],
                        y: [0, 100],
                        opacity: [0, 1, 0],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 4 + 2,
                        repeatDelay: 8,
                    }}
                >
                    {/* Trail */}
                    <div
                        className="absolute w-20 h-[1px] bg-gradient-to-r from-white to-transparent"
                        style={{
                            right: '100%',
                            top: '50%',
                            transform: 'translateY(-50%) rotate(-25deg)',
                        }}
                    />
                </motion.div>
            ))}
        </div>
    )
}

// ============================================
// ASTRONAUT FLOATING ELEMENT
// ============================================
export function FloatingAstronaut({ imageSrc }: { imageSrc?: string }) {
    return (
        <motion.div
            className="relative"
            animate={{
                y: [0, -20, 0],
            }}
            transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
        >
            {imageSrc ? (
                <img
                    src={imageSrc}
                    alt="Astronaut"
                    className="w-full h-auto max-w-md drop-shadow-xl"
                    style={{
                        filter: 'drop-shadow(0 0 20px rgba(0,212,255,0.3))', // Reduced from 40px
                    }}
                />
            ) : (
                // Placeholder astronaut silhouette
                <div className="w-80 h-96 relative">
                    <div
                        className="absolute inset-0 rounded-3xl"
                        style={{
                            background: 'linear-gradient(180deg, #2a3f5f 0%, #1a2744 100%)',
                            boxShadow: '0 0 60px rgba(0,212,255,0.2)',
                        }}
                    />
                    {/* Helmet visor glow */}
                    <div
                        className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,215,0,0.4) 0%, rgba(249,115,22,0.3) 100%)',
                            boxShadow: '0 0 40px rgba(255,215,0,0.5)',
                        }}
                    />
                </div>
            )}
            {/* Glow effect */}
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    background: 'radial-gradient(circle at 50% 30%, rgba(0,212,255,0.3) 0%, transparent 60%)',
                }}
            />
        </motion.div>
    )
}

// ============================================
// COSMIC GRID LINES
// ============================================
export function CosmicGrid() {
    return (
        <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
                backgroundImage: `
                    linear-gradient(rgba(255,215,0,0.3) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,215,0,0.3) 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px',
            }}
        />
    )
}

// ============================================
// GRADIENT TEXT
// ============================================
export function GradientText({
    children,
    className = '',
    variant = 'golden'
}: {
    children: React.ReactNode
    className?: string
    variant?: 'golden' | 'cyan' | 'mixed'
}) {
    const gradients = {
        golden: 'from-yellow-300 via-yellow-400 to-orange-500',
        cyan: 'from-cyan-300 via-cyan-400 to-blue-500',
        mixed: 'from-yellow-300 via-orange-400 to-cyan-400',
    }

    return (
        <span className={`bg-gradient-to-r ${gradients[variant]} bg-clip-text text-transparent ${className}`}>
            {children}
        </span>
    )
}
