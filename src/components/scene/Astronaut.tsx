'use client'

import React, { useRef, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface AstronautProps {
    isAr?: boolean
}

function AstronautModel({ isAr = false }: AstronautProps) {
    const group = useRef<THREE.Group>(null)
    const headGroup = useRef<THREE.Group>(null)

    // Interactive Lights
    const keyLight = useRef<THREE.PointLight>(null)
    const fillLight = useRef<THREE.PointLight>(null)

    const { scene } = useGLTF('/models/astronaut.glb')
    const { viewport } = useThree()

    // Smooth movement targets (Lerping)
    const targetLightPos = useRef({ x: 0, y: 0 })

    // Enhance Materials for the "Bust" look
    useMemo(() => {
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                mesh.castShadow = true
                mesh.receiveShadow = true

                // Ensure smooth shading
                if (mesh.geometry) {
                    mesh.geometry.computeVertexNormals()
                    // If low poly, we might need to merge vertices to smooth normals
                    // but we can't easily access BufferGeometryUtils in this context without extra import
                    // so we rely on computeVertexNormals + material smoothness
                }

                if (mesh.material instanceof THREE.MeshStandardMaterial) {
                    // Visor Material - The "Star" of the show
                    if (mesh.name.toLowerCase().includes('visor') || mesh.name.toLowerCase().includes('glass') || mesh.material.name.toLowerCase().includes('glass')) {
                        mesh.material = new THREE.MeshPhysicalMaterial({
                            color: new THREE.Color(0x050510),
                            roughness: 0.0,
                            metalness: 1.0,
                            clearcoat: 1.0,
                            clearcoatRoughness: 0.0,
                            envMapIntensity: 3.5,
                            emissive: new THREE.Color('#F2CB05'),
                            emissiveIntensity: 0.15,
                        })
                    } else {
                        // Suit Fabric - Matte & Dark
                        mesh.material.roughness = 0.85
                        mesh.material.metalness = 0.2
                    }
                    mesh.material.needsUpdate = true
                }
            }
        })
    }, [scene])

    useFrame((state) => {
        if (!group.current || !keyLight.current || !fillLight.current) return

        const mouseX = state.pointer.x
        const mouseY = state.pointer.y
        const { width, height } = state.viewport
        const isPortrait = width < height

        // --- 1. Light Interaction (Smooth Lerp) ---
        const targetKeyX = mouseX * 8
        const targetKeyY = mouseY * 6 + 4

        const targetFillX = -mouseX * 8
        const targetFillY = -mouseY * 6 - 2

        const lerpFactor = 0.06

        targetLightPos.current.x = THREE.MathUtils.lerp(targetLightPos.current.x, mouseX, lerpFactor)
        targetLightPos.current.y = THREE.MathUtils.lerp(targetLightPos.current.y, mouseY, lerpFactor)

        keyLight.current.position.x = THREE.MathUtils.lerp(keyLight.current.position.x, targetKeyX, lerpFactor)
        keyLight.current.position.y = THREE.MathUtils.lerp(keyLight.current.position.y, targetKeyY, lerpFactor)

        fillLight.current.position.x = THREE.MathUtils.lerp(fillLight.current.position.x, targetFillX, lerpFactor)
        fillLight.current.position.y = THREE.MathUtils.lerp(fillLight.current.position.y, targetFillY, lerpFactor)

        // --- 2. Head/Body Rotation (Subtle) ---
        if (headGroup.current) {
            const limit = 0.15
            headGroup.current.rotation.y = THREE.MathUtils.lerp(headGroup.current.rotation.y, mouseX * limit, 0.04)
            headGroup.current.rotation.x = THREE.MathUtils.lerp(headGroup.current.rotation.x, -mouseY * limit * 0.4, 0.04)
        }

        // --- 3. Enhanced Floating Animation ---
        const time = state.clock.elapsedTime
        const baseY = isPortrait ? -2.5 : -3.5
        const baseX = isPortrait ? 0 : (isAr ? -1.2 : 1.2)

        const floatY = Math.sin(time * 0.35) * 0.12
        const floatX = Math.sin(time * 0.2) * 0.03
        const breathRot = Math.sin(time * 0.5) * 0.008
        group.current.position.y = baseY + floatY
        // Flip X position based on locale
        group.current.position.x = baseX + floatX
        group.current.rotation.z = breathRot
    })

    // Responsive positioning (for initial render)
    const isPortrait = viewport.width < viewport.height

    // Adjust for mobile/portrait
    // Lowered Y further (-6.5/-5.0) to center the head and upper body
    const responsiveScale = isPortrait ? 2.1 : 2.5
    const responsiveX = isPortrait ? 0 : (isAr ? -1.6 : 1.6)
    const responsiveY = isPortrait ? -5.0 : -6.5

    return (
        <group ref={group} position={[responsiveX, responsiveY, -0.5]} rotation={[0, isAr ? -0.2 : 0.2, 0]}>
            <pointLight
                ref={keyLight}
                position={[-4, 5, 6]}
                intensity={180}
                color="#e0f2fe"
                distance={22}
                decay={2}
            />
            <pointLight
                ref={fillLight}
                position={[4, -1, 5]}
                intensity={120}
                color="#d946ef"
                distance={22}
                decay={2}
            />
            {/* Visor accent glow */}
            <pointLight
                position={[0, 0.8, 2]}
                intensity={30}
                color="#F2CB05"
                distance={6}
                decay={2}
            />

            <group ref={headGroup}>
                <primitive
                    object={scene}
                    scale={responsiveScale}
                    dispose={null}
                />
            </group>
        </group>
    )
}

export function Astronaut({ isAr = false }: AstronautProps) {
    return (
        <>
            <ambientLight intensity={0.35} color="#ffffff" />
            {/* Rim Light - Gold for separation from dark bg */}
            <spotLight
                position={[-1, 3, -5]}
                intensity={60}
                color="#F2CB05"
                angle={0.8}
                penumbra={1}
                distance={22}
            />
            <AstronautModel isAr={isAr} />
        </>
    )
}

// Preload
try {
    useGLTF.preload('/models/astronaut.glb')
} catch (e) { }
