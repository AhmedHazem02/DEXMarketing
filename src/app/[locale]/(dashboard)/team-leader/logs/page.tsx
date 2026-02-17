'use client'

import { useLocale } from 'next-intl'
import { ScrollText } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-users'
import { TeamActivityLog } from '@/components/shared/team-activity-log'
import { Skeleton } from '@/components/ui/skeleton'

export default function TeamLeaderLogsPage() {
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
                <Skeleton className="h-[500px] rounded-2xl" />
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/5">
                    <ScrollText className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">
                        {isAr ? 'سجل النشاط' : 'Activity Log'}
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        {isAr ? 'متابعة نشاط أعضاء فريقك' : 'Track your team members activity'}
                    </p>
                </div>
            </div>

            <TeamActivityLog teamLeaderId={currentUser.id} />
        </div>
    )
}
