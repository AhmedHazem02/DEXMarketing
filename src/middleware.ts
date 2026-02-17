import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'as-needed'
});

export async function middleware(request: NextRequest) {
    // 1. Run Intl Middleware first (handles locale redirects)
    const intlResponse = intlMiddleware(request);

    // 2. Refresh Supabase auth session
    // This ensures the auth token in cookies is always fresh,
    // so Server Components get a valid session on first load
    // (without requiring a manual browser refresh).
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    // Write refreshed cookies onto the intl response
                    cookiesToSet.forEach(({ name, value, options }) =>
                        intlResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Calling getUser() triggers the token refresh if needed.
    // We don't need the result — just the side-effect of refreshing cookies.
    // Wrapped in try/catch so a temporary Supabase network outage doesn't
    // crash the middleware — the dashboard layout will independently verify
    // auth and redirect unauthenticated users.
    try {
        await supabase.auth.getUser()
    } catch {
        // fetch failed / network timeout — silently continue
    }

    // 3. Add pathname to headers so Server Components can access it
    intlResponse.headers.set('x-pathname', request.nextUrl.pathname);

    return intlResponse;
}

export const config = {
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}
