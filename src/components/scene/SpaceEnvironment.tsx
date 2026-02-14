'use client'

import { Stars, Sparkles } from '@react-three/drei'

interface SpaceEnvironmentProps {
    starCount: number
}

export function SpaceEnvironment({ starCount }: SpaceEnvironmentProps) {
    return (
        <group>
            {/* Distant Stars — softer, smaller, further away */}
            <Stars
                radius={150}
                depth={80}
                count={starCount}
                factor={2.5}
                saturation={0}
                fade
                speed={0.5}
            />

            {/* Floating Dust/Sparkles — much softer */}
            <Sparkles
                count={Math.floor(starCount / 8)}
                scale={12}
                size={1.2}
                speed={0.2}
                opacity={0.25}
                color="#FBBF24"
            />

            <Sparkles
                count={Math.floor(starCount / 10)}
                scale={18}
                size={1.5}
                speed={0.15}
                opacity={0.15}
                color="#22D3EE"
            />

            {/* Ambient Light — softer */}
            <ambientLight intensity={0.4} color="#112240" />

            {/* Directional Light (Sun) — dimmer */}
            <directionalLight
                position={[10, 10, 5]}
                intensity={1.0}
                color="#FBBF24"
            />

            {/* Rim Light — softer */}
            <spotLight
                position={[-10, 0, 10]}
                intensity={1.2}
                color="#22D3EE"
                angle={0.5}
            />
        </group>
    )
}
