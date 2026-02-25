'use client'

import { useRef } from 'react'
import { useLocale } from 'next-intl'
import { HeroOverlay } from './hero-overlay'
import { ChevronDown } from 'lucide-react'

export function HeroSection() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const sectionRef = useRef<HTMLDivElement>(null)

    return (
        <section
            ref={sectionRef}
            className="relative min-h-[100dvh] w-full overflow-hidden bg-transparent"
        >
            {/* 3D Background - Now Global */}
            <div className="absolute inset-0 z-0" />

            {/* Hero Image */}
            <div className="absolute inset-0 z-[5] pointer-events-none flex items-start justify-center lg:justify-end overflow-hidden pt-[10vh] lg:pt-[5vh]">
                <div
                    className={`relative w-full max-w-[600px] lg:max-w-[850px] h-[70vh] lg:h-[95vh] lg:translate-y-[5%] ${isAr ? 'lg:-translate-x-[15%]' : 'lg:translate-x-[5%]'
                        }`}
                >
                    <div className="relative w-full h-full">
                        {/* Full Detail Photorealistic Astronaut - STATIC */}
                        <img
                            src="/images/astronaut_hero.png"
                            alt="Astronaut Hero"
                            className="absolute inset-0 w-full h-full object-contain z-[12]"
                            style={{
                                filter: 'brightness(1.1) contrast(1.1) saturate(1.05) drop-shadow(0 0 30px rgba(0,0,0,0.5))',
                                transform: isAr ? 'scaleX(1)' : 'scaleX(-1)',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Cinematic vignette */}
            <div
                className="pointer-events-none absolute inset-0 z-[1]"
                style={{
                    background: 'radial-gradient(ellipse at center,transparent 30%,#022026 100%)',
                }}
            />


            {/* Top vignette */}
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-32 z-[2] bg-gradient-to-b from-[#050505]/60 to-transparent" />

            {/* Content */}
            <div className="relative z-10 w-full h-full">
                <HeroOverlay />
            </div>

            {/* Scroll indicator - Static */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
                <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/25">
                    Scroll
                </span>
                <ChevronDown className="h-4 w-4 text-white/20" />
                <div className="w-[1px] h-8 bg-gradient-to-b from-white/15 to-transparent" />
            </div>

            {/* Procedural Texture Filters (Hidden SVG) */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs />
            </svg>
        </section >
    )
}
