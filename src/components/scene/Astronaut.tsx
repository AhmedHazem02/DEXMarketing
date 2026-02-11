'use client'

import React, { useRef, useState, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

// 1. Fallback Component (Shows image if model fails)
function AstronautFallback() {
    const meshRef = useRef<THREE.Mesh>(null)
    const texture = new THREE.TextureLoader().load('/images/astronaut-solid.png') // Path verified

    // Floating animation for fallback too
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

    // Additional responsive checks
    const { viewport } = useThree()
    const isTablet = viewport.width < 10 && viewport.width > 5

    // Clone purely to allow multiple instances without side effects
    const clonedScene = scene.clone()

    // Entrance Animation State
    const [startAnimation, setStartAnimation] = useState(false)

    useEffect(() => {
        // Delay entrance to let the orbiters establish first
        const timer = setTimeout(() => setStartAnimation(true), 1500)
        return () => clearTimeout(timer)
    }, [])

    // Floating animation & Entrance
    useFrame((state) => {
        if (group.current) {
            const time = state.clock.elapsedTime

            // Target Position based on device
            // Mobile: Lower and smaller
            // Tablet: Slightly lower
            // Desktop: Centered-ish but optimized for overlay
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

            // Entrance Logic (Lerp from deep space)
            if (startAnimation) {
                // Smoothly interpolate current position to target
                group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, targetZ, 0.02)
                group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, targetY + Math.sin(time / 2) * 0.2, 0.05)
            } else {
                // Start position (Deep space)
                group.current.position.z = -20
                group.current.position.y = targetY
            }

            // Continuous rotation
            group.current.rotation.y = time * 0.05
            // Add a slight tilt based on mouse/pointer if possible, but keeping it simple for now
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

// Preload the model to avoid waterfall loading - Only if file is likely to exist
try {
    useGLTF.preload('/models/astronaut.glb')
} catch (e) {
    // Ignore preload error
}
