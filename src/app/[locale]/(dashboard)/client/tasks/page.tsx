'use client'

import { useState, useEffect, useTransition } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
    ListTodo,
    CheckCircle2,
    Clock,
    AlertCircle,
    Eye,
    Loader2,
    RotateCcw,
    MessageSquare,
    CalendarDays,
    FolderOpen,
    ThumbsUp,
    ThumbsDown,
    Info,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination'

import { useCurrentUser } from '@/hooks/use-users'
import { useClientProfile, useApproveTask, useRejectTask } from '@/hooks/use-client-portal'
import { useClientTasks, useClientTasksStats } from '@/hooks/use-tasks'
import { TaskFiltersComponent } from '@/components/tasks/task-filters'
import type { TaskFilters, TaskWithRelations } from '@/types/task'
import { cn } from '@/lib/utils'
import { ensureClientRecord } from '@/lib/actions/users'

export default function ClientTasksPage() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const router = useRouter()
    const queryClient = useQueryClient()
    const [isPending, startTransition] = useTransition()
    const [fixError, setFixError] = useState<string | null>(null)

    // Auth
    const { data: currentUser, isLoading: isUserLoading } = useCurrentUser()
    const userId = currentUser?.id ?? null

    // Get client profile
    const { data: profile, isLoading: isProfileLoading } = useClientProfile(userId ?? '')
    const clientId = profile?.id ?? ''

    // Pagination and filters
    const [currentPage, setCurrentPage] = useState(1)
    const [filters, setFilters] = useState<TaskFilters>({})
    const pageSize = 15

    // Review dialog state
    const [reviewTask, setReviewTask] = useState<TaskWithRelations | null>(null)
    const [isReviewOpen, setIsReviewOpen] = useState(false)
    const [revisionNotes, setRevisionNotes] = useState('')
    const [revisionError, setRevisionError] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const approveTask = useApproveTask()
    const rejectTask = useRejectTask()

    // Fetch tasks and stats
    const { data: tasksData, isLoading: isTasksLoading } = useClientTasks(
        clientId,
        filters,
        currentPage,
        pageSize
    )
    const { data: stats, isLoading: isStatsLoading } = useClientTasksStats(clientId, filters)

    const tasks = tasksData?.data ?? []
    const totalCount = tasksData?.totalCount ?? 0
    const totalPages = Math.ceil(totalCount / pageSize)

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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>
                <Skeleton className="h-96" />
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
                <Button onClick={handleFix} disabled={isPending} variant="default">
                    {isPending
                        ? (isAr ? 'جاري الإنشاء...' : 'Creating...')
                        : (isAr ? 'إنشاء ملف العميل تلقائياً' : 'Auto-create Client Record')}
                </Button>
                {fixError && <p className="text-red-500 text-sm mt-2">{fixError}</p>}
            </div>
        )
    }

    const handleTaskClick = (task: TaskWithRelations) => {
        // For client_review tasks, open the review dialog directly
        if (task.status === 'client_review') {
            setReviewTask(task)
            setRevisionNotes('')
            setRevisionError(null)
            setIsReviewOpen(true)
            return
        }
        // Navigate to project page with task highlighted
        if (task.project?.id) {
            router.push(`/client/projects/${task.project.id}`)
        }
    }

    const handleApprove = async () => {
        if (!reviewTask) return
        setIsProcessing(true)
        setRevisionError(null)
        try {
            await approveTask.mutateAsync({
                taskId: reviewTask.id,
                feedback: isAr ? 'تمت الموافقة من العميل' : 'Approved by client',
            })
            setIsReviewOpen(false)
        } catch (error: unknown) {
            const msg =
                (error as { message?: string })?.message ||
                (error as { error_description?: string })?.error_description ||
                (typeof error === 'string' ? error : null) ||
                (isAr ? 'فشل تأكيد الموافقة. حاول مرة أخرى.' : 'Failed to approve task. Please try again.')
            console.error('Failed to approve task:', error)
            setRevisionError(msg)
        } finally {
            setIsProcessing(false)
        }
    }

    const MIN_REVISION_CHARS = 10

    const handleRequestRevision = async () => {
        if (!reviewTask) return
        const trimmed = revisionNotes.trim()
        if (trimmed.length < MIN_REVISION_CHARS) {
            setRevisionError(
                isAr
                    ? `يجب أن تحتوي الملاحظات على ${MIN_REVISION_CHARS} أحرف على الأقل`
                    : `Notes must be at least ${MIN_REVISION_CHARS} characters`
            )
            return
        }
        setRevisionError(null)
        setIsProcessing(true)
        try {
            await rejectTask.mutateAsync({
                taskId: reviewTask.id,
                feedback: trimmed,
            })
            setIsReviewOpen(false)
            setRevisionNotes('')
        } catch (error: unknown) {
            const msg =
                (error as { message?: string })?.message ||
                (error as { error_description?: string })?.error_description ||
                (typeof error === 'string' ? error : null) ||
                (isAr ? 'فشل إرسال طلب التعديل. حاول مرة أخرى.' : 'Failed to request revision. Please try again.')
            console.error('Failed to request revision:', error)
            setRevisionError(msg)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <ListTodo className="h-8 w-8 text-primary" />
                    {isAr ? 'مهامي' : 'My Tasks'}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {isAr
                        ? 'تابع جميع المهام المتعلقة بمشاريعك'
                        : 'Track all tasks related to your projects'}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">
                            {isAr ? 'إجمالي المهام' : 'Total Tasks'}
                        </CardTitle>
                        <ListTodo className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isStatsLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                stats?.total ?? 0
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">
                            {isAr ? 'قيد التنفيذ' : 'In Progress'}
                        </CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {isStatsLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                stats?.in_progress ?? 0
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">
                            {isAr ? 'مكتملة' : 'Completed'}
                        </CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {isStatsLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                stats?.approved ?? 0
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">
                            {isAr ? 'متأخرة' : 'Overdue'}
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {isStatsLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                stats?.overdue ?? 0
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <TaskFiltersComponent
                        filters={filters}
                        onFiltersChange={(newFilters) => {
                            setFilters(newFilters)
                            setCurrentPage(1) // Reset to first page when filters change
                        }}
                        showDepartment
                        showTaskType
                        compact
                    />
                </CardContent>
            </Card>

            {/* Tasks Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>{isAr ? 'كل المهام' : 'All Tasks'}</span>
                        {!isTasksLoading && (
                            <span className="text-sm text-muted-foreground font-normal">
                                {totalCount} {isAr ? 'مهمة' : 'tasks'}
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isTasksLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="text-center py-12">
                            <ListTodo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                {isAr ? 'لا توجد مهام' : 'No tasks found'}
                            </h3>
                            <p className="text-muted-foreground">
                                {isAr
                                    ? 'لم يتم العثور على أي مهام بالفلاتر الحالية'
                                    : 'No tasks found with current filters'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/70 border-b">
                                            <TableHead className="font-semibold text-foreground w-[55%]">{isAr ? 'المهمة' : 'Task'}</TableHead>
                                            <TableHead className="font-semibold text-foreground">{isAr ? 'الموعد النهائي' : 'Deadline'}</TableHead>
                                            <TableHead className="font-semibold text-foreground text-center w-[120px]">{isAr ? 'إجراء' : 'Action'}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tasks.map((task, idx) => {
                                            const isOverdue =
                                                task.deadline &&
                                                new Date(task.deadline) < new Date() &&
                                                task.status !== 'approved'
                                            const isReview = task.status === 'client_review'
                                            const isClientRevision = task.status === 'client_revision'

                                            return (
                                                <TableRow
                                                    key={task.id}
                                                    className={cn(
                                                        'cursor-pointer transition-colors',
                                                        idx % 2 === 0 ? 'bg-background' : 'bg-muted/20',
                                                        isReview && 'border-s-2 border-s-indigo-400',
                                                        isClientRevision && 'border-s-2 border-s-rose-400 bg-rose-50/40 dark:bg-rose-950/10',
                                                        'hover:bg-muted/50'
                                                    )}
                                                    onClick={() => handleTaskClick(task)}
                                                >
                                                    <TableCell className="py-3">
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium line-clamp-1">{task.title}</span>
                                                                {isClientRevision && (
                                                                    <Badge className="shrink-0 text-[10px] h-4 px-1.5 bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100">
                                                                        <RotateCcw className="h-2.5 w-2.5 me-0.5" />
                                                                        {isAr ? 'طلبت تعديل' : 'Revision Requested'}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {task.description && (
                                                                <div className="text-xs text-muted-foreground line-clamp-1">
                                                                    {task.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        {task.deadline ? (
                                                            <span
                                                                className={cn(
                                                                    'text-sm',
                                                                    isOverdue
                                                                        ? 'text-red-600 font-semibold'
                                                                        : 'text-muted-foreground'
                                                                )}
                                                            >
                                                                {format(
                                                                    new Date(task.deadline),
                                                                    isAr ? 'd MMM yyyy' : 'MMM d, yyyy',
                                                                    { locale: isAr ? ar : enUS }
                                                                )}
                                                                {isOverdue && (
                                                                    <span className="ms-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                                                                        {isAr ? 'متأخر' : 'Overdue'}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                        {isReview ? (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-indigo-600 border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 gap-1.5 h-8 text-xs px-3"
                                                                onClick={() => handleTaskClick(task)}
                                                            >
                                                                <RotateCcw className="h-3 w-3" />
                                                                {isAr ? 'مراجعة' : 'Review'}
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                                                onClick={() => handleTaskClick(task)}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-4">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                    className={cn(
                                                        currentPage === 1 && 'pointer-events-none opacity-50'
                                                    )}
                                                    size="default"
                                                />
                                            </PaginationItem>

                                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                .filter((page) => {
                                                    // Show first, last, current, and adjacent pages
                                                    return (
                                                        page === 1 ||
                                                        page === totalPages ||
                                                        Math.abs(page - currentPage) <= 1
                                                    )
                                                })
                                                .map((page, index, array) => {
                                                    // Add ellipsis
                                                    if (index > 0 && page - array[index - 1] > 1) {
                                                        return (
                                                            <>
                                                                <PaginationItem key={`ellipsis-${page}`}>
                                                                    <PaginationEllipsis />
                                                                </PaginationItem>
                                                                <PaginationItem key={page}>
                                                                    <PaginationLink
                                                                        onClick={() => setCurrentPage(page)}
                                                                        isActive={currentPage === page}
                                                                        size="default"
                                                                    >
                                                                        {page}
                                                                    </PaginationLink>
                                                                </PaginationItem>
                                                            </>
                                                        )
                                                    }

                                                    return (
                                                        <PaginationItem key={page}>
                                                            <PaginationLink
                                                                onClick={() => setCurrentPage(page)}
                                                                isActive={currentPage === page}
                                                                size="default"
                                                            >
                                                                {page}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    )
                                                })}

                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() =>
                                                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                                                    }
                                                    className={cn(
                                                        currentPage === totalPages &&
                                                        'pointer-events-none opacity-50'
                                                    )}
                                                    size="default"
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Task Review Dialog */}
            <Dialog open={isReviewOpen} onOpenChange={(open) => {
                setIsReviewOpen(open)
                if (!open) {
                    setRevisionNotes('')
                    setRevisionError(null)
                }
            }}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0">
                    {/* Colored header strip */}
                    <div className="bg-indigo-600 dark:bg-indigo-700 px-6 py-5">
                        <DialogTitle className="flex items-center gap-2 text-white text-lg">
                            <Eye className="h-5 w-5 opacity-80" />
                            {isAr ? 'مراجعة المهمة' : 'Task Review'}
                        </DialogTitle>
                        <DialogDescription className="text-indigo-200 mt-1 text-sm">
                            {isAr
                                ? 'وافق على المهمة أو أرسل ملاحظاتك لطلب تعديل'
                                : 'Approve the task or send your notes to request changes'}
                        </DialogDescription>
                    </div>

                    {reviewTask && (
                        <div className="px-6 py-5 space-y-4">
                            {/* Task title */}
                            <div className="rounded-xl border bg-muted/30 px-4 py-3 space-y-2">
                                <p className="font-semibold text-base leading-snug">{reviewTask.title}</p>
                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                    {reviewTask.project?.name && (
                                        <span className="flex items-center gap-1">
                                            <FolderOpen className="h-3.5 w-3.5" />
                                            {reviewTask.project.name}
                                        </span>
                                    )}
                                    {reviewTask.deadline && (
                                        <span className="flex items-center gap-1">
                                            <CalendarDays className="h-3.5 w-3.5" />
                                            {format(new Date(reviewTask.deadline), isAr ? 'd MMM yyyy' : 'MMM d, yyyy', { locale: isAr ? ar : enUS })}
                                        </span>
                                    )}
                                    {reviewTask.assigned_user?.name && (
                                        <span className="flex items-center gap-1">
                                            <Eye className="h-3.5 w-3.5" />
                                            {reviewTask.assigned_user.name}
                                        </span>
                                    )}
                                </div>
                                {reviewTask.description && (
                                    <p className="text-sm text-muted-foreground leading-relaxed border-t pt-2 mt-1">
                                        {reviewTask.description}
                                    </p>
                                )}
                            </div>

                            {/* Approve callout */}
                            <div className="rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-4 py-3 flex gap-3">
                                <ThumbsUp className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-green-800 dark:text-green-300">
                                    {isAr
                                        ? 'إذا كانت المهمة مكتملة ومطابقة لمتطلباتك، اضغط «موافقة» لإغلاقها.'
                                        : 'If the task is complete and meets your requirements, press Approve to close it.'}
                                </p>
                            </div>

                            <Separator />

                            {/* Revision notes */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="revision-notes" className="flex items-center gap-1.5 font-medium text-foreground">
                                        <MessageSquare className="h-4 w-4 text-rose-500" />
                                        {isAr ? 'ملاحظاتك' : 'Your Feedback'}
                                    </Label>
                                    <span className={cn(
                                        'text-xs tabular-nums font-mono',
                                        revisionNotes.trim().length === 0
                                            ? 'text-muted-foreground'
                                            : revisionNotes.trim().length < 10
                                                ? 'text-orange-500'
                                                : 'text-green-600 dark:text-green-400'
                                    )}>
                                        {revisionNotes.trim().length} / 10
                                    </span>
                                </div>
                                <Textarea
                                    id="revision-notes"
                                    placeholder={isAr ? 'اكتب تفاصيل ما تريد تعديله بوضوح...' : 'Describe what needs to be changed in detail...'}
                                    value={revisionNotes}
                                    onChange={(e) => {
                                        setRevisionNotes(e.target.value)
                                        if (revisionError && e.target.value.trim().length >= 10) {
                                            setRevisionError(null)
                                        }
                                    }}
                                    rows={4}
                                    className={cn(
                                        'resize-none transition-colors text-foreground placeholder:text-muted-foreground',
                                        revisionError
                                            ? 'border-red-500 focus-visible:ring-red-500'
                                            : revisionNotes.trim().length >= 10
                                                ? 'border-rose-300 focus-visible:ring-rose-400'
                                                : ''
                                    )}
                                />
                                {revisionError ? (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <Info className="h-3 w-3" />{revisionError}
                                    </p>
                                ) : (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Info className="h-3 w-3" />
                                        {isAr
                                            ? 'مطلوبة فقط عند طلب التعديل — لا داعي لها عند الموافقة'
                                            : 'Only required when requesting revisions — skip if approving'}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="px-6 pb-5 flex flex-col-reverse sm:flex-row gap-2 justify-end border-t pt-4">
                        <Button
                            variant="outline"
                            onClick={handleRequestRevision}
                            disabled={isProcessing || revisionNotes.trim().length < 10}
                            className="gap-2 border-rose-300 text-rose-600 hover:bg-rose-50 hover:border-rose-400 dark:hover:bg-rose-950/30 disabled:opacity-40"
                        >
                            {isProcessing
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <ThumbsDown className="h-4 w-4" />}
                            {isAr ? 'طلب تعديل' : 'Request Revision'}
                        </Button>
                        <Button
                            onClick={handleApprove}
                            disabled={isProcessing}
                            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                        >
                            {isProcessing
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <ThumbsUp className="h-4 w-4" />}
                            {isAr ? 'موافقة' : 'Approve'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
