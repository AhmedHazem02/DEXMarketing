'use client'

import { Suspense, lazy, ComponentType } from 'react'
import { SectionSkeleton } from './section-skeleton'

interface LazySectionProps {
  importFn: () => Promise<{ default: ComponentType }>
  fallbackLines?: number
}

export function LazySection({ importFn, fallbackLines = 3 }: LazySectionProps) {
  const Component = lazy(importFn)

  return (
    <Suspense fallback={<SectionSkeleton lines={fallbackLines} />}>
      <Component />
    </Suspense>
  )
}
