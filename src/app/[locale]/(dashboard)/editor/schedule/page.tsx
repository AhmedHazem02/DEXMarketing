'use client'

import { useLocale } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { ReadOnlyScheduleView } from '@/components/schedule'
import { useCurrentUser, useMyDepartmentLeader } from '@/hooks/use-users'

export default function EditorSchedulePage() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const { data: currentUser, isLoading } = useCurrentUser()
    const { data: leader, isLoading: leaderLoading } = useMyDepartmentLeader(
        currentUser?.department ?? null
    )

    if (isLoading || leaderLoading || !currentUser) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6">
            <ReadOnlyScheduleView
                teamLeaderId={leader?.id}
                userId={!leader ? currentUser.id : undefined}
                title={isAr ? 'جدول التصوير' : 'Filming Schedule'}
            />
        </div>
    )
}
