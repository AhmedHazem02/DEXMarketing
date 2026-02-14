'use client'

import React, { useRef, useState, useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { Flag } from './Flag'
import { useIntroStore } from '@/store/intro-store'

// 2. The Actual Model Component
function AstronautModel() {
    const group = useRef<THREE.Group>(null) // Main group for Position (Flight)
    const astronautGroup = useRef<THREE.Group>(null) // Inner group for Rotation (Look at mouse)

    // Material Refs for high-performance animation
    const shockwaveMat = useRef<THREE.MeshBasicMaterial>(null)
    const dustMat = useRef<THREE.MeshBasicMaterial>(null)
    const shockwaveVisuals = useRef<THREE.Group>(null)

    const { scene } = useGLTF('/models/astronaut.glb')
    const { isMobile } = useDeviceCapabilities()
    const { viewport } = useThree()

    // Intro State
    const { isIntroComplete, setIntroComplete } = useIntroStore()

    // Ensure we start landed if intro is already done
    const [hasLanded, setHasLanded] = useState(isIntroComplete)

    // Additional responsive checks
    const isTablet = viewport.width < 10 && viewport.width > 5

    // Enhanced Materials: Boost visual quality with direct lighting
    useEffect(() => {
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                if (mesh.material instanceof THREE.MeshStandardMaterial) {
                    // Enhance metallic and emissive properties for premium look
                    mesh.material.metalness = Math.min(mesh.material.metalness + 0.2, 1.0)
                    mesh.material.roughness = Math.max(mesh.material.roughness - 0.1, 0.0)
                    // Add subtle emissive glow to white materials
                    if (mesh.material.color.r > 0.8 && mesh.material.color.g > 0.8 && mesh.material.color.b > 0.8) {
                        mesh.material.emissive = new THREE.Color(0x38bdf8)
                        mesh.material.emissiveIntensity = 0.05
                    }
                    mesh.material.needsUpdate = true
                }
            }
        })
    }, [scene])

    // Clone to allow multiple instances
    const clonedScene = scene.clone()

    // Animation Limits
    const shockwaveOpacity = useRef(0)

    // Cinematic Entrance Logic
    useFrame((state, delta) => {
        if (!group.current) return

        const time = state.clock.elapsedTime
        const mouse = state.pointer

        // --- Target Position Calculation ---
        // Desktop: Bottom-right corner, sitting on MoonBase
        // MoonBase Center: (3.5, -5.8, 1), Radius: 4.2
        // Surface Y calculation ensures precise contact: Y = sqrt(R^2 - dX^2 - dZ^2) + Cy

        let baseTargetX = 2.8
        let baseTargetZ = 0.5
        let surfaceY = -1.69 // Default fallback

        if (isMobile) {
            baseTargetX = 0
            baseTargetZ = 1.2
            // Mobile "fake" landing height to keep visible
            surfaceY = -2.0
        } else if (isTablet) {
            baseTargetX = 2.4
            baseTargetZ = 0.2
            // Recalculate surface for tablet x/z if needed, -1.75 is approx correct
            surfaceY = -1.75
        } else {
            // Desktop Precise Calculation
            const moonCenter = { x: 3.5, y: -5.8, z: 1 }
            const dx = baseTargetX - moonCenter.x
            const dz = baseTargetZ - moonCenter.z
            const distSq = dx * dx + dz * dz
            const radius = 4.2
            // Sqrt(r^2 - dist^2) + center_y
            // 4.2^2 = 17.64. If distSq is small enough.
            if (distSq < 17) {
                const heightFromCenter = Math.sqrt(17.64 - distSq)
                surfaceY = heightFromCenter + moonCenter.y
            }
        }

        const baseTargetY = surfaceY + (isMobile ? 0 : 0.05) // Add tiny offset for center-of-mass vs feet

        const currentPos = group.current.position

        // 1. Entrance (Fly-in)
        // Check distance to "landing zone"
        const dist = currentPos.distanceTo(new THREE.Vector3(baseTargetX, baseTargetY, baseTargetZ))
        const verticalDist = Math.abs(currentPos.y - baseTargetY)

        // Refined Landing Condition: Must be very close closer
        // We use a small threshold for "physical contact"
        const isTouchingDown = dist < 0.15

        if (isTouchingDown && !hasLanded) {
            setHasLanded(true)
            setTimeout(() => setIntroComplete(true), 1200) // Delay text slightly more for dramatic effect

            // Trigger shockwave
            if (!isIntroComplete) {
                shockwaveOpacity.current = 1
                if (shockwaveVisuals.current) shockwaveVisuals.current.visible = true
            }
        }

        // --- Physics & Movement ---
        // Use a critical damped spring feel: Fast approach, very smooth stop
        // Flight Phase: 0.05 lerp (Standard)
        // Landing Phase: 0.1 lerp (Firmer lock)
        const approachSpeed = hasLanded ? 0.1 : 0.04

        group.current.position.x = THREE.MathUtils.lerp(currentPos.x, baseTargetX, approachSpeed)
        group.current.position.z = THREE.MathUtils.lerp(currentPos.z, baseTargetZ, approachSpeed)

        // Vertical Movement with "Cushioning"
        let targetY = baseTargetY

        // Impact Cushion Effect: When just landed, dip slightly then recover
        if (hasLanded && shockwaveOpacity.current > 0.5) {
            // Simulate knees bending: Dip down by 0.15 units quickly, then recover
            // shockwaveOpacity goes 1 -> 0. Use it as a timing curve.
            // normalizedTime 0 -> 1 (start of land -> end of land)
            const landProgress = 1 - shockwaveOpacity.current
            // Sine wave dip: sin(0..PI)
            const dip = -Math.sin(landProgress * Math.PI) * 0.15
            targetY += dip
        }

        // Idle Breathing (only after settled)
        if (hasLanded && shockwaveOpacity.current <= 0.1) {
            const breathing = Math.sin(time * 1.5) * 0.002 // Very subtle
            targetY += breathing
        }

        group.current.position.y = THREE.MathUtils.lerp(currentPos.y, targetY, approachSpeed)


        // --- Rotation Logic ---
        // 1. Far out: Banking (Flight Mode)
        // 2. Approach (< 2.0 dist): Uprighting (Preparing to land)
        // 3. Landed: Mouse Look
        if (astronautGroup.current) {
            let targetRotX = 0
            let targetRotY = 0
            let targetRotZ = 0

            if (hasLanded) {
                // Ground Phase: Look at cursor
                targetRotY = -0.6 + (mouse.x * 0.3)
                targetRotX = -0.1 + (-mouse.y * 0.1)
                targetRotZ = 0
            } else {
                // Air Phase
                if (dist > 3.0) {
                    // High Altitude Flight: Strong Banking
                    targetRotY = -0.2
                    targetRotZ = -0.6 // Deep bank
                    targetRotX = 0.4
                } else if (dist > 0.5) {
                    // Final Approach: Uprighting
                    // Smoothly transition from Bank (-0.6) to Upright (0)
                    // dist goes 3.0 -> 0.5. Normalize this 0..1
                    const t = (dist - 0.5) / 2.5 // 0 near ground, 1 high up

                    targetRotY = THREE.MathUtils.lerp(-0.2, -0.6, 1 - t) // Turn body to face camera/landing spot
                    targetRotZ = THREE.MathUtils.lerp(0, -0.6, t) // Un-bank
                    targetRotX = THREE.MathUtils.lerp(0, 0.4, t) // Level out pitch
                } else {
                    // Pre-Touchdown: Bracing
                    targetRotY = -0.6
                    targetRotZ = 0 // Feet flat
                    targetRotX = 0.1 // Slight forward lean ready for impact
                }
            }

            // Apply smooth rotation Interp
            astronautGroup.current.rotation.x = THREE.MathUtils.lerp(astronautGroup.current.rotation.x, targetRotX, 0.08)
            astronautGroup.current.rotation.y = THREE.MathUtils.lerp(astronautGroup.current.rotation.y, targetRotY, 0.08)
            astronautGroup.current.rotation.z = THREE.MathUtils.lerp(astronautGroup.current.rotation.z, targetRotZ, 0.08)
        }

        // --- Shockwave Animation ---
        if (shockwaveOpacity.current > 0) {
            shockwaveOpacity.current = Math.max(0, shockwaveOpacity.current - delta * 1.8) // Faster fade

            if (shockwaveMat.current) shockwaveMat.current.opacity = shockwaveOpacity.current * 0.4
            if (dustMat.current) dustMat.current.opacity = shockwaveOpacity.current * 0.6

            // Expand ring
            if (shockwaveVisuals.current) {
                // More dramatic expansion: 1x -> 2.5x size
                const expansion = 1 + (1 - shockwaveOpacity.current) * 1.5
                shockwaveVisuals.current.scale.setScalar(expansion)
            }

            if (shockwaveOpacity.current <= 0 && shockwaveVisuals.current) {
                shockwaveVisuals.current.visible = false
            }
        }
    })

    // Avoid "Flash" by setting initial position immediately
    const initialPos = useMemo(() => {
        if (!isIntroComplete) return [12, 6, -30] as [number, number, number]
        return [2.8, -1.65, 0.5] as [number, number, number]
    }, [])

    const scale = isMobile ? 1.4 : (isTablet ? 1.1 : 1.3)

    return (
        <group ref={group} position={initialPos}>
            {/* Astronaut Mesh Holder - Rotates independently */}
            <group ref={astronautGroup}>
                <primitive
                    object={clonedScene}
                    scale={scale}
                    rotation={[0, -0.2, 0]}
                    dispose={null}
                />
            </group>

            {/* The Flag - Plants when landed - STATIC rotation relative to ground, DOES NOT follow mouse */}
            <group position={[-0.7, 0, 0.5]} rotation={[0, 0.3, 0]}>
                <Flag isLanded={hasLanded} />
            </group>

            {/* Shockwave Visuals Group */}
            <group ref={shockwaveVisuals} visible={false}>
                {/* Dust/Sparkles at base of flag */}
                <mesh position={[-0.7, 0.1, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.2, 1.5, 32]} />
                    <meshBasicMaterial
                        ref={dustMat}
                        color="#fdba74"
                        transparent
                        opacity={0}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* Main Landing Shockwave (Under Astronaut) */}
                <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.5, 2.5, 32]} />
                    <meshBasicMaterial
                        ref={shockwaveMat}
                        color="#ffffff"
                        transparent
                        opacity={0}
                    />
                </mesh>
            </group>

            {/* Rim Light for Cinematic Effect */}
            <spotLight
                position={[-2, 5, 2]}
                intensity={8}
                color="#38bdf8"
                distance={15}
                angle={0.6}
                penumbra={1}
            />
        </group>
    )
}

// 3. Wrapper Component
export function Astronaut() {
    return (
        <React.Suspense fallback={null}>
            {/* Lighting Setup - No shader warnings, premium look */}
            <ambientLight intensity={0.6} color="#ffffff" />
            <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
            <directionalLight position={[-5, 3, -5]} intensity={0.4} color="#38bdf8" />
            <hemisphereLight args={['#38bdf8', '#1e293b', 0.5]} />
            <AstronautModel />
        </React.Suspense>
    )
}

// Preload
try {
    useGLTF.preload('/models/astronaut.glb')
} catch (e) { }
