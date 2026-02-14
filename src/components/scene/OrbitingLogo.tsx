'use client'

import { Text3D, Center } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

interface SatelliteProps {
    text: string
    radius: number
    speed: number
    yOffset: number
    color: string
    initialAngle: number
}

function Satellite({ text, radius, speed, yOffset, color, initialAngle }: SatelliteProps) {
    const groupRef = useRef<THREE.Group>(null)
    const textRef = useRef<THREE.Mesh>(null)

    // Font URL - using a standard open font from a reliable CDN or local if valid
    // HELVETIKER is a safe bet for Three.js examples
    const fontUrl = 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json'

    useFrame((state) => {
        if (groupRef.current) {
            // Orbit logic
            const t = state.clock.getElapsedTime() * speed + initialAngle
            groupRef.current.position.x = Math.sin(t) * radius
            groupRef.current.position.z = Math.cos(t) * radius

            // Face the camera (billboard effect) or face center? 
            // Let's make it look at the center (0,0,0) so it looks like a satellite
            groupRef.current.lookAt(0, groupRef.current.position.y, 0)

            // Bobbing motion
            groupRef.current.position.y = yOffset + Math.sin(t * 2) * 0.2
        }
    })

    return (
        <group ref={groupRef}>
            <Center>
                <Text3D
                    ref={textRef as React.RefObject<THREE.Mesh>}
                    font={fontUrl}
                    size={0.8}
                    height={0.2}
                    curveSegments={12}
                    bevelEnabled
                    bevelThickness={0.02}
                    bevelSize={0.02}
                    bevelOffset={0}
                    bevelSegments={5}
                >
                    {text}
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={0.5}
                        toneMapped={false}
                    />
                </Text3D>
            </Center>
        </group>
    )
}

export function OrbitingLogo() {
    const satellites = useMemo(() => [
        { text: 'D', radius: 2.0, speed: 0.4, yOffset: 0.5, color: '#FBBF24', initialAngle: 0 },       // Amber
        { text: 'E', radius: 2.5, speed: 0.3, yOffset: -0.1, color: '#22D3EE', initialAngle: Math.PI * 2 / 3 }, // Cyan
        { text: 'X', radius: 2.0, speed: 0.5, yOffset: -0.7, color: '#F472B6', initialAngle: Math.PI * 4 / 3 } // Pink
    ], [])

    return (
        <group position={[3.2, -1.8, -1]}>
            {/* Centered around the astronaut's corner position */}
            {satellites.map((sat, i) => (
                <Satellite key={i} {...sat} />
            ))}

            {/* Optional: Orbital Rings for visual guide */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
                <ringGeometry args={[1.95, 2.05, 64]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.02} side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
                <ringGeometry args={[1.95, 2.05, 64]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.02} side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                <ringGeometry args={[2.45, 2.55, 64]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.02} side={THREE.DoubleSide} />
            </mesh>
        </group>
    )
}
