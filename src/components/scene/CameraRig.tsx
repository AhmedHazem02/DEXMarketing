'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { useEffect, useRef } from 'react'

export function CameraRig() {
    const { camera } = useThree()

    const scrollRef = useRef(0)

    useEffect(() => {
        const handleScroll = () => {
            scrollRef.current = window.scrollY / (document.body.scrollHeight - window.innerHeight)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useFrame((state, delta) => {
        // Camera centered — astronaut is decorative in corner
        const baseX = 0
        const targetZ = 5.5 - (scrollRef.current * 2.5)
        const targetY = -(scrollRef.current * 1.5)

        camera.position.x = THREE.MathUtils.lerp(camera.position.x, baseX, delta * 2)
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, delta * 2)
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, delta * 2)

        // Subtle mouse parallax
        const mouseX = state.pointer.x * 0.3
        const mouseY = state.pointer.y * 0.3

        camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, -mouseY * 0.06, delta * 2)
        camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, mouseX * 0.06, delta * 2)
    })

    return null
}
