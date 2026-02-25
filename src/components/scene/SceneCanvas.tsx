'use client'

import { useLocale } from 'next-intl'

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { useDeviceCapabilities } from '@/hooks/use-device-capabilities'
import * as THREE from 'three'
import { SpaceEnvironment } from './SpaceEnvironment'
import { ParticleField } from './ParticleField'
import { Astronaut } from './Astronaut'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'

export default function SceneCanvas() {
    const locale = useLocale()
    const { tier } = useDeviceCapabilities()

    // Configuration for performance tiers
    const config = {
        high: { stars: 800, particles: 200, dpr: [1, 1.5], antialias: true, post: true },
        mid: { stars: 400, particles: 100, dpr: [1, 1], antialias: false, post: true },
        low: { stars: 150, particles: 50, dpr: [1, 1], antialias: false, post: false },
        potato: null,
    }

    const settings = config[tier as keyof typeof config]

    if (!settings) {
        return null
    }

    return (
        <div className="absolute inset-0 z-0 bg-black">
            <Canvas
                dpr={settings.dpr as [min: number, max: number]}
                gl={{
                    antialias: settings.antialias,
                    powerPreference: 'high-performance',
                    alpha: false,
                    stencil: false,
                    depth: true,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.0
                }}
                // Camera positioned for right-side astronaut composition
                camera={{ position: [0, 0.3, 4.0], fov: 40 }}
                resize={{ scroll: false, debounce: { scroll: 100, resize: 100 } }}
            >
                <Suspense fallback={null}>
                    <color attach="background" args={['#022026']} />

                    {/* Subtle Background Elements */}
                    <SpaceEnvironment starCount={settings.stars} />
                    <ParticleField count={settings.particles} />

                    {/* Post Processing Effects - Cinematic Finish */}
                    {settings.post && (
                        <EffectComposer disableNormalPass>
                            <Bloom
                                luminanceThreshold={0.4}
                                intensity={0.5}
                                radius={0.4}
                            />
                            <Vignette eskil={false} offset={0.5} darkness={0.4} />
                        </EffectComposer>
                    )}
                </Suspense>
            </Canvas>
        </div>
    )
}
