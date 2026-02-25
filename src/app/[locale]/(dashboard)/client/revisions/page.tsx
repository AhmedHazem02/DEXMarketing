'use client'

import { useState, useEffect, useTransition } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
    RotateCcw,
    Clock,
    MessageSquare,
    Loader2,
    AlertCircle,
    Calendar,
    User,
    CheckCircle2,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import { useCurrentUser } from '@/hooks/use-users'
import { useClientProfile, useClientRevisionsTasks } from '@/hooks/use-client-portal'
import { cn } from '@/lib/utils'
import { ensureClientRecord } from '@/lib/actions/users'

export default function ClientRevisionsPage() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const router = useRouter()
    const queryClient = useQueryClient()
    const [isPending, startTransition] = useTransition()
    const [fixError, setFixError] = useState<string | null>(null)

    // Auth
    const { data: currentUser, isLoading: isUserLoading } = useCurrentUser()
    const userId = currentUser?.id ?? null

    // Client profile
    const { data: profile, isLoading: isProfileLoading } = useClientProfile(userId ?? '')
    const clientId = profile?.id ?? ''

    // Fetch revision tasks
    const { data: revisionTasks, isLoading: isTasksLoading } = useClientRevisionsTasks(clientId)

    const tasks = revisionTasks ?? []
    const isLoading = isUserLoading || isProfileLoading || !userId || !clientId

    // Redirect non-client users
    useEffect(() => {
        if (currentUser && currentUser.role !== 'client') {
            router.push('/')
        }
    }, [currentUser, router])

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-64" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-48" />
                    ))}
                </div>
            </div>
        )
    }

    if (!profile) {
        const handleFix = () => {
            startTransition(async () => {
                setFixError(null)
                const result = await ensureClientRecord()
                if (result.success) {
                    queryClient.invalidateQueries({ queryKey: ['client-portal'] })
                } else {
                    setFixError(result.error || 'فشل إنشاء ملف العميل')
                }
            })
        }
        return (
            <div className="p-8 text-center border rounded-xl bg-orange-50">
                <h2 className="text-xl font-bold mb-2 text-orange-800">
                    {isAr ? 'حسابك غير مرتبط بملف عميل' : 'Account not linked to a Client Profile'}
                </h2>
                <p className="text-muted-foreground mb-4">
                    {isAr
                        ? 'يرجى التواصل مع الإدارة لربط وتفعيل حسابك كعميل.'
                        : 'Please contact administration to activate your client account.'}
                </p>
                <button
                    onClick={handleFix}
                    disabled={isPending}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
                >
                    {isPending
                        ? (isAr ? 'جاري الإنشاء...' : 'Creating...')
                        : (isAr ? 'إنشاء ملف العميل تلقائياً' : 'Auto-create Client Profile')}
                </button>
                {fixError && <p className="text-red-600 mt-2 text-sm">{fixError}</p>}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <RotateCcw className="h-8 w-8 text-rose-500" />
                    {isAr ? 'طلبات التعديل' : 'My Revisions'}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {isAr
                        ? 'المهام التي طلبت تعديلها — جاري العمل عليها من قِبل الفريق'
                        : 'Tasks you requested revisions on — currently being worked on by the team'}
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-300">
                            {isAr ? 'إجمالي التعديلات' : 'Total Revisions'}
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                            <RotateCcw className="h-4 w-4 text-rose-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">
                            {isTasksLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : tasks.length}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">
                            {isAr ? 'قيد المعالجة' : 'Being Processed'}
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-amber-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                            {isTasksLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : tasks.length}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            {isAr ? 'بملاحظات' : 'With Feedback'}
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {isTasksLoading
                                ? <Loader2 className="h-6 w-6 animate-spin" />
                                : tasks.filter((t) => t.client_feedback).length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tasks List */}
            {isTasksLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-40 w-full" />
                    ))}
                </div>
            ) : tasks.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-16 text-center">
                        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                            {isAr ? 'لا توجد تعديلات معلقة' : 'No pending revisions'}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                            {isAr
                                ? 'لم تطلب أي تعديلات حتى الآن، أو تم الانتهاء منها جميعاً'
                                : 'You have no pending revision requests at the moment'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {tasks.map((task) => {
                        const deadlineDate = task.deadline ? new Date(task.deadline) : null
                        const isOverdue = deadlineDate && deadlineDate < new Date()
                        const dateLocale = isAr ? ar : enUS

                        return (
                            <Card
                                key={task.id}
                                className="overflow-hidden border-rose-200 dark:border-rose-800/60 hover:shadow-md hover:shadow-rose-100 dark:hover:shadow-rose-950/30 transition-shadow"
                            >
                                {/* Top accent bar */}
                                <div className="h-1 w-full bg-gradient-to-r from-rose-400 to-rose-600" />

                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-base font-semibold line-clamp-2 leading-snug">
                                                {task.title}
                                            </CardTitle>
                                            {task.project && (
                                                <CardDescription className="mt-1 flex items-center gap-1">
                                                    <span className="text-xs">
                                                        {isAr ? 'مشروع:' : 'Project:'}
                                                    </span>
                                                    <span className="text-xs font-semibold text-foreground/80">
                                                        {task.project.name}
                                                    </span>
                                                </CardDescription>
                                            )}
                                        </div>
                                        <Badge className="shrink-0 bg-rose-500 hover:bg-rose-500 text-white border-0 gap-1">
                                            <RotateCcw className="h-3 w-3" />
                                            {isAr ? 'طلب تعديل' : 'Revision Requested'}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-0 space-y-3">
                                    {/* Meta chips */}
                                    <div className="flex flex-wrap gap-2">
                                        {deadlineDate && (
                                            <span className={cn(
                                                'inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium',
                                                isOverdue
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                                    : 'bg-muted text-muted-foreground'
                                            )}>
                                                {isOverdue && <AlertCircle className="h-3 w-3" />}
                                                <Calendar className="h-3 w-3" />
                                                {format(deadlineDate, 'd MMM yyyy', { locale: dateLocale })}
                                            </span>
                                        )}
                                        {task.assigned_user && (
                                            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                                                <User className="h-3 w-3" />
                                                {task.assigned_user.name}
                                            </span>
                                        )}
                                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(task.updated_at), 'd MMM · HH:mm', { locale: dateLocale })}
                                        </span>
                                    </div>

                                    {/* Client feedback */}
                                    {task.client_feedback && (
                                        <div className="rounded-lg bg-muted/60 border border-border p-3 space-y-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <MessageSquare className="h-3.5 w-3.5 text-rose-500" />
                                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                    {isAr ? 'ملاحظاتك' : 'Your Feedback'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-foreground leading-relaxed">
                                                {task.client_feedback}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
