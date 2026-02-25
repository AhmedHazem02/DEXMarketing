'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ParticleFieldProps {
    count: number
}

export function ParticleField({ count }: ParticleFieldProps) {
    const points = useRef<THREE.Points>(null)

    // Generate positions and colors once
    const [positions, colors] = useMemo(() => {
        const pos = new Float32Array(count * 3)
        const col = new Float32Array(count * 3)
        const color = new THREE.Color()

        for (let i = 0; i < count; i++) {
            // Sphere density distribution
            const r = Math.random() * 10 + 5
            const theta = 2 * Math.PI * Math.random()
            const phi = Math.acos(2 * Math.random() - 1)

            const x = r * Math.sin(phi) * Math.cos(theta)
            const y = r * Math.sin(phi) * Math.sin(theta)
            const z = r * Math.cos(phi)

            pos[i * 3] = x
            pos[i * 3 + 1] = y
            pos[i * 3 + 2] = z

            // Colors: Amber, Cyan, White
            const choice = Math.random()
            if (choice > 0.8) color.set('#22D3EE') // Cyan
            else if (choice > 0.5) color.set('#FBBF24') // Amber
            else color.set('#ffffff')

            col[i * 3] = color.r
            col[i * 3 + 1] = color.g
            col[i * 3 + 2] = color.b
        }

        return [pos, col]
    }, [count])

    useFrame((state, delta) => {
        if (points.current) {
            points.current.rotation.y += delta * 0.05
            points.current.rotation.x += delta * 0.02
        }
    })

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-color"
                    args={[colors, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.05}
                vertexColors
                transparent
                opacity={0.8}
                sizeAttenuation
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    )
}
