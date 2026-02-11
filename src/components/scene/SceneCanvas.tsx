'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useState } from 'react'
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities'
import { SpaceEnvironment } from './SpaceEnvironment'
import { ParticleField } from './ParticleField'
import { Astronaut } from './Astronaut'
import { CameraRig } from './CameraRig'
import { OrbitingLogo } from './OrbitingLogo'

// Fallback for low-end devices or initial load
const SceneLoader = () => (
    <div className="flex items-center justify-center text-amber-primary/50 text-sm">
        Initializing Mission...
    </div>
)

export default function SceneCanvas() {
    const { tier } = useDeviceCapabilities()


    // Configuration based on device tier
    const config = {
        high: { stars: 6000, particles: 3000, dpr: [1, 2], antialias: true },
        mid: { stars: 3000, particles: 1500, dpr: [1, 1.5], antialias: true },
        low: { stars: 1000, particles: 800, dpr: [1, 1], antialias: false },
        potato: null, // Should render 2D fallback instead
    }

    const settings = config[tier]

    if (!settings) {
        return null // Return null to allow parent to render 2D fallback
    }

    return (
        <div className="absolute inset-0 z-0">
            <Canvas
                dpr={settings.dpr as [min: number, max: number]}
                gl={{
                    antialias: settings.antialias,
                    powerPreference: 'high-performance',
                    alpha: true,
                }}
                camera={{ position: [0, 0, 5], fov: 75 }}
                resize={{ scroll: false, debounce: { scroll: 50, resize: 50 } }}
            >
                <Suspense fallback={null}>
                    <color attach="background" args={['#003E44']} />
                    {/* Using project background color as base, but will be enhanced by SpaceEnvironment */}

                    <SpaceEnvironment starCount={settings.stars} />
                    <ParticleField count={settings.particles} />
                    <Astronaut />
                    <CameraRig />
                    <OrbitingLogo />
                </Suspense>
            </Canvas>
        </div>
    )
}
