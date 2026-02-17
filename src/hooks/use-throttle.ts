import { useCallback, useRef } from 'react'

/**
 * Throttle hook for performance optimization
 * Limits how often a function can be called
 * 
 * @param callback - The function to throttle
 * @param delay - Minimum time between calls in milliseconds
 * @returns Throttled function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 150
): T {
  const lastRan = useRef<number>(Date.now())

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now()
      
      if (now - lastRan.current >= delay) {
        callback(...args)
        lastRan.current = now
      }
    }) as T,
    [callback, delay]
  )
}
