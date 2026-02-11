import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

export function usePageVisibility() {
    const { gl } = useThree()

    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden) {
                gl.setAnimationLoop(null) // Pause rendering
            } else {
                gl.setAnimationLoop(gl.render) // Resume
            }
        }

        document.addEventListener('visibilitychange', handleVisibility)
        return () => document.removeEventListener('visibilitychange', handleVisibility)
    }, [gl])
}
