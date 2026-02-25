'use client'

interface SpaceEnvironmentProps {
    starCount: number
}

export function SpaceEnvironment({ starCount }: SpaceEnvironmentProps) {
    return (
        <group>

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
