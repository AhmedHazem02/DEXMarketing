import { useState, useEffect } from 'react'

type GPUTier = 'high' | 'mid' | 'low' | 'potato'

export function useDeviceCapabilities() {
    const [tier, setTier] = useState<GPUTier>('mid')
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        // Check hardware concurrency (CPU cores)
        const cores = navigator.hardwareConcurrency || 2

        // Check device memory (if available)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const memory = (navigator as any).deviceMemory || 4

        // Check if mobile
        const mobile = /Android|iPhone|iPad/i.test(navigator.userAgent)
        setIsMobile(mobile)

        // Tier assignment
        if (mobile && memory < 4) {
            setTier('potato')
        } else if (cores <= 2 || memory <= 4) {
            setTier('low')
        } else if (cores <= 4 || memory <= 8) {
            setTier('mid')
        } else {
            setTier('high')
        }

        // Basic WebGL check
        try {
            const canvas = document.createElement('canvas')
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
            if (!gl) setTier('potato')
        } catch (e) {
            setTier('potato')
        }

    }, [])

    return { tier, isMobile }
}
