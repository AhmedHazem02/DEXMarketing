'use client'

import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function MoonBase() {
    const mesh = useRef<THREE.Mesh>(null)

    // A large sphere positioned so only the top curves into view at the bottom-right
    return (
        <group position={[3.5, -5.8, 1]} rotation={[0, 0, 0]}>
            {/* Main Moon Body */}
            <mesh ref={mesh} receiveShadow>
                <sphereGeometry args={[4.2, 32, 32]} />
                <meshStandardMaterial
                    color="#cbd5e1" // Slate-300
                    roughness={0.8}
                    metalness={0.1}
                    flatShading={true} // Low-poly look to match astronaut
                />
            </mesh>

            {/* Craters (Simple dark circles/cylinders flattened) */}
            <mesh position={[-1, 3.8, 1.5]} rotation={[-0.5, 0, 0]} receiveShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.1, 8]} />
                <meshStandardMaterial color="#94a3b8" />
            </mesh>
            <mesh position={[1, 4.0, 0.5]} rotation={[-0.2, 0, 0.5]} receiveShadow>
                <cylinderGeometry args={[0.25, 0.25, 0.1, 8]} />
                <meshStandardMaterial color="#94a3b8" />
            </mesh>
        </group>
    )
}
