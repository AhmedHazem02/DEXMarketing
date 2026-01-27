import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'as-needed'
});

export async function middleware(request: NextRequest) {
    // 1. Run Intl Middleware
    const response = intlMiddleware(request);

    // 2. Refresh Supabase Session
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        // Check if user is active
        const { data: profile } = await supabase
            .from('users')
            .select('is_active')
            .eq('id', user.id)
            .single()

        if (profile && profile.is_active === false && !request.nextUrl.pathname.includes('/blocked') && !request.nextUrl.pathname.includes('/contact')) {
            // Extract locale from path
            const pathname = request.nextUrl.pathname
            const pathLocale = locales.find(l => pathname.startsWith(`/${l}`) || pathname === `/${l}`)
            const targetLocale = pathLocale || defaultLocale

            return NextResponse.redirect(new URL(`/${targetLocale}/blocked`, request.url))
        }
    }

    return response
}

export const config = {
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}
