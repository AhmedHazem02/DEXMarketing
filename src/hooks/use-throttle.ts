import { useCallback, useRef, useEffect } from 'react'

/**
 * Throttle hook for performance optimization
 * Limits how often a function can be called.
 * Ensures the last call is always executed (trailing call).
 * 
 * @param callback - The function to throttle
 * @param delay - Minimum time between calls in milliseconds
 * @returns Throttled function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 150
): T {
  const lastRan = useRef<number>(0)
  const trailingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastArgs = useRef<Parameters<T> | null>(null)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  // Cleanup trailing timeout on unmount
  useEffect(() => {
    return () => {
      if (trailingTimeout.current) {
        clearTimeout(trailingTimeout.current)
      }
    }
  }, [])

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now()

      if (now - lastRan.current >= delay) {
        callbackRef.current(...args)
        lastRan.current = now
        lastArgs.current = null
        if (trailingTimeout.current) {
          clearTimeout(trailingTimeout.current)
          trailingTimeout.current = null
        }
      } else {
        // Schedule trailing call
        lastArgs.current = args
        if (trailingTimeout.current) {
          clearTimeout(trailingTimeout.current)
        }
        const remaining = delay - (now - lastRan.current)
        trailingTimeout.current = setTimeout(() => {
          if (lastArgs.current) {
            callbackRef.current(...lastArgs.current)
            lastRan.current = Date.now()
            lastArgs.current = null
          }
          trailingTimeout.current = null
        }, remaining)
      }
    }) as T,
    [delay]
  )
}
