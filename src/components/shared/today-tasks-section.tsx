'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Clock, MapPin, Building2, Calendar,
    CheckCircle, Upload, Loader2, Eye,
    Sparkles, CalendarClock,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileUploadZone, TaskDetails } from '@/components/tasks'
import { useMarkTaskComplete, useAddAttachment, useTodayMyTasks } from '@/hooks/use-tasks'
import { useTodayAssignedSchedules } from '@/hooks/use-schedule'
import { useSchedulesRealtime } from '@/hooks/use-realtime'
import type { TaskWithRelations } from '@/types/task'
import type { ScheduleWithRelations } from '@/types/schedule'

interface TodayTasksSectionProps {
    userId: string
    /** Controls which workflow stage to mark done for tasks */
    workflowStage: import('@/types/database').WorkflowStage
}

export function TodayTasksSection({ userId, workflowStage }: TodayTasksSectionProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'

    // Schedules realtime only — parent (RoleDashboard) already covers tasks realtime
    useSchedulesRealtime()

    const { data: todayTasks, isLoading: tasksLoading } = useTodayMyTasks(userId)
    const { data: todaySchedules, isLoading: schedulesLoading } = useTodayAssignedSchedules(userId)

    const markComplete = useMarkTaskComplete()
    const addAttachment = useAddAttachment()

    const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null)
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

    // We're still on the initial load if either query has no data yet
    const isInitialLoad = tasksLoading || schedulesLoading

    const hasItems = (todayTasks?.length ?? 0) > 0 || (todaySchedules?.length ?? 0) > 0

    const handleMarkDone = async (taskId: string) => {
        await markComplete.mutateAsync({ taskId, currentStage: workflowStage })
        setUploadingTaskId(null)
    }

    const handleFileUploaded = async (taskId: string, url: string, name: string) => {
        await addAttachment.mutateAsync({
            task_id: taskId,
            file_url: url,
            file_name: name,
            uploaded_by: userId,
            is_final: true,
        })
    }

    // Return null silently while loading — prevents the "appears then disappears"
    // flash when there are no tasks today (skeleton shows then section hides)
    if (isInitialLoad || !hasItems) return null

    return (
        <div className="space-y-4">
            <SectionHeader isAr={isAr} count={(todayTasks?.length ?? 0) + (todaySchedules?.length ?? 0)} />

            <AnimatePresence mode="popLayout">
                {/* Today's Tasks */}
                {todayTasks?.map((task) => (
                    <TodayTaskCard
                        key={`task-${task.id}`}
                        task={task}
                        isAr={isAr}
                        uploadingTaskId={uploadingTaskId}
                        onMarkDone={handleMarkDone}
                        onToggleUpload={(id) =>
                            setUploadingTaskId(prev => prev === id ? null : id)
                        }
                        onViewDetails={(id) => setSelectedTaskId(id)}
                        onFileUploaded={handleFileUploaded}
                        markCompletePending={markComplete.isPending}
                    />
                ))}

                {/* Today's Schedules */}
                {todaySchedules?.map((schedule) => (
                    <TodayScheduleCard
                        key={`schedule-${schedule.id}`}
                        schedule={schedule}
                        isAr={isAr}
                    />
                ))}
            </AnimatePresence>

            {/* Task Details Sheet */}
            {selectedTaskId && (
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

// ─── Sub-components ───────────────────────────────────────────────

function SectionHeader({ isAr, count }: { isAr: boolean; count: number }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h2 className="text-xl font-bold">
                    {isAr ? 'مهام اليوم' : "Today's Tasks"}
                </h2>
            </div>
            {count > 0 && (
                <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-semibold"
                >
                    {count}
                </Badge>
            )}
        </div>
    )
}

interface TodayTaskCardProps {
    task: TaskWithRelations
    isAr: boolean
    uploadingTaskId: string | null
    onMarkDone: (id: string) => void
    onToggleUpload: (id: string) => void
    onViewDetails: (id: string) => void
    onFileUploaded: (id: string, url: string, name: string) => void
    markCompletePending: boolean
}

function TodayTaskCard({
    task,
    isAr,
    uploadingTaskId,
    onMarkDone,
    onToggleUpload,
    onViewDetails,
    onFileUploaded,
    markCompletePending,
}: TodayTaskCardProps) {
    const locale = isAr ? ar : enUS

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            layout
        >
            <Card className="border-amber-200 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-900/10 hover:border-amber-400 transition-colors">
                <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:text-amber-400">
                                    {isAr ? 'مهمة' : 'Task'}
                                </Badge>
                                <h3 className="font-semibold text-base leading-snug">{task.title}</h3>
                            </div>
                            {task.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                            )}
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                {task.company_name && (
                                    <span className="flex items-center gap-1">
                                        <Building2 className="h-3.5 w-3.5" />
                                        {task.company_name}
                                    </span>
                                )}
                                {task.location && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {task.location}
                                    </span>
                                )}
                                {task.scheduled_date && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {format(new Date(task.scheduled_date), 'PP', { locale })}
                                    </span>
                                )}
                                {task.scheduled_time && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        {task.scheduled_time}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewDetails(task.id)}
                                title={isAr ? 'عرض التفاصيل' : 'View Details'}
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onToggleUpload(task.id)}
                            >
                                <Upload className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
                                {isAr ? 'رفع' : 'Upload'}
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => onMarkDone(task.id)}
                                disabled={markCompletePending}
                            >
                                {markCompletePending ? (
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
                                    userId={uploadingTaskId}
                                    onUploadComplete={({ file_url, file_name }) =>
                                        onFileUploaded(task.id, file_url, file_name)
                                    }
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
    )
}

function TodayScheduleCard({ schedule, isAr }: { schedule: ScheduleWithRelations; isAr: boolean }) {
    const locale = isAr ? ar : enUS

    const timeRange = [schedule.start_time, schedule.end_time]
        .filter(Boolean)
        .join(' — ')

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            layout
        >
            <Card className="border-blue-200 dark:border-blue-800/50 bg-blue-50/40 dark:bg-blue-900/10 hover:border-blue-400 transition-colors">
                <CardContent className="p-5 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 dark:text-blue-400">
                                    {isAr ? 'جلسة' : 'Session'}
                                </Badge>
                                <h3 className="font-semibold text-base leading-snug">{schedule.title}</h3>
                            </div>
                            {schedule.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">{schedule.description}</p>
                            )}
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                {schedule.company_name && (
                                    <span className="flex items-center gap-1">
                                        <Building2 className="h-3.5 w-3.5" />
                                        {schedule.company_name}
                                    </span>
                                )}
                                {schedule.location && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {schedule.location}
                                    </span>
                                )}
                                {schedule.scheduled_date && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {format(new Date(schedule.scheduled_date), 'PP', { locale })}
                                    </span>
                                )}
                                {timeRange && (
                                    <span className="flex items-center gap-1">
                                        <CalendarClock className="h-3.5 w-3.5" />
                                        {timeRange}
                                    </span>
                                )}
                            </div>
                            {schedule.team_leader && (
                                <p className="text-xs text-muted-foreground">
                                    {isAr ? 'من: ' : 'By: '}
                                    <span className="font-medium">{schedule.team_leader.name}</span>
                                </p>
                            )}
                            {schedule.notes && (
                                <p className="text-xs text-muted-foreground border-t pt-2 mt-1">
                                    {schedule.notes}
                                </p>
                            )}
                        </div>
                        <Badge
                            variant="secondary"
                            className="shrink-0 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                        >
                            {schedule.status === 'completed'
                                ? (isAr ? 'مكتملة' : 'Done')
                                : schedule.status === 'cancelled'
                                    ? (isAr ? 'ملغاة' : 'Cancelled')
                                    : (isAr ? 'مجدولة' : 'Scheduled')}
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
