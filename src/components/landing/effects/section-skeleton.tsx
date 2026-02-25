'use client'

interface SectionSkeletonProps {
  lines?: number
  showTitle?: boolean
  className?: string
}

export function SectionSkeleton({
  lines = 3,
  showTitle = true,
  className = '',
}: SectionSkeletonProps) {
  return (
    <div
      className={`animate-pulse space-y-6 py-20 px-6 max-w-6xl mx-auto ${className}`}
      role="status"
      aria-label="Loading content..."
    >
      {showTitle && (
        <div className="space-y-3 text-center">
          <div className="h-4 w-24 bg-white/10 rounded-full mx-auto" />
          <div className="h-8 w-72 bg-white/10 rounded-lg mx-auto" />
        </div>
      )}

      <div className="space-y-4 mt-10">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-white/10 rounded-lg"
            style={{ width: `${85 - i * 10}%` }}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 bg-white/5 rounded-2xl border border-white/10"
          />
        ))}
      </div>

      <span className="sr-only">Loading...</span>
    </div>
  )
}
