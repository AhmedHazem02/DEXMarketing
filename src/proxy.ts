import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'as-needed'
});

export async function proxy(request: NextRequest) {
    // 1. Run Intl Middleware first (handles locale redirects)
    const intlResponse = intlMiddleware(request);

    // Get the logical path (without locale prefix)
    const pathname = request.nextUrl.pathname;
    const logicalPath = pathname.replace(/^\/(en|ar)/, '') || '/';

    // 2. Define protected route prefixes
    const protectedPrefixes = [
        '/admin', '/client', '/team-leader', '/account-manager',
        '/creator', '/editor', '/photographer', '/videographer',
        '/accountant', '/profile', '/account', '/settings',
    ];
    const isProtectedRoute = protectedPrefixes.some(prefix => logicalPath.startsWith(prefix));

    // 3. Refresh Supabase auth session
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

    // 4. Validate session server-side using getUser().
    //    getUser() validates the JWT with the Supabase auth server,
    //    preventing forged tokens from bypassing authentication.
    if (isProtectedRoute) {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                const localeMatch = pathname.match(/^\/(en|ar)/)
                const locale = localeMatch ? localeMatch[1] : defaultLocale
                return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
            }
        } catch {
            const localeMatch = pathname.match(/^\/(en|ar)/)
            const locale = localeMatch ? localeMatch[1] : defaultLocale
            return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
        }
    } else {
        // For non-protected routes, still refresh the token silently.
        try {
            await supabase.auth.getUser()
        } catch {
            // fetch failed / network timeout — silently continue
        }
    }

    // 5. Add pathname to headers so Server Components can access it
    intlResponse.headers.set('x-pathname', pathname);

    return intlResponse;
}

export const config = {
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}
