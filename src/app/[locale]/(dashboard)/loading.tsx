'use client'

import { useTranslations } from 'next-intl'

export default function DashboardLoading() {
  const t = useTranslations('common')
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">
          {t('loading')}
        </p>
      </div>
    </div>
  )
}
