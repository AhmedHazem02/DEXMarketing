import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// TODO: Consider adding rate limiting using middleware or a library like @upstash/ratelimit
// to prevent abuse of this endpoint

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    // Prevent open redirect with stricter validation against encoded bypasses
    let safeNext = '/'
    if (next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')) {
        // Decode and check again to prevent URL-encoded bypasses like /%2F%2F
        try {
            const decoded = decodeURIComponent(next)
            if (!decoded.startsWith('//') && !decoded.startsWith('/\\')) {
                safeNext = next
            }
        } catch {
            // Invalid URL encoding, use default
            safeNext = '/'
        }
    }

    // Use environment variable for base URL to prevent Host header manipulation
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || origin

    // Validate code parameter exists
    if (!code) {
        console.warn('[Auth Callback] No code parameter provided', {
            timestamp: new Date().toISOString(),
            url: request.url
        })
        return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`, 302)
    }

    try {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return NextResponse.redirect(`${baseUrl}${safeNext}`, 302)
        }

        // Log detailed error information for debugging
        console.error('[Auth Callback] Failed to exchange code for session:', {
            message: error.message,
            code: error.code || 'unknown',
            status: error.status || 500,
            timestamp: new Date().toISOString()
        })
    } catch (err) {
        // Handle unexpected errors
        console.error('[Auth Callback] Unexpected error during session exchange:', {
            error: err instanceof Error ? err.message : 'Unknown error',
            timestamp: new Date().toISOString()
        })
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`, 302)
}
