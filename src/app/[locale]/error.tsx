'use client'

import { useEffect } from 'react'
import { useLocale } from 'next-intl'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const locale = useLocale()
  const isAr = locale === 'ar'

  useEffect(() => {
    // Log error to an error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Replace with Sentry or similar
      console.error('Application error:', error.digest)
    } else {
      console.error('Application error:', error)
    }
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {isAr ? 'حدث خطأ غير متوقع' : 'Something went wrong'}
          </h2>
          <p className="text-muted-foreground">
            {isAr
              ? 'نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.'
              : 'We apologize for the error. Please try again.'}
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            {isAr ? 'حاول مرة أخرى' : 'Try again'}
          </button>
          <a
            href="/"
            className="px-6 py-2.5 border border-border rounded-lg font-medium text-foreground hover:bg-accent transition-colors"
          >
            {isAr ? 'الصفحة الرئيسية' : 'Go home'}
          </a>
        </div>
      </div>
    </div>
  )
}
