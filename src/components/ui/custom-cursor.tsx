'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useDeviceCapabilities } from '@/hooks/use-device-capabilities'

export function CustomCursor() {
    const { isMobile } = useDeviceCapabilities()
    const [isPointer, setIsPointer] = useState(false)
    const cursorX = useMotionValue(-100)
    const cursorY = useMotionValue(-100)

    const springConfig = { damping: 25, stiffness: 200 }
    const cursorXSpring = useSpring(cursorX, springConfig)
    const cursorYSpring = useSpring(cursorY, springConfig)

    useEffect(() => {
        if (isMobile) return

        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX)
            cursorY.set(e.clientY)

            // Check if hovering over clickable element
            const target = e.target as HTMLElement
            const style = window.getComputedStyle(target)
            setIsPointer(
                style.cursor === 'pointer' || target.tagName === 'A' || target.tagName === 'BUTTON'
            )
        }

        window.addEventListener('mousemove', moveCursor)
        return () => window.removeEventListener('mousemove', moveCursor)
    }, [cursorX, cursorY, isMobile])

    if (isMobile) return null

    return (
        <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
            {/* Flashlight glow */}
            <motion.div
                className="absolute h-[300px] w-[300px] rounded-full -translate-x-1/2 -translate-y-1/2"
                style={{
                    left: cursorXSpring,
                    top: cursorYSpring,
                    background: 'radial-gradient(circle, rgba(242,203,5,0.15) 0%, transparent 70%)',
                    willChange: 'transform',
                }}
            />

            {/* Cursor dot */}
            <motion.div
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                    left: cursorX,
                    top: cursorY,
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
