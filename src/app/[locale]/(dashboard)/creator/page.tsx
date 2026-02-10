'use client'

import { useState, useMemo, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { format, formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
    ClipboardList, Clock, Calendar, CheckCircle, AlertTriangle,
    ChevronRight, Filter, RefreshCw, Search, Upload, Eye, Loader2
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

import { TaskDetails, FileUploadZone, getColumnConfig, getPriorityConfig } from '@/components/tasks'
import { useMyTasks, useUpdateTask } from '@/hooks/use-tasks'
import { useTasksRealtime } from '@/hooks/use-realtime'
import type { TaskWithRelations } from '@/types/task'
import type { TaskStatus } from '@/types/database'

// ============================================
// Task Card for Creator View
// ============================================

interface TaskCardProps {
    task: TaskWithRelations
    onView: () => void
    onSubmit: () => void
    isSubmitting: boolean
    currentUserId: string
}

function CreatorTaskCard({ task, onView, onSubmit, isSubmitting, currentUserId }: TaskCardProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const [showUpload, setShowUpload] = useState(false)

    const priorityConfig = getPriorityConfig(task.priority)
    const statusConfig = getColumnConfig(task.status)

    const deadline = task.deadline ? new Date(task.deadline) : null
    const isOverdue = deadline && deadline < new Date() && !['approved', 'review'].includes(task.status)
    const isToday = deadline && deadline.toDateString() === new Date().toDateString()

    const canSubmit = ['in_progress', 'revision'].includes(task.status)
    const isCompleted = task.status === 'approved'

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
                'group relative p-5 rounded-2xl bg-card border transition-all duration-200',
                'hover:shadow-lg hover:border-primary/30',
                isOverdue && 'border-red-500/50 bg-red-500/5',
                isCompleted && 'border-green-500/30 bg-green-500/5 opacity-75'
            )}
        >
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-3">
                <Badge className={cn(statusConfig.bgColor, statusConfig.color)}>
                    {isAr ? statusConfig.titleAr : statusConfig.title}
                </Badge>
                <Badge variant="outline" className={cn(priorityConfig.bgColor, priorityConfig.color)}>
                    {isAr ? priorityConfig.labelAr : priorityConfig.label}
                </Badge>
            </div>

            {/* Title & Description */}
            <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                {task.title}
            </h3>
            {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {task.description}
                </p>
            )}

            {/* Feedback Alert */}
            {task.client_feedback && task.status === 'revision' && (
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 mb-4">
                    <p className="text-xs text-orange-600 font-medium mb-1">
                        {isAr ? 'ملاحظات للتعديل:' : 'Revision Notes:'}
                    </p>
                    <p className="text-sm line-clamp-2">{task.client_feedback}</p>
                </div>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                {deadline && (
                    <div className={cn(
                        'flex items-center gap-1',
                        isOverdue ? 'text-red-500' : isToday ? 'text-orange-500' : ''
                    )}>
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                            {format(deadline, 'MMM d', { locale: isAr ? ar : enUS })}
                        </span>
                        {isOverdue && <AlertTriangle className="h-3 w-3" />}
                    </div>
                )}
                {task.project && (
                    <Badge variant="outline" className="text-xs">
                        {task.project.name}
                    </Badge>
                )}
            </div>

            {/* Upload Zone - Expandable */}
            <AnimatePresence>
                {showUpload && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 overflow-hidden"
                    >
                        <FileUploadZone
                            taskId={task.id}
                            userId={currentUserId}
                            maxFileSize={25}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={onView} className="flex-1">
                    <Eye className="h-4 w-4 me-2" />
                    {isAr ? 'عرض' : 'View'}
                </Button>

                {canSubmit && (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowUpload(!showUpload)}
                        >
                            <Upload className="h-4 w-4 me-2" />
                            {isAr ? 'رفع' : 'Upload'}
                        </Button>
                        <Button
                            size="sm"
                            onClick={onSubmit}
                            disabled={isSubmitting}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle className="h-4 w-4 me-2" />
                            {isAr ? 'تسليم' : 'Submit'}
                        </Button>
                    </>
                )}
            </div>
        </motion.div>
    )
}

// ============================================
// Main Creator Dashboard
// ============================================

export default function CreatorDashboard() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const [userId, setUserId] = useState<string | null>(null)

    // Fetch current user
    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
            }
        }
        fetchUser()
    }, [])

    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null)
    const [submittingId, setSubmittingId] = useState<string | null>(null)

    // Data - only fetch if userId is available
    const { data: tasks, isLoading, refetch, isRefetching } = useMyTasks(userId ?? '')
    const updateTask = useUpdateTask()

    // Real-time
    useTasksRealtime(userId ?? undefined)

    // Filter tasks
    const { activeTasks, completedTasks } = useMemo(() => {
        if (!tasks) return { activeTasks: [], completedTasks: [] }

        const active: TaskWithRelations[] = []
        const completed: TaskWithRelations[] = []

        tasks.forEach(task => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                if (!task.title.toLowerCase().includes(query) &&
                    !task.description?.toLowerCase().includes(query)) {
                    return
                }
            }

            if (task.status === 'approved') {
                completed.push(task)
            } else {
                active.push(task)
            }
        })

        return { activeTasks: active, completedTasks: completed }
    }, [tasks, searchQuery])

    // Handlers
    const handleSubmitTask = async (taskId: string) => {
        setSubmittingId(taskId)
        try {
            await updateTask.mutateAsync({
                id: taskId,
                status: 'review',
            })
        } finally {
            setSubmittingId(null)
        }
    }

    if (!userId) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    // Stats
    const urgentCount = activeTasks.filter(t => t.priority === 'urgent').length
    const reviewCount = tasks?.filter(t => t.status === 'review').length ?? 0
    const revisionCount = tasks?.filter(t => t.status === 'revision').length ?? 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <ClipboardList className="h-8 w-8 text-primary" />
                        {isAr ? 'مهامي' : 'My Tasks'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isAr
                            ? 'تتبع وإكمال المهام المسندة إليك'
                            : 'Track and complete your assigned tasks'
                        }
                    </p>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isRefetching}
                >
                    <RefreshCw className={cn('h-4 w-4 me-2', isRefetching && 'animate-spin')} />
                    {isAr ? 'تحديث' : 'Refresh'}
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{isAr ? 'نشطة' : 'Active'}</CardDescription>
                        <CardTitle className="text-2xl">{activeTasks.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className={urgentCount > 0 ? 'border-red-500/30 bg-red-500/5' : ''}>
                    <CardHeader className="pb-2">
                        <CardDescription>{isAr ? 'عاجلة' : 'Urgent'}</CardDescription>
                        <CardTitle className={cn('text-2xl', urgentCount > 0 && 'text-red-500')}>
                            {urgentCount}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className={revisionCount > 0 ? 'border-orange-500/30 bg-orange-500/5' : ''}>
                    <CardHeader className="pb-2">
                        <CardDescription>{isAr ? 'تحتاج تعديل' : 'Need Revision'}</CardDescription>
                        <CardTitle className={cn('text-2xl', revisionCount > 0 && 'text-orange-500')}>
                            {revisionCount}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Tabs & Search */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="active" className="gap-2">
                            <Clock className="h-4 w-4" />
                            {isAr ? 'نشطة' : 'Active'}
                            <Badge variant="secondary">{activeTasks.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="gap-2">
                            <CheckCircle className="h-4 w-4" />
                            {isAr ? 'مكتملة' : 'Completed'}
                            <Badge variant="secondary">{completedTasks.length}</Badge>
                        </TabsTrigger>
                    </TabsList>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={isAr ? 'بحث...' : 'Search...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="ps-10"
                        />
                    </div>
                </div>

                {/* Active Tasks */}
                <TabsContent value="active" className="mt-6">
                    {isLoading ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {[1, 2, 3, 4].map(i => (
                                <Skeleton key={i} className="h-64 rounded-2xl" />
                            ))}
                        </div>
                    ) : activeTasks.length === 0 ? (
                        <Card className="py-16">
                            <CardContent className="flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                </div>
                                <h3 className="font-semibold text-lg mb-1">
                                    {isAr ? 'لا توجد مهام نشطة!' : 'No active tasks!'}
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                    {isAr
                                        ? 'يبدو أنك أنجزت كل شيء 🎉'
                                        : 'Looks like you\'ve completed everything 🎉'
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            <AnimatePresence mode="popLayout">
                                {activeTasks.map(task => (
                                    <CreatorTaskCard
                                        key={task.id}
                                        task={task}
                                        onView={() => {
                                            setSelectedTask(task)
                                            setIsDetailsOpen(true)
                                        }}
                                        onSubmit={() => handleSubmitTask(task.id)}
                                        isSubmitting={submittingId === task.id}
                                        currentUserId={userId}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </TabsContent>

                {/* Completed Tasks */}
                <TabsContent value="completed" className="mt-6">
                    {completedTasks.length === 0 ? (
                        <Card className="py-16">
                            <CardContent className="flex flex-col items-center justify-center text-center">
                                <p className="text-muted-foreground">
                                    {isAr ? 'لا توجد مهام مكتملة بعد' : 'No completed tasks yet'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            <AnimatePresence mode="popLayout">
                                {completedTasks.map(task => (
                                    <CreatorTaskCard
                                        key={task.id}
                                        task={task}
                                        onView={() => {
                                            setSelectedTask(task)
                                            setIsDetailsOpen(true)
                                        }}
                                        onSubmit={() => { }}
                                        isSubmitting={false}
                                        currentUserId={userId}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Task Details Sheet */}
            <TaskDetails
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                taskId={selectedTask?.id ?? null}
                currentUserId={userId}
            />
        </div>
    )
}
