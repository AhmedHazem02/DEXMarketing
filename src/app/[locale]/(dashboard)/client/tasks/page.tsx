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
    DialogFooter,
    DialogHeader,
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
import { getColumnConfig, getPriorityConfig } from '@/types/task'
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
            setIsReviewOpen(true)
            return
        }
        // Navigate to project page with task highlighted
        if (task.project?.id) {
            router.push(`/client/projects/${task.project.id}`)
        } else {
            alert(isAr
                ? `المهمة "${task.title}" ليست مرتبطة بمشروع حالياً`
                : `Task "${task.title}" is not associated with a project`)
        }
    }

    const handleApprove = async () => {
        if (!reviewTask) return
        setIsProcessing(true)
        try {
            await approveTask.mutateAsync({
                taskId: reviewTask.id,
                feedback: isAr ? 'تمت الموافقة من العميل' : 'Approved by client',
            })
            setIsReviewOpen(false)
        } catch (error) {
            console.error('Failed to approve task:', error)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleRequestRevision = async () => {
        if (!reviewTask || !revisionNotes.trim()) return
        setIsProcessing(true)
        try {
            await rejectTask.mutateAsync({
                taskId: reviewTask.id,
                feedback: revisionNotes,
            })
            setIsReviewOpen(false)
            setRevisionNotes('')
        } catch (error) {
            console.error('Failed to request revision:', error)
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
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>{isAr ? 'العنوان' : 'Title'}</TableHead>
                                            <TableHead>{isAr ? 'المشروع' : 'Project'}</TableHead>
                                            <TableHead>{isAr ? 'الحالة' : 'Status'}</TableHead>
                                            <TableHead>{isAr ? 'الأولوية' : 'Priority'}</TableHead>
                                            <TableHead>{isAr ? 'الموعد النهائي' : 'Deadline'}</TableHead>
                                            <TableHead>{isAr ? 'إجراء' : 'Action'}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tasks.map((task) => {
                                            const statusConfig = getColumnConfig(task.status)
                                            const priorityConfig = getPriorityConfig(task.priority)
                                            const isOverdue =
                                                task.deadline &&
                                                new Date(task.deadline) < new Date() &&
                                                task.status !== 'approved'

                                            return (
                                                <TableRow
                                                    key={task.id}
                                                    className="cursor-pointer hover:bg-muted/50"
                                                    onClick={() => handleTaskClick(task)}
                                                >
                                                    <TableCell className="font-medium">
                                                        <div>
                                                            <div className="line-clamp-1">{task.title}</div>
                                                            {task.description && (
                                                                <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                                                    {task.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {task.project?.name ? (
                                                            <span className="text-sm">
                                                                {task.project.name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">
                                                                {isAr ? 'بدون مشروع' : 'No project'}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(statusConfig.bgColor, statusConfig.color)}
                                                        >
                                                            {isAr ? statusConfig.titleAr : statusConfig.title}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                priorityConfig.bgColor,
                                                                priorityConfig.color
                                                            )}
                                                        >
                                                            {isAr ? priorityConfig.labelAr : priorityConfig.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {task.deadline ? (
                                                            <span
                                                                className={cn(
                                                                    'text-sm',
                                                                    isOverdue && 'text-red-600 font-medium'
                                                                )}
                                                            >
                                                                {format(
                                                                    new Date(task.deadline),
                                                                    'MMM d, yyyy',
                                                                    { locale: isAr ? ar : enUS }
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">
                                                                {isAr ? 'لا يوجد' : 'N/A'}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        {task.status === 'client_review' ? (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-indigo-600 border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 gap-1.5"
                                                                onClick={() => handleTaskClick(task)}
                                                            >
                                                                <RotateCcw className="h-3.5 w-3.5" />
                                                                {isAr ? 'طلب تعديل / موافقة' : 'Review'}
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleTaskClick(task)}
                                                            >
                                                                <Eye className="h-3.5 w-3.5" />
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
            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <DialogContent className="sm:max-w-[560px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RotateCcw className="h-5 w-5 text-indigo-500" />
                            {isAr ? 'مراجعة المهمة' : 'Review Task'}
                        </DialogTitle>
                        <DialogDescription>
                            {isAr
                                ? 'راجع تفاصيل المهمة واختر الموافقة أو طلب تعديلات مع ملاحظاتك'
                                : 'Review the task and choose to approve or request modifications with your notes'}
                        </DialogDescription>
                    </DialogHeader>

                    {reviewTask && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">{isAr ? 'عنوان المهمة' : 'Task Title'}</p>
                                <p className="font-semibold text-base">{reviewTask.title}</p>
                            </div>
                            {reviewTask.description && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">{isAr ? 'الوصف' : 'Description'}</p>
                                    <p className="text-sm whitespace-pre-wrap">{reviewTask.description}</p>
                                </div>
                            )}
                            {reviewTask.project?.name && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">{isAr ? 'المشروع:' : 'Project:'}</span>
                                    <Badge variant="outline">{reviewTask.project.name}</Badge>
                                </div>
                            )}
                            <Separator />
                            <div className="space-y-2">
                                <Label htmlFor="revision-notes">
                                    {isAr ? 'ملاحظات التعديل (مطلوبة لطلب التعديل)' : 'Revision Notes (required to request revision)'}
                                </Label>
                                <Textarea
                                    id="revision-notes"
                                    placeholder={isAr ? 'اكتب ملاحظاتك وما تريد تعديله...' : 'Write your notes and what needs to be changed...'}
                                    value={revisionNotes}
                                    onChange={(e) => setRevisionNotes(e.target.value)}
                                    rows={4}
                                    className="resize-none"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={handleRequestRevision}
                            disabled={isProcessing || !revisionNotes.trim()}
                            className="text-orange-600 border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                        >
                            {isProcessing && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                            <RotateCcw className="me-2 h-4 w-4" />
                            {isAr ? 'طلب تعديل' : 'Request Revision'}
                        </Button>
                        <Button
                            onClick={handleApprove}
                            disabled={isProcessing}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isProcessing && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                            <CheckCircle2 className="me-2 h-4 w-4" />
                            {isAr ? 'موافقة' : 'Approve'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
