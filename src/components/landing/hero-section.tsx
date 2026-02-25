'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { HeroOverlay } from './hero-overlay'
import { CustomCursor } from './custom-cursor'
import { useMemo } from 'react'
import { ChevronDown } from 'lucide-react'

/* ─── seeded RNG for deterministic star positions (no hydration mismatch) ─── */
function seededRandom(seed: number): number {
    const x = Math.sin(seed * 9301 + 49297) * 49297
    return x - Math.floor(x)
}

export function HeroSection() {
    const prefersReducedMotion = useReducedMotion()

    /* ─── Stars layer ─── */
    const stars = useMemo(
        () =>
            Array.from({ length: 65 }, (_, i) => {
                const size = seededRandom(i * 7 + 3) * 2.2 + 0.6
                const delay = seededRandom(i * 7 + 4) * 4
                const dur = 2.5 + seededRandom(i * 7 + 5) * 3
                return {
                    x: `${(seededRandom(i * 7 + 1) * 100).toFixed(6)}%`,
                    y: `${(seededRandom(i * 7 + 2) * 100).toFixed(6)}%`,
                    size: `${size.toFixed(6)}px`,
                    delay,
                    dur,
                    animation: `hero-twinkle ${dur.toFixed(6)}s ease-in-out ${delay.toFixed(6)}s infinite`,
                }
            }),
        [],
    )

    return (
        <section className="relative min-h-[100dvh] w-full overflow-hidden bg-[#050505]">
            {/* Custom red-dot cursor */}
            <CustomCursor />

            {/* ── CSS Keyframes ────────────────────────────────────────── */}
            <style>{`
                @keyframes hero-twinkle {
                    0%, 100% { opacity: 0.15; transform: scale(1); }
                    50%      { opacity: 0.85; transform: scale(1.25); }
                }
                @keyframes hero-aurora {
                    0%   { transform: translateX(-10%) rotate(0deg)   scale(1);   opacity: 0.32; }
                    33%  { transform: translateX(5%)  rotate(2deg)   scale(1.08); opacity: 0.45; }
                    66%  { transform: translateX(-5%) rotate(-1deg)  scale(0.95); opacity: 0.28; }
                    100% { transform: translateX(-10%) rotate(0deg)   scale(1);   opacity: 0.32; }
                }
                @keyframes hero-grid-fade {
                    0%, 100% { opacity: 0.025; }
                    50%      { opacity: 0.06;  }
                }
                @keyframes hero-shooting {
                    0%   { transform: translate(0, 0) rotate(-35deg); opacity: 0; width: 0; }
                    10%  { opacity: 1; width: 80px; }
                    100% { transform: translate(320px, 160px) rotate(-35deg); opacity: 0; width: 0; }
                }
            `}</style>

            {/* ── 1. Starfield ─────────────────────────────────────────── */}
            <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
                {stars.map((s, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-white"
                        style={{
                            left: s.x,
                            top: s.y,
                            width: s.size,
                            height: s.size,
                            animation: prefersReducedMotion ? 'none' : s.animation,
                            opacity: 0.3,
                        }}
                    />
                ))}
                {/* Shooting stars */}
                {!prefersReducedMotion && [0, 1].map((i) => (
                    <div
                        key={`shoot-${i}`}
                        className="absolute h-[1px] bg-gradient-to-r from-transparent via-white to-transparent"
                        style={{
                            top: `${15 + i * 25}%`,
                            left: `${10 + i * 40}%`,
                            animation: `hero-shooting ${3 + i * 2}s ease-out ${2 + i * 5}s infinite`,
                        }}
                    />
                ))}
            </div>

            {/* ── 2. Aurora gradient mesh ──────────────────────────────── */}
            <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
                {/* Primary golden aurora */}
                <div
                    className="absolute -top-[20%] -left-[10%] w-[80%] h-[70%]"
                    style={{
                        background: 'radial-gradient(ellipse 70% 50% at 30% 30%, rgba(251,191,36,0.06) 0%, transparent 60%)',
                        animation: prefersReducedMotion ? 'none' : 'hero-aurora 18s ease-in-out infinite',
                        filter: 'blur(60px)',
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
            </div>

            {/* ── 3. Subtle grid pattern overlay ──────────────────────── */}
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

            {/* ── 4. Noise texture overlay ────────────────────────────── */}
            <div
                className="pointer-events-none absolute inset-0 z-[1] mix-blend-soft-light opacity-[0.03]"
                aria-hidden="true"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '128px 128px',
                }}
            />

            {/* ── Bottom fade to next section ─────────────────────────── */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 z-[2] bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
            {/* Top vignette */}
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-32 z-[2] bg-gradient-to-b from-[#050505]/60 to-transparent" />

            {/* ── Content ─────────────────────────────────────────────── */}
            <div className="relative z-10 w-full h-full">
                <HeroOverlay />
            </div>

            {/* ── Scroll indicator ────────────────────────────────────── */}
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
        </section>
    )
}
