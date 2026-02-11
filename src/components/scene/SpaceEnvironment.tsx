'use client'

import { Stars, Sparkles } from '@react-three/drei'

interface SpaceEnvironmentProps {
    starCount: number
}

export function SpaceEnvironment({ starCount }: SpaceEnvironmentProps) {
    return (
        <group>
            {/* Distant Stars */}
            <Stars
                radius={100}
                depth={50}
                count={starCount}
                factor={4}
                saturation={0}
                fade
                speed={1}
            />

            {/* Floating Dust/Sparkles */}
            <Sparkles
                count={starCount / 5}
                scale={10}
                size={2}
                speed={0.4}
                opacity={0.5}
                color="#FBBF24" // Amber primary
            />

            <Sparkles
                count={starCount / 5}
                scale={15}
                size={3}
                speed={0.3}
                opacity={0.3}
                color="#22D3EE" // Cyan accent
            />

            {/* Ambient Light */}
            <ambientLight intensity={0.5} color="#112240" />

            {/* Directional Light (Sun) */}
            <directionalLight
                position={[10, 10, 5]}
                intensity={1.5}
                color="#FBBF24"
            />

            {/* Rim Light */}
            <spotLight
                position={[-10, 0, 10]}
                intensity={2}
                color="#22D3EE"
                angle={0.5}
            />
        </group>
    )
}
