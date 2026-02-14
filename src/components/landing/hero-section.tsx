'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { HeroOverlay } from './hero-overlay'

const SceneCanvas = dynamic(() => import('@/components/scene/SceneCanvas'), {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-[#003E44]" />,
})

export function HeroSection() {
    return (
        <section className="relative min-h-[100dvh] w-full overflow-hidden bg-[#003E44]">
            {/* 3D Background */}
            <div className="absolute inset-0 z-0">
                <Suspense fallback={<div className="absolute inset-0 bg-[#003E44]" />}>
                    <SceneCanvas />
                </Suspense>
            </div>

            {/* Cinematic vignette */}
            <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_30%,#003E44_100%)]" />

            {/* Subtle scan-lines for sci-fi feel */}
            <div
                className="pointer-events-none absolute inset-0 z-[1] opacity-[0.03]"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
                }}
            />

            {/* Bottom fade to next section */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 z-[2] bg-gradient-to-t from-[#003E44] to-transparent" />

            {/* Content */}
            <div className="relative z-10 w-full h-full">
                <HeroOverlay />
            </div>
        </section>
    )
}
