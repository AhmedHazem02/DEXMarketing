'use client'

import { useLocale } from 'next-intl'
import { CalendarDays } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-users'
import { ScheduleCalendar } from '@/components/schedule'
import { Skeleton } from '@/components/ui/skeleton'

export default function TeamLeaderSchedulePage() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const { data: currentUser, isLoading } = useCurrentUser()

    if (isLoading || !currentUser) {
        return (
            <div className="p-4 sm:p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-11 rounded-2xl" />
                    <div>
                        <Skeleton className="h-6 w-40 mb-1" />
                        <Skeleton className="h-3 w-56" />
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-2xl" />
                    ))}
                </div>
                <Skeleton className="h-[500px] rounded-2xl" />
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/5">
                    <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">
                        {isAr ? 'جدول المواعيد' : 'Schedule'}
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        {isAr ? 'إدارة مواعيد وجدولة الفريق' : 'Manage your team appointments & events'}
                    </p>
                </div>
            </div>

            <ScheduleCalendar teamLeaderId={currentUser.id} />
        </div>
    )
}
