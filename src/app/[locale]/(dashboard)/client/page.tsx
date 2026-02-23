'use client'

import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'

import {
    Briefcase,
    CheckCircle2,
    Clock,
    LayoutDashboard,
    Plus,
    FileText,
    Send,
    UserCheck,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

import { useClientProfile, useClientRequestCounts } from '@/hooks/use-client-portal'
import { useCurrentUser } from '@/hooks/use-users'
import { useTasksForClientReview } from '@/hooks/use-tasks'
import { RequestForm } from '@/components/client/request-form'
import { RequestsList } from '@/components/client/requests-list'
import { TaskReviewCard } from '@/components/client/task-review-card'

import { useState, useEffect, useTransition } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ensureClientRecord } from '@/lib/actions/users'

// ... existing imports

export default function ClientDashboard() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const router = useRouter()
    const queryClient = useQueryClient()
    const [isPending, startTransition] = useTransition()
    const [fixError, setFixError] = useState<string | null>(null)

    // Auth via shared hook (no manual supabase.auth.getUser)
    const { data: currentUser, isLoading: isUserLoading } = useCurrentUser()
    const userId = currentUser?.id ?? null

    // Redirect non-client roles
    useEffect(() => {
        if (currentUser && currentUser.role !== 'client') {
            const roleRoutes: Record<string, string> = {
                admin: '/admin',
                team_leader: '/team-leader',
                creator: '/creator',
            }
            const route = roleRoutes[currentUser.role]
            if (route) router.push(route)
        }
    }, [currentUser, router])

    // Request form dialog state
    const [isRequestFormOpen, setIsRequestFormOpen] = useState(false)

    const { data: profile, isLoading: isProfileLoading } = useClientProfile(userId ?? '')
    // We assume the profile contains the 'id' which is the client_id needed for projects
    // If profile is not found (406), this user might not be a 'client' yet in the clients table.

    // Tasks pending client review
    const { data: reviewTasks, isLoading: isReviewTasksLoading } = useTasksForClientReview(profile?.id ?? '')

    // Request counts
    const requestCounts = useClientRequestCounts(userId ?? '')

    const isLoading = isUserLoading || isProfileLoading || !userId

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-64 rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    // If profile load failed or returned null (e.g. 406 handled by returning undefined)
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
                <Button onClick={handleFix} disabled={isPending} variant="default">
                    {isPending
                        ? (isAr ? 'جاري الإنشاء...' : 'Creating...')
                        : (isAr ? 'إنشاء ملف العميل تلقائياً' : 'Auto-create Client Record')}
                </Button>
                {fixError && <p className="text-red-500 text-sm mt-2">{fixError}</p>}
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <LayoutDashboard className="h-8 w-8 text-primary" />
                        {isAr ? 'لوحة العميل' : 'Client Portal'}
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        {isAr
                            ? `مرحباً بك، ${profile?.name || 'عميلنا العزيز'}. تابع طلباتك ومهامك هنا.`
                            : `Welcome back, ${profile?.name || 'Valued Client'}. Track your tasks and requests here.`
                        }
                    </p>
                </div>
                <Button onClick={() => setIsRequestFormOpen(true)} size="lg">
                    <Send className="h-4 w-4 me-2" />
                    {isAr ? 'إرسال طلب' : 'Submit Request'}
                </Button>
            </div>

            {/* Request Stats Cards */}
            {requestCounts.total > 0 && (
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                    <Card className="bg-card/50">
                        <CardContent className="p-4 flex items-center gap-3">
                            <FileText className="h-8 w-8 text-primary" />
                            <div>
                                <p className="text-2xl font-bold">{requestCounts.total}</p>
                                <p className="text-xs text-muted-foreground">{isAr ? 'إجمالي الطلبات' : 'Total Requests'}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-yellow-500/5 border-yellow-500/20">
                        <CardContent className="p-4 flex items-center gap-3">
                            <Clock className="h-8 w-8 text-yellow-500" />
                            <div>
                                <p className="text-2xl font-bold">{requestCounts.pending}</p>
                                <p className="text-xs text-muted-foreground">{isAr ? 'قيد الانتظار' : 'Pending'}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-500/5 border-green-500/20">
                        <CardContent className="p-4 flex items-center gap-3">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-2xl font-bold">{requestCounts.approved}</p>
                                <p className="text-xs text-muted-foreground">{isAr ? 'تمت الموافقة' : 'Approved'}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-500/5 border-red-500/20">
                        <CardContent className="p-4 flex items-center gap-3">
                            <Plus className="h-8 w-8 text-red-500 rotate-45" />
                            <div>
                                <p className="text-2xl font-bold">{requestCounts.rejected}</p>
                                <p className="text-xs text-muted-foreground">{isAr ? 'مرفوضة' : 'Rejected'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Client Review Section - Tasks Pending Your Review */}
            {reviewTasks && reviewTasks.length > 0 && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-indigo-600 dark:text-indigo-400">
                        <UserCheck className="h-5 w-5" />
                        {isAr ? 'مهام تحتاج مراجعتك' : 'Tasks Pending Your Review'}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        {isAr
                            ? 'المهام التالية جاهزة للمراجعة. يرجى الموافقة أو طلب تعديلات.'
                            : 'The following tasks are ready for your review. Please approve or request modifications.'
                        }
                    </p>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {reviewTasks.map((task) => (
                            <TaskReviewCard key={task.id} task={task} />
                        ))}
                    </div>
                </div>
            )}

            {/* My Requests Section */}
            <div>
                <Separator className="mb-6" />
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        {isAr ? 'طلباتي' : 'My Requests'}
                    </h2>
                    <Button variant="outline" onClick={() => setIsRequestFormOpen(true)}>
                        <Plus className="h-4 w-4 me-2" />
                        {isAr ? 'طلب جديد' : 'New Request'}
                    </Button>
                </div>
                <RequestsList clientUserId={userId!} />
            </div>

            {/* Request Form Dialog */}
            {profile && userId && (
                <RequestForm
                    open={isRequestFormOpen}
                    onOpenChange={setIsRequestFormOpen}
                    clientId={profile.id}
                    clientUserId={userId}
                />
            )}
        </div>
    )
}
