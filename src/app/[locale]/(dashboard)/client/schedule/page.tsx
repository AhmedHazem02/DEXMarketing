'use client'

import { useLocale } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { ReadOnlyScheduleView } from '@/components/schedule'
import { useClientProfile } from '@/hooks/use-client-portal'
import { useCurrentUser } from '@/hooks/use-users'

export default function ClientSchedulePage() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const { data: user, isLoading: userLoading } = useCurrentUser()
    const { data: clientProfile, isLoading: profileLoading } = useClientProfile(user?.id || '')

    const isLoading = userLoading || profileLoading

    if (isLoading || !clientProfile) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 space-y-4">
            {/* Schedule View - only show current client's own schedule */}
            <ReadOnlyScheduleView
                clientId={clientProfile.id}
                title={isAr ? 'جدول المواعيد' : 'Appointments Schedule'}
            />
        </div>
    )
}
