'use client'

import { useState, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Film, Clock, Calendar, CheckCircle, Loader2, Upload,
    Building2, Play, Eye
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEditorTasks, useMarkTaskComplete, useAddAttachment } from '@/hooks/use-tasks'
import { useTasksRealtime } from '@/hooks/use-realtime'
import { useCurrentUser } from '@/hooks/use-users'
import { FileUploadZone } from '@/components/tasks'
import type { TaskWithRelations } from '@/types/task'
import { getWorkflowStageConfig } from '@/types/task'
import type { WorkflowStage } from '@/types/database'

export default function EditorDashboard() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const { data: currentUser } = useCurrentUser()
    const userId = currentUser?.id ?? null
    const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null)

    useTasksRealtime()

    const { data: tasks, isLoading } = useEditorTasks(userId ?? '')
    const markComplete = useMarkTaskComplete()
    const addAttachment = useAddAttachment()

    const activeTasks = useMemo(() =>
        tasks?.filter(t => t.workflow_stage === 'editing') ?? [],
        [tasks]
    )

    const completedTasks = useMemo(() =>
        tasks?.filter(t => t.workflow_stage === 'editing_done') ?? [],
        [tasks]
    )

    const handleMarkDone = async (taskId: string) => {
        await markComplete.mutateAsync({ taskId, currentStage: 'editing' as WorkflowStage })
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {isAr ? 'مهام المونتاج' : 'Editing Tasks'}
                </h1>
                <p className="text-muted-foreground mt-1">
                    {isAr ? 'مهام المونتاج المسندة إليك' : 'Video editing tasks assigned to you'}
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{isAr ? 'قيد المونتاج' : 'In Editing'}</CardTitle>
                        <Film className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeTasks.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{isAr ? 'مكتملة' : 'Completed'}</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedTasks.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Active Tasks */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">{isAr ? 'مهام المونتاج الحالية' : 'Current Editing Tasks'}</h2>
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
                    </div>
                ) : activeTasks.length === 0 ? (
                    <Card className="p-8 text-center">
                        <Film className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">{isAr ? 'لا توجد مهام مونتاج حالية' : 'No editing tasks right now'}</p>
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
                                                    {task.deadline && (
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

                                        {/* Upload zone */}
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
                                                        onUploadComplete={({ file_url, file_name }) => handleFileUploaded(task.id, file_url, file_name)}
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
        </div>
    )
}
