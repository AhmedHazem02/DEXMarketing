'use client'

import React, { useRef, useState, useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useDeviceCapabilities } from '@/hooks/use-device-capabilities'
import { ErrorBoundary } from '@/components/shared/error-boundary'

// 1. Fallback Component (Shows image if model fails)
function AstronautFallback() {
    const meshRef = useRef<THREE.Mesh>(null)
    // Memoize texture to avoid re-loading on every render
    const texture = useMemo(() => new THREE.TextureLoader().load('/images/astronaut-solid.png'), [])

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.position.y = -0.5 + Math.sin(state.clock.elapsedTime / 2) * 0.1
            meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime / 3) * 0.05
        }
    })

    return (
        <mesh ref={meshRef} position={[0, -0.5, 0]} scale={[2, 2, 1]}>
            <planeGeometry args={[1, 1.5]} />
            <meshStandardMaterial
                map={texture}
                transparent
                opacity={0.9}
                side={THREE.DoubleSide}
            />
        </mesh>
    )
}

// 2. The Actual Model Component (Will throw/suspend if file missing)
function AstronautModel() {
    const group = useRef<THREE.Group>(null)
    const { scene } = useGLTF('/models/astronaut.glb')
    const { isMobile } = useDeviceCapabilities()

    // Only re-render when the breakpoint actually changes (not every resize pixel)
    const isTablet = useThree((state) => {
        const w = state.viewport.width
        return w < 10 && w > 5
    })

    // Memoize the clone so it's only created once per scene reference
    const clonedScene = useMemo(() => scene.clone(), [scene])

    // Dispose all GPU resources when the component unmounts
    useEffect(() => {
        return () => {
            clonedScene.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry?.dispose()
                    if (Array.isArray(child.material)) {
                        child.material.forEach((m) => m.dispose())
                    } else {
                        child.material?.dispose()
                    }
                }
            })
        }
    }, [clonedScene])

    // Entrance Animation State
    const [startAnimation, setStartAnimation] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setStartAnimation(true), 1500)
        return () => clearTimeout(timer)
    }, [])

    // Floating animation & Entrance
    useFrame((state) => {
        if (group.current) {
            const time = state.clock.elapsedTime

            let targetY = -2
            let targetZ = 0

            if (isMobile) {
                targetY = -1.8
                targetZ = 0
            } else if (isTablet) {
                targetY = -2.2
                targetZ = 0.5
            } else {
                targetY = -2
                targetZ = 0
            }

            if (startAnimation) {
                group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, targetZ, 0.02)
                group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, targetY + Math.sin(time / 2) * 0.2, 0.05)
            } else {
                group.current.position.z = -20
                group.current.position.y = targetY
            }

            group.current.rotation.y = time * 0.05
            group.current.rotation.z = Math.sin(time / 4) * 0.05
        }
    })

    const scale = isMobile ? 1.3 : (isTablet ? 1.6 : 2)

    return (
        <group ref={group} dispose={null}>
            <primitive
                object={clonedScene}
                scale={scale}
                rotation={[0, -Math.PI / 4, 0]}
            />
        </group>
    )
}

// 3. Wrapper Component
export function Astronaut() {
    return (
        <ErrorBoundary fallback={<AstronautFallback />}>
            <React.Suspense fallback={<AstronautFallback />}>
                <AstronautModel />
            </React.Suspense>
        </ErrorBoundary>
    )
}

// Preload the model — guarded for SSR safety
if (typeof window !== 'undefined') {
    useGLTF.preload('/models/astronaut.glb')
}
