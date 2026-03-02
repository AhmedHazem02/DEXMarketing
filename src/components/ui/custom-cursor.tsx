'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useDeviceCapabilities } from '@/hooks/use-device-capabilities'

export function CustomCursor() {
    const { isMobile } = useDeviceCapabilities()
    const [isPointer, setIsPointer] = useState(false)
    const lastPointerRef = useRef(false)
    const cursorX = useMotionValue(-100)
    const cursorY = useMotionValue(-100)

    const springConfig = { damping: 25, stiffness: 200 }
    const cursorXSpring = useSpring(cursorX, springConfig)
    const cursorYSpring = useSpring(cursorY, springConfig)

    // GPU-accelerated transforms instead of left/top
    const glowTransform = useTransform(
        [cursorXSpring, cursorYSpring],
        ([x, y]: number[]) => `translate(${x - 150}px, ${y - 150}px)`
    )
    const dotTransform = useTransform(
        [cursorX, cursorY],
        ([x, y]: number[]) => `translate(${x - 6}px, ${y - 6}px)`
    )

    useEffect(() => {
        if (isMobile) return

        let rafId: number | null = null

        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX)
            cursorY.set(e.clientY)

            // Throttle pointer detection via rAF to avoid getComputedStyle on every move
            if (rafId !== null) return
            rafId = requestAnimationFrame(() => {
                rafId = null
                const target = e.target as HTMLElement
                const isClickable =
                    target.tagName === 'A' ||
                    target.tagName === 'BUTTON' ||
                    target.closest('a, button, [role="button"]') !== null ||
                    window.getComputedStyle(target).cursor === 'pointer'

                if (isClickable !== lastPointerRef.current) {
                    lastPointerRef.current = isClickable
                    setIsPointer(isClickable)
                }
            })
        }

        window.addEventListener('mousemove', moveCursor, { passive: true })
        return () => {
            window.removeEventListener('mousemove', moveCursor)
            if (rafId !== null) cancelAnimationFrame(rafId)
        }
    }, [cursorX, cursorY, isMobile])

    if (isMobile) return null

    return (
        <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
            {/* Flashlight glow — GPU-accelerated via transform */}
            <motion.div
                className="absolute top-0 left-0 h-[300px] w-[300px] rounded-full"
                style={{
                    transform: glowTransform,
                    background: 'radial-gradient(circle, rgba(242,203,5,0.15) 0%, transparent 70%)',
                    willChange: 'transform',
                }}
            />

            {/* Cursor dot — GPU-accelerated via transform */}
            <motion.div
                className="absolute top-0 left-0"
                style={{
                    transform: dotTransform,
                    willChange: 'transform',
                }}
                animate={{
                    scale: isPointer ? 1.5 : 1,
                }}
            >
                <div className="h-3 w-3 rounded-full bg-[#F2CB05] shadow-[0_0_10px_rgba(242,203,5,0.8)]" />
            </motion.div>
        </div>
    )
}
