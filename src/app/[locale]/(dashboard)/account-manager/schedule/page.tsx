'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { CalendarDays, FileText, UserPlus } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-users'
import { ScheduleCalendar, ClientAssignmentManager } from '@/components/schedule'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export default function AccountManagerSchedulePage() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const { data: currentUser, isLoading } = useCurrentUser()
    const [activeTab, setActiveTab] = useState<'schedule' | 'assignments'>('schedule')

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
                    <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">
                        {isAr ? 'جدول المحتوى' : 'Content Schedule'}
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        {isAr ? 'إدارة ومراجعة جدول فريق المحتوى' : 'Manage and review content team schedule'}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border/50 pb-1">
                <button
                    type="button"
                    onClick={() => setActiveTab('schedule')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-xl transition-colors',
                        activeTab === 'schedule'
                            ? 'bg-primary/10 text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                >
                    <FileText className="h-4 w-4" />
                    {isAr ? 'جدول المحتوى' : 'Content Schedule'}
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('assignments')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-xl transition-colors',
                        activeTab === 'assignments'
                            ? 'bg-primary/10 text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                >
                    <UserPlus className="h-4 w-4" />
                    {isAr ? 'تعيين العملاء' : 'Client Assignments'}
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'schedule' ? (
                <ScheduleCalendar teamLeaderId={currentUser.id} canCreate={false} />
            ) : (
                <ClientAssignmentManager />
            )}
        </div>
    )
}
