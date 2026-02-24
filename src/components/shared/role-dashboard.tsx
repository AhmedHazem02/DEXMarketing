'use client'

import { useState, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Clock, Calendar, CheckCircle, Loader2,
    MapPin, Building2, Upload, Eye
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMarkTaskComplete, useAddAttachment } from '@/hooks/use-tasks'
import { useTasksRealtime } from '@/hooks/use-realtime'
import { useCurrentUser } from '@/hooks/use-users'
import { FileUploadZone, TaskDetails } from '@/components/tasks'
import { getWorkflowStageConfig } from '@/types/task'
import type { TaskWithRelations } from '@/types/task'
import type { WorkflowStage } from '@/types/database'

// ─── Configuration Types ──────────────────────────────────────────
export interface RoleDashboardConfig {
    /** The icon to display in stats and empty state */
    icon: LucideIcon
    /** Page title */
    title: { ar: string; en: string }
    /** Page subtitle */
    subtitle: { ar: string; en: string }
    /** Active tasks section header */
    activeLabel: { ar: string; en: string }
    /** The workflow stage marking active tasks */
    workflowStage: WorkflowStage
    /** How to filter active tasks */
    activeFilter: (task: TaskWithRelations) => boolean
    /** How to filter completed tasks */
    completedFilter: (task: TaskWithRelations) => boolean
    /** Empty state text */
    emptyText: { ar: string; en: string }
    /** Stats cards config */
    stats: StatConfig[]
    /** Whether to show location/scheduled_date fields or deadline */
    showLocationFields?: boolean
    /** Whether to show the View Details (Eye) button + TaskDetails sheet */
    showViewDetails?: boolean
    /** Whether to show a "Completed Tasks" section */
    showCompletedSection?: boolean
    /** Completed section label */
    completedLabel?: { ar: string; en: string }
}

interface StatConfig {
    label: { ar: string; en: string }
    icon: LucideIcon
    iconClassName?: string
    getValue: (active: TaskWithRelations[], completed: TaskWithRelations[]) => number
}

interface RoleDashboardProps {
    config: RoleDashboardConfig
    /** The task data from the relevant hook */
    tasks: TaskWithRelations[] | undefined
    /** Whether tasks are still loading */
    isLoading: boolean
}

// ─── Component ────────────────────────────────────────────────────
export function RoleDashboard({ config, tasks, isLoading }: RoleDashboardProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const { data: currentUser } = useCurrentUser()
    const userId = currentUser?.id ?? null
    const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null)
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

    useTasksRealtime()

    const markComplete = useMarkTaskComplete()
    const addAttachment = useAddAttachment()

    const activeTasks = useMemo(
        () => tasks?.filter(config.activeFilter) ?? [],
        [tasks, config.activeFilter]
    )

    const completedTasks = useMemo(
        () => tasks?.filter(config.completedFilter) ?? [],
        [tasks, config.completedFilter]
    )

    const handleMarkDone = async (taskId: string) => {
        await markComplete.mutateAsync({ taskId, currentStage: config.workflowStage })
        setUploadingTaskId(null)
    }

    const handleFileUploaded = async (taskId: string, url: string, name: string) => {
        if (!userId) return
        await addAttachment.mutateAsync({
            task_id: taskId,
            file_url: url,
            file_name: name,
            uploaded_by: userId,
            is_final: true,
        })
    }

    if (!userId) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    const Icon = config.icon

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {isAr ? config.title.ar : config.title.en}
                </h1>
                <p className="text-muted-foreground mt-1">
                    {isAr ? config.subtitle.ar : config.subtitle.en}
                </p>
            </div>

            {/* Stats */}
            <div className={`grid gap-4 md:grid-cols-${config.stats.length}`}>
                {config.stats.map((stat, idx) => {
                    const StatIcon = stat.icon
                    return (
                        <Card key={idx}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {isAr ? stat.label.ar : stat.label.en}
                                </CardTitle>
                                <StatIcon className={`h-4 w-4 ${stat.iconClassName ?? 'text-muted-foreground'}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stat.getValue(activeTasks, completedTasks)}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Active Tasks */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">
                    {isAr ? config.activeLabel.ar : config.activeLabel.en}
                </h2>
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                    </div>
                ) : activeTasks.length === 0 ? (
                    <Card className="p-8 text-center">
                        <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">
                            {isAr ? config.emptyText.ar : config.emptyText.en}
                        </p>
                    </Card>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {activeTasks.map((task) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                layout
                            >
                                <Card className="hover:border-primary/50 transition-colors">
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-2">
                                                <h3 className="font-semibold text-lg">{task.title}</h3>
                                                {task.description && (
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {task.description}
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                                    {task.company_name && (
                                                        <span className="flex items-center gap-1">
                                                            <Building2 className="h-3.5 w-3.5" />
                                                            {task.company_name}
                                                        </span>
                                                    )}
                                                    {config.showLocationFields !== false && task.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            {task.location}
                                                        </span>
                                                    )}
                                                    {config.showLocationFields !== false && task.scheduled_date && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {format(new Date(task.scheduled_date), 'PP', {
                                                                locale: isAr ? ar : enUS,
                                                            })}
                                                        </span>
                                                    )}
                                                    {config.showLocationFields !== false && task.scheduled_time && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {task.scheduled_time}
                                                        </span>
                                                    )}
                                                    {config.showLocationFields === false && task.deadline && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {format(new Date(task.deadline), 'PP', {
                                                                locale: isAr ? ar : enUS,
                                                            })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                {config.showViewDetails && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedTaskId(task.id)}
                                                        title={isAr ? 'عرض التفاصيل' : 'View Details'}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setUploadingTaskId(
                                                        uploadingTaskId === task.id ? null : task.id
                                                    )}
                                                >
                                                    <Upload className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
                                                    {isAr ? 'رفع' : 'Upload'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleMarkDone(task.id)}
                                                    disabled={markComplete.isPending}
                                                >
                                                    {markComplete.isPending ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
                                                            {isAr ? 'تم' : 'Done'}
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {uploadingTaskId === task.id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                >
                                                    <FileUploadZone
                                                        taskId={task.id}
                                                        userId={userId}
                                                        onUploadComplete={({ file_url, file_name }) =>
                                                            handleFileUploaded(task.id, file_url, file_name)
                                                        }
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Completed Tasks - optional */}
            {config.showCompletedSection && completedTasks.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-muted-foreground">
                        {isAr
                            ? (config.completedLabel?.ar ?? 'المهام السابقة')
                            : (config.completedLabel?.en ?? 'Previous Tasks')}
                    </h2>
                    {completedTasks.slice(0, 5).map((task) => (
                        <Card key={task.id} className="opacity-60">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium">{task.title}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {task.company_name}
                                            {task.scheduled_date && ` • ${format(new Date(task.scheduled_date), 'PP', { locale: isAr ? ar : enUS })}`}
                                        </p>
                                    </div>
                                    <Badge variant="secondary">
                                        {(() => {
                                            const cfg = getWorkflowStageConfig(task.workflow_stage, task.task_type)
                                            return isAr ? cfg?.labelAr : cfg?.label
                                        })() ?? (isAr ? 'مكتمل' : 'Done')}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Task Details Sheet - optional */}
            {config.showViewDetails && selectedTaskId && userId && (
                <TaskDetails
                    open={!!selectedTaskId}
                    onOpenChange={(open) => !open && setSelectedTaskId(null)}
                    taskId={selectedTaskId}
                    currentUserId={userId}
                />
            )}
        </div>
    )
}
