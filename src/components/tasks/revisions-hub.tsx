'use client'

import { useState, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { format, formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
    RotateCcw, AlertTriangle, User, Calendar, Clock,
    MessageSquare, Paperclip, ChevronRight, Filter,
    RefreshCw, UserPlus, Play, Search
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

import { toast } from 'sonner'
import { useRevisionsTasks, useUpdateTask, useAssignTask } from '@/hooks/use-tasks'
import { useUsers, useCurrentUser } from '@/hooks/use-users'
import { useTasksRealtime } from '@/hooks/use-realtime'
import { getPriorityConfig, getColumnConfig } from '@/types/task'
import type { TaskWithRelations } from '@/types/task'
import type { TaskStatus } from '@/types/database'

// ============================================
// Props
// ============================================

interface RevisionsHubProps {
    onTaskClick?: (task: TaskWithRelations) => void
    onReassign?: (task: TaskWithRelations) => void
}

// ============================================
// Revision Card Component
// ============================================

interface RevisionCardProps {
    task: TaskWithRelations
    onView: () => void
    onReassign: (userId: string) => void
    onStartWork: () => void
    creators: { id: string; name: string | null; avatar_url: string | null }[]
    isReassigning: boolean
}

function RevisionCard({
    task,
    onView,
    onReassign,
    onStartWork,
    creators,
    isReassigning
}: RevisionCardProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const [showReassign, setShowReassign] = useState(false)

    const priorityConfig = getPriorityConfig(task.priority)
    const statusConfig = getColumnConfig(task.status)
    const isRejected = task.status === 'rejected'

    const deadline = task.deadline ? new Date(task.deadline) : null
    const isOverdue = deadline && deadline < new Date()

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ scale: 1.01 }}
            className={cn(
                'group relative p-5 rounded-2xl bg-card border-2 transition-all duration-200',
                isRejected
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-orange-500/30 bg-orange-500/5',
                'hover:shadow-lg hover:shadow-primary/5'
            )}
        >
            {/* Status Indicator */}
            <div className="absolute top-0 start-6 -translate-y-1/2">
                <Badge className={cn(
                    'shadow-sm',
                    statusConfig.bgColor,
                    statusConfig.color
                )}>
                    {isRejected ? (
                        <AlertTriangle className="h-3 w-3 me-1" />
                    ) : (
                        <RotateCcw className="h-3 w-3 me-1" />
                    )}
                    {isAr ? statusConfig.titleAr : statusConfig.title}
                </Badge>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mt-2">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg line-clamp-1 mb-1">
                        {task.title}
                    </h3>
                    {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {task.description}
                        </p>
                    )}
                </div>

                <Badge
                    variant="outline"
                    className={cn(priorityConfig.bgColor, priorityConfig.color)}
                >
                    {isAr ? priorityConfig.labelAr : priorityConfig.label}
                </Badge>
            </div>

            {/* Client Feedback */}
            {task.client_feedback && (
                <div className="mt-4 p-3 rounded-lg bg-background/60 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">
                        {isAr ? 'ملاحظات العميل:' : 'Client Feedback:'}
                    </p>
                    <p className="text-sm line-clamp-3">
                        {task.client_feedback}
                    </p>
                </div>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                {/* Assignee */}
                {task.assigned_user && (
                    <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                            <AvatarImage src={task.assigned_user.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[10px]">
                                {(task.assigned_user.name ?? 'U').charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="max-w-[100px] truncate">
                            {task.assigned_user.name}
                        </span>
                    </div>
                )}

                {/* Deadline */}
                {deadline && (
                    <div className={cn(
                        'flex items-center gap-1',
                        isOverdue && 'text-red-500'
                    )}>
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                            {format(deadline, 'MMM d', { locale: isAr ? ar : enUS })}
                        </span>
                        {isOverdue && (
                            <AlertTriangle className="h-3 w-3" />
                        )}
                    </div>
                )}

                {/* Updated */}
                <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                        {formatDistanceToNow(new Date(task.updated_at), {
                            addSuffix: true,
                            locale: isAr ? ar : enUS,
                        })}
                    </span>
                </div>

                {/* Project */}
                {task.project && (
                    <Badge variant="outline" className="text-xs">
                        {task.project.name}
                    </Badge>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={onView}
                >
                    {isAr ? 'عرض التفاصيل' : 'View Details'}
                    <ChevronRight className="h-4 w-4 ms-1" />
                </Button>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowReassign(!showReassign)}
                            >
                                <UserPlus className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {isAr ? 'إعادة تعيين' : 'Reassign'}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                onClick={onStartWork}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <Play className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {isAr ? 'بدء العمل' : 'Start Working'}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* Reassign Dropdown */}
            <AnimatePresence>
                {showReassign && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 overflow-hidden"
                    >
                        <Select
                            onValueChange={(userId) => {
                                onReassign(userId)
                                setShowReassign(false)
                            }}
                            disabled={isReassigning}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={isAr ? 'اختر عضو الفريق...' : 'Select team member...'} />
                            </SelectTrigger>
                            <SelectContent>
                                {creators.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        <span className="flex items-center gap-2">
                                            <Avatar className="h-5 w-5">
                                                <AvatarImage src={user.avatar_url ?? undefined} />
                                                <AvatarFallback className="text-[10px]">
                                                    {(user.name ?? 'U').charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            {user.name}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

// ============================================
// Main Revisions Hub Component
// ============================================

export function RevisionsHub({ onTaskClick, onReassign }: RevisionsHubProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'revision' | 'rejected'>('all')
    const [reassigningId, setReassigningId] = useState<string | null>(null)

    // Data fetching
    const { data: tasks, isLoading, refetch, isRefetching } = useRevisionsTasks()
    const { data: users } = useUsers()
    const { data: currentUser } = useCurrentUser()
    const assignTask = useAssignTask()
    const updateTask = useUpdateTask()

    // Real-time updates
    useTasksRealtime()

    // Get creators only (filtered by department)
    const creators = useMemo(() => {
        if (!users) return []
        
        return users.filter(u => {
            if (!u.is_active) return false
            if (!['creator', 'team_leader'].includes(u.role)) return false
            
            // Admin can see all creators
            if (currentUser?.role === 'admin') return true
            
            // Others can only see creators from their department
            if (currentUser?.department && u.department) {
                return u.department === currentUser.department
            }
            
            return false
        })
    }, [users, currentUser])

    // Filter tasks
    const filteredTasks = useMemo(() => {
        if (!tasks) return []

        return tasks.filter(task => {
            // Department filter: admin sees all, others see their department only
            if (currentUser?.role !== 'admin' && currentUser?.department) {
                if (task.department && task.department !== currentUser.department) {
                    return false
                }
            }
            // Status filter
            if (statusFilter !== 'all' && task.status !== statusFilter) {
                return false
            }
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                if (!task.title.toLowerCase().includes(query) &&
                    !task.description?.toLowerCase().includes(query)) {
                    return false
                }
            }
            return true
        })
    }, [tasks, statusFilter, searchQuery, currentUser])

    // Handlers
    const handleReassign = async (taskId: string, userId: string) => {
        setReassigningId(taskId)
        try {
            await assignTask.mutateAsync({ taskId, userId })
        } finally {
            setReassigningId(null)
        }
    }

    const handleStartWork = async (task: TaskWithRelations) => {
        try {
            await updateTask.mutateAsync({
                id: task.id,
                status: 'in_progress',
            })
        } catch (error) {
            toast.error(isAr ? 'فشل في بدء العمل' : 'Failed to start work')
        }
    }

    // Stats (scoped to department)
    const deptTasks = useMemo(() => {
        if (!tasks) return []
        if (currentUser?.role === 'admin') return tasks
        return tasks.filter(t =>
            !currentUser?.department || !t.department || t.department === currentUser.department
        )
    }, [tasks, currentUser])

    const revisionCount = deptTasks.filter(t => t.status === 'revision').length
    const rejectedCount = deptTasks.filter(t => t.status === 'rejected').length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <RotateCcw className="h-6 w-6 text-orange-500" />
                        {isAr ? 'مركز التعديلات' : 'Revisions Hub'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isAr
                            ? 'إدارة المهام المرفوضة والتي تحتاج تعديلات'
                            : 'Manage rejected tasks and those needing revisions'
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

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="border-orange-500/30 bg-orange-500/5">
                    <CardHeader className="pb-2">
                        <CardDescription>{isAr ? 'بانتظار التعديل' : 'Pending Revision'}</CardDescription>
                        <CardTitle className="text-3xl text-orange-500">
                            {revisionCount}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-red-500/30 bg-red-500/5">
                    <CardHeader className="pb-2">
                        <CardDescription>{isAr ? 'مرفوضة' : 'Rejected'}</CardDescription>
                        <CardTitle className="text-3xl text-red-500">
                            {rejectedCount}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={isAr ? 'بحث...' : 'Search...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="ps-10"
                    />
                </div>
                <Select
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
                >
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <Filter className="h-4 w-4 me-2" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
                        <SelectItem value="revision">{isAr ? 'تعديل' : 'Revision'}</SelectItem>
                        <SelectItem value="rejected">{isAr ? 'مرفوض' : 'Rejected'}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Tasks List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-48 rounded-2xl" />
                    ))}
                </div>
            ) : filteredTasks.length === 0 ? (
                <Card className="py-16">
                    <CardContent className="flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                            <RotateCcw className="h-8 w-8 text-green-500" />
                        </div>
                        <h3 className="font-semibold text-lg mb-1">
                            {isAr ? 'لا توجد مهام معلقة!' : 'No pending tasks!'}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                            {isAr
                                ? 'جميع المهام مكتملة ولا توجد تعديلات مطلوبة'
                                : 'All tasks are complete with no revisions needed'
                            }
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredTasks.map(task => (
                            <RevisionCard
                                key={task.id}
                                task={task}
                                creators={creators}
                                onView={() => onTaskClick?.(task)}
                                onReassign={(userId) => handleReassign(task.id, userId)}
                                onStartWork={() => handleStartWork(task)}
                                isReassigning={reassigningId === task.id}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}

export default RevisionsHub
