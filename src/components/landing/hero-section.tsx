'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { HeroOverlay } from './hero-overlay'

// Dynamically import SceneCanvas to avoid SSR issues with Three.js
const SceneCanvas = dynamic(() => import('@/components/scene/SceneCanvas'), {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-[#003E44]" />,
})

export function HeroSection() {
    return (
        <section className="relative min-h-screen w-full overflow-hidden bg-[#003E44]">
            {/* 3D Background Layer */}
            <div className="absolute inset-0 z-0">
                <Suspense fallback={<div className="absolute inset-0 bg-[#003E44]" />}>
                    <SceneCanvas />
                </Suspense>
            </div>

            {/* Vignette Overlay for Depth */}
            <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-radial from-transparent via-transparent to-[#003E44]/80" />

            {/* Content Layer */}
            <HeroOverlay />
        </section>
    )
}
