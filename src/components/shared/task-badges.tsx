'use client'

import { memo } from 'react'
import { useLocale } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import {
    STATUS_CONFIG,
    PRIORITY_STYLE_CONFIG,
    DEPARTMENT_BADGE_CONFIG,
} from '@/lib/constants/admin'

// ─── Status Badge ─────────────────────────────────────────────────
export const StatusBadge = memo(function StatusBadge({
    status,
    className = 'text-[10px] sm:text-xs',
}: {
    status: string
    className?: string
}) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['new']
    return (
        <Badge variant="outline" className={`${config.style} whitespace-nowrap ${className}`}>
            {isAr ? config.label : config.labelEn}
        </Badge>
    )
})

// ─── Priority Badge ───────────────────────────────────────────────
export const PriorityBadge = memo(function PriorityBadge({
    priority,
    className = 'text-[10px] sm:text-xs',
}: {
    priority: string
    className?: string
}) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const config = PRIORITY_STYLE_CONFIG[priority] || PRIORITY_STYLE_CONFIG['medium']
    return (
        <Badge variant="outline" className={`${config.style} whitespace-nowrap ${className}`}>
            {isAr ? config.label : config.labelEn}
        </Badge>
    )
})

// ─── Priority Dot (compact variant) ──────────────────────────────
export const PriorityDot = memo(function PriorityDot({
    priority,
}: {
    priority: string
}) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const config = PRIORITY_STYLE_CONFIG[priority] || PRIORITY_STYLE_CONFIG['medium']
    return (
        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground" title={isAr ? config.label : config.labelEn}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
            <span className="hidden sm:inline">{isAr ? config.label : config.labelEn}</span>
        </span>
    )
})

// ─── Department Badge ─────────────────────────────────────────────
export const DepartmentBadge = memo(function DepartmentBadge({
    department,
    className = 'text-[10px] sm:text-xs',
}: {
    department: string | null
    className?: string
}) {
    const locale = useLocale()
    const isAr = locale === 'ar'

    if (!department) {
        return <span className="text-[10px] sm:text-xs text-muted-foreground">—</span>
    }

    const config = DEPARTMENT_BADGE_CONFIG[department] || {
        label: department,
        labelEn: department,
        className: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700',
    }

    return (
        <Badge variant="outline" className={`${config.className} whitespace-nowrap ${className}`}>
            {isAr ? config.label : config.labelEn}
        </Badge>
    )
})
