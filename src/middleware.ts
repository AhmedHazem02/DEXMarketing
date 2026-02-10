
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

    // Add pathname to headers so Server Components can access it
    response.headers.set('x-pathname', request.nextUrl.pathname);

    // 2. Just return the response without blocking DB checks
    // The active user check is now handled in the Layout/Page level for better performance
    return response;
}

export const config = {
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}
