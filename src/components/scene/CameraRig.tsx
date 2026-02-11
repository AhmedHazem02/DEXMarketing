'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { useEffect, useRef } from 'react'

export function CameraRig() {
    const { camera } = useThree()
    // useScroll gives us access to scroll offsets inside ScrollControls
    // But we might be using native window scroll. 
    // If we are NOT using <ScrollControls>, we need to listen to window scroll.

    // For this implementation, we'll assume we want to react to standard window scroll
    // Since we are integrating into a standard Next.js page.

    const scrollRef = useRef(0)

    useEffect(() => {
        const handleScroll = () => {
            // Normalize scroll 0-1 based on window height
            scrollRef.current = window.scrollY / (document.body.scrollHeight - window.innerHeight)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useFrame((state, delta) => {
        // Smooth damp camera position
        const targetZ = 5 - (scrollRef.current * 3) // Zoom in on scroll
        const targetY = -(scrollRef.current * 2)    // Move down on scroll

        // Lerp for smoothness
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, delta * 2)
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, delta * 2)

        // Subtle mouse parallax
        const mouseX = state.pointer.x * 0.5
        const mouseY = state.pointer.y * 0.5

        camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, -mouseY * 0.1, delta * 2)
        camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, mouseX * 0.1, delta * 2)
    })

    return null
}
