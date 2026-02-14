'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities'
import { SpaceEnvironment } from './SpaceEnvironment'
import { ParticleField } from './ParticleField'
import { Astronaut } from './Astronaut'
import { CameraRig } from './CameraRig'
import { OrbitingLogo } from './OrbitingLogo'
import { MoonBase } from './MoonBase'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

export default function SceneCanvas() {
    const { tier } = useDeviceCapabilities()

    // Reduced star/particle counts for a softer, cleaner look
    const config = {
        high: { stars: 2000, particles: 800, dpr: [1, 2], antialias: false, post: true },
        mid: { stars: 1200, particles: 500, dpr: [1, 1.5], antialias: false, post: true },
        low: { stars: 600, particles: 300, dpr: [1, 1], antialias: true, post: false },
        potato: null,
    }

    // @ts-ignore - Config indexing
    const settings = config[tier]

    if (!settings) {
        return null
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

                    <SpaceEnvironment starCount={settings.stars} />
                    <ParticleField count={settings.particles} />
                    <MoonBase />
                    <Astronaut />
                    <CameraRig />
                    <OrbitingLogo />

                    {/* Post Processing Effects - Cinematic Finish */}
                    {settings.post && (
                        <EffectComposer enabled={true}>
                            <Bloom
                                luminanceThreshold={0.9}
                                mipmapBlur
                                intensity={1.0}
                                radius={0.4}
                            />
                            <Vignette eskil={false} offset={0.1} darkness={1.1} />
                        </EffectComposer>
                    )}
                </Suspense>
            </Canvas>
        </div>
    )
}
