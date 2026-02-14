import { useEffect, useRef } from 'react'

/**
 * Custom hook to throttle a callback function
 * Ensures the callback is called at most once per specified delay
 * 
 * @param callback - The function to throttle
 * @param delay - The minimum time in milliseconds between calls
 */
export function useThrottle<T extends (...args: any[]) => void>(
    callback: T,
    delay: number
): T {
    const lastRun = useRef(Date.now())
    const timeout = useRef<NodeJS.Timeout | undefined>(undefined)

    useEffect(() => {
        return () => {
            if (timeout.current) {
                clearTimeout(timeout.current)
            }
        }
    }, [])

    return ((...args) => {
        const now = Date.now()
        const timeSinceLastRun = now - lastRun.current

        if (timeSinceLastRun >= delay) {
            callback(...args)
            lastRun.current = now
        } else {
            if (timeout.current) {
                clearTimeout(timeout.current)
            }
            timeout.current = setTimeout(() => {
                callback(...args)
                lastRun.current = Date.now()
            }, delay - timeSinceLastRun)
        }
    }) as T
}
