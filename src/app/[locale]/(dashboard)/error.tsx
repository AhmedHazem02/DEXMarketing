'use client'

import { useEffect } from 'react'
import { useLocale } from 'next-intl'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const locale = useLocale()
  const isAr = locale === 'ar'

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      console.error('Dashboard error:', error.digest)
    } else {
      console.error('Dashboard error:', error)
    }
  }, [error])

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-destructive"
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
          <h2 className="text-xl font-bold text-foreground mb-2">
            {isAr ? 'حدث خطأ في لوحة التحكم' : 'Dashboard Error'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? 'حدث خطأ أثناء تحميل هذا القسم. يرجى المحاولة مرة أخرى.'
              : 'An error occurred while loading this section. Please try again.'}
          </p>
        </div>

        <button
          onClick={reset}
          className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {isAr ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    </div>
  )
}
