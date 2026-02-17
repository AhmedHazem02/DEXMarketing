import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

export function usePageVisibility() {
    const { invalidate } = useThree()

    useEffect(() => {
        const handleVisibility = () => {
            if (!document.hidden) {
                // Request a new frame when the page becomes visible
                invalidate()
            }
        }

        document.addEventListener('visibilitychange', handleVisibility)
        return () => document.removeEventListener('visibilitychange', handleVisibility)
    }, [invalidate])
}
