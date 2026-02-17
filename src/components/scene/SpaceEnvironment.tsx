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
                opacity={0.15}
                color="#FBBF24"
            />

            <Sparkles
                count={Math.floor(starCount / 10)}
                scale={18}
                size={1.5}
                speed={0.15}
                opacity={0.1}
                color="#22D3EE"
            />
        </group>
    )
}
