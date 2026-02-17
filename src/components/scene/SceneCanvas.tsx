'use client'

import { useLocale } from 'next-intl'

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities'
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
        high: { stars: 1500, particles: 400, dpr: [1, 2], antialias: true, post: true },
        mid: { stars: 800, particles: 200, dpr: [1, 1.5], antialias: false, post: true },
        low: { stars: 300, particles: 100, dpr: [1, 1], antialias: false, post: false },
        potato: null,
    }

    // @ts-ignore - Config indexing
    const settings = config[tier]

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
                    toneMappingExposure: 1.2
                }}
                // Camera positioned for right-side astronaut composition
                camera={{ position: [0, 0.3, 4.0], fov: 40 }}
                resize={{ scroll: false, debounce: { scroll: 50, resize: 50 } }}
            >
                <Suspense fallback={null}>
                    <color attach="background" args={['#000000']} />

                    {/* Subtle Background Elements */}
                    <SpaceEnvironment starCount={settings.stars} />
                    <ParticleField count={settings.particles} />

                    {/* Main Subject */}
                    <Astronaut isAr={locale === 'ar'} />

                    {/* Post Processing Effects - Cinematic Finish */}
                    {settings.post && (
                        <EffectComposer>
                            <Bloom
                                luminanceThreshold={0.15}
                                mipmapBlur
                                intensity={0.7}
                                radius={0.5}
                            />
                            <Noise opacity={0.05} />
                            <Vignette eskil={false} offset={0.3} darkness={0.6} />
                        </EffectComposer>
                    )}
                </Suspense>
            </Canvas>
        </div>
    )
}
