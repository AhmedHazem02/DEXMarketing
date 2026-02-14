'use client'

import React, { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, RenderTexture, PerspectiveCamera } from '@react-three/drei'

// Fix for missing THREE.Shader type
type ThreeShader = {
    uniforms: { [key: string]: { value: any } }
    vertexShader: string
    fragmentShader: string
}

interface FlagProps {
    isLanded: boolean
}

export function Flag({ isLanded }: FlagProps) {
    const group = useRef<THREE.Group>(null)
    const materialRef = useRef<THREE.MeshStandardMaterial>(null)

    // Shader reference to update uniforms
    const shaderRef = useRef<ThreeShader>(null)

    useFrame((state, delta) => {
        // Update Shader Uniforms (Wind Animation)
        if (shaderRef.current) {
            shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime
        }

        // Drop & Impact Animation (Keep existing logic)
        if (group.current) {
            const currentY = group.current.position.y

            // Optimization: Hide if not landed and fully reset
            if (!isLanded && group.current.scale.x < 0.01) return

            if (isLanded) {
                // Drop phase
                if (currentY > 0.1) {
                    group.current.position.y = THREE.MathUtils.lerp(currentY, -0.2, 0.15)
                } else {
                    // Impact / Settle phase
                    group.current.position.y = THREE.MathUtils.lerp(currentY, 0, 0.1)
                }
                // Scale up
                group.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
            } else {
                // Reset to Sky
                group.current.position.y = 10
                group.current.scale.set(0, 0, 0)
            }
        }
    })

    const onBeforeCompile = useMemo(() => {
        return (shader: ThreeShader) => {
            shaderRef.current = shader
            shader.uniforms.uTime = { value: 0 }

            // Vertex Shader: Wind Simulation
            // We use simple sine waves on the Z axis, modulated by X axis so the pole side stays fixed.
            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `
                #include <common>
                uniform float uTime;
                `
            )
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>
                
                float t = uTime * 2.0;
                
                // Pin the flag at x = -0.6 (local space left edge)
                // Map x from [-0.6, 0.6] to [0.0, 1.0] for intensity
                float waveIntensity = smoothstep(-0.6, 0.8, position.x);
                
                // Multi-frequency wave for organic feel
                float wave = sin(position.x * 3.0 - t) * 0.1;
                wave += sin(position.y * 5.0 - t * 0.5) * 0.05; // Vertical ripple
                wave += sin(position.x * 10.0 - t * 2.0) * 0.02; // Fine detail
                
                transformed.z += wave * waveIntensity;
                
                // Slight follow-through rotation feeling
                // transformed.y += sin(position.x * 2.0 - t) * 0.02 * waveIntensity;
                `
            )
        }
    }, [])

    return (
        <group ref={group} scale={[0, 0, 0]} position={[0.8, 10, 0.5]} rotation={[0, -0.6, 0]}>
            {/* Pole: Metallic Chrome */}
            <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.025, 0.025, 3, 16]} />
                <meshStandardMaterial
                    color="#ffffff"
                    metalness={1.0}
                    roughness={0.1}
                    envMapIntensity={1.5}
                />
            </mesh>

            {/* Pole Finial: Golden Sphere (High Poly) */}
            <mesh position={[0, 3, 0]} castShadow>
                <sphereGeometry args={[0.06, 64, 64]} />
                <meshStandardMaterial
                    color="#FFD700"
                    metalness={1.0}
                    roughness={0.1}
                    emissive="#FFAA00"
                    emissiveIntensity={0.2}
                />
            </mesh>

            {/* Base impact point */}
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.15, 32]} />
                <meshBasicMaterial color="#000000" opacity={0.4} transparent />
            </mesh>

            {/* Flag Mesh with Custom Shader & Animated Text */}
            <mesh
                position={[0.6, 2.4, 0]}
                castShadow
                receiveShadow
            >
                {/* High segment plane for smooth vertex shader waves */}
                <planeGeometry args={[1.2, 0.8, 64, 64]} />

                <meshStandardMaterial
                    ref={materialRef}
                    side={THREE.DoubleSide}
                    transparent={true}
                    opacity={0.65}
                    color="white"
                    metalness={0.8}
                    roughness={0.2}
                    onBeforeCompile={onBeforeCompile}
                    emissive="#000000"
                    emissiveIntensity={0}
                >
                    {/* Render Texture for Integrated Text */}
                    <RenderTexture attach="map" anisotropy={16}>
                        <PerspectiveCamera makeDefault manual aspect={1.2 / 0.8} position={[0, 0, 2]} />

                        {/* Lights for the internal scene */}
                        <ambientLight intensity={3} />
                        <pointLight position={[10, 10, 10]} intensity={2} />

                        {/* Background: Deep Cyber Navy */}
                        <color attach="background" args={['#050A30']} />

                        {/* High-Contrast Neon Grid */}
                        <group position={[0, 0, -0.1]}>
                            <gridHelper args={[10, 40, 0x00FFFF, 0x1e293b]} position={[0, -1, 0]} rotation={[Math.PI / 2, 0, 0]} />
                        </group>

                        {/* Front Text - Dark Yellow with White Outline for Max Contrast */}
                        <Text
                            position={[0, 0.1, 0]}
                            fontSize={0.75}
                            fontWeight="bold"
                            color="#cb8905"
                            outlineWidth={0.02}
                            outlineColor="#ffffff"
                            anchorX="center"
                            anchorY="middle"
                            characters="DEX"
                            material-toneMapped={false}
                        >
                            DEX
                        </Text>

                        {/* Decorative Subtext - Cyan & Larger */}
                        <Text
                            position={[0, -0.35, 0]}
                            fontSize={0.15}
                            fontWeight="bold"
                            color="#00FFFF"
                            anchorX="center"
                            anchorY="middle"
                            letterSpacing={0.1}
                        >
                            EST. 2026
                        </Text>
                    </RenderTexture>
                </meshStandardMaterial>
            </mesh>
        </group>
    )
}
