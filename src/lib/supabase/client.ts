import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>

// Store the singleton on globalThis so it survives Turbopack HMR
// module re-evaluations (a plain module-level `let` gets reset on each
// hot-reload, creating duplicate GoTrueClient instances that fight over
// navigator.locks and produce AbortError).
const KEY = '__supabase_browser_client' as const

function getGlobalClient(): BrowserClient | undefined {
    return (globalThis as Record<string, unknown>)[KEY] as BrowserClient | undefined
}

function setGlobalClient(c: BrowserClient): void {
    ; (globalThis as Record<string, unknown>)[KEY] = c
}

/**
 * Custom lock implementation that wraps navigator.locks with AbortError
 * suppression. The default GoTrueClient uses navigator.locks.request() with
 * an AbortSignal, but when components unmount during navigation or HMR the
 * signal fires and the unhandled AbortError leaks to the console.
 *
 * This implementation catches AbortError and falls back to running the
 * function without the lock — which is safe because the abort only happens
 * during teardown when no real session work needs protection.
 */
async function resilientNavigatorLock<R>(
    name: string,
    acquireTimeout: number,
    fn: () => Promise<R>
): Promise<R> {
    // SSR or environments without navigator.locks — just run the function
    if (
        typeof globalThis === 'undefined' ||
        typeof globalThis.navigator === 'undefined' ||
        !globalThis.navigator?.locks?.request
    ) {
        return await fn()
    }

    const ac = new AbortController()

    if (acquireTimeout > 0) {
        setTimeout(() => {
            ac.abort()
        }, acquireTimeout)
    }

    try {
        return await globalThis.navigator.locks.request(
            name,
            acquireTimeout === 0
                ? { mode: 'exclusive' as const, ifAvailable: true }
                : { mode: 'exclusive' as const, signal: ac.signal },
            async (lock) => {
                if (lock) {
                    return await fn()
                }

                // Lock not immediately available (acquireTimeout === 0) or
                // spec-non-compliant browser returned null. In both cases,
                // just run the function without the lock — GoTrueClient uses
                // acquireTimeout=0 for quick session checks, and failing hard
                // causes unhandled promise rejections across all admin pages.
                return await fn()
            }
        )
    } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
            // Lock was aborted due to navigation/unmount/HMR — safe to ignore.
            // Run the function without the lock as a fallback; this only happens
            // during teardown so there is no real race condition risk.
            return await fn()
        }
        throw err
    }
}

export function createClient(): BrowserClient {
    const existing = getGlobalClient()
    if (existing) return existing

    const client = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storageKey: `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0]}-auth-token`,
                lock: resilientNavigatorLock,
            },
        }
    )

    setGlobalClient(client)
    return client
}
