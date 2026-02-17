'use client'

import { useState, useCallback, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import {
    KanbanBoard,
    TasksTable,
    TaskForm,
    TaskDetails,
    type TaskWithRelations
} from '@/components/tasks'
import { PendingRequests } from '@/components/tasks/pending-requests'
import type { TaskStatus } from '@/types/database'
import { Loader2, LayoutGrid, Table2 } from 'lucide-react'
import { useTasksRealtime } from '@/hooks/use-realtime'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AccountManagerDashboard() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setUserId(user.id)
        }
        fetchUser()
    }, [])

    useTasksRealtime(undefined)

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null)
    const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('new')
    const [viewMode, setViewMode] = useState<'kanban' | 'table'>('table')

    const handleTaskClick = useCallback((task: TaskWithRelations) => {
        setSelectedTask(task)
        setIsDetailsOpen(true)
    }, [])

    const handleCreateTask = useCallback((status?: TaskStatus) => {
        setDefaultStatus(status ?? 'new')
        setSelectedTask(null)
        setIsFormOpen(true)
    }, [])

    const handleEditTask = useCallback((task: TaskWithRelations) => {
        setSelectedTask(task)
        setIsDetailsOpen(false)
        setIsFormOpen(true)
    }, [])

    const handleFormSuccess = useCallback(() => {
        setIsFormOpen(false)
        setSelectedTask(null)
    }, [])

    if (!userId) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isAr ? 'لوحة إدارة المحتوى' : 'Content Management'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isAr
                            ? 'إدارة وتتبع مهام فريق المحتوى والتصميم'
                            : 'Manage and track content & design team tasks'
                        }
                    </p>
                </div>

                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'kanban' | 'table')}>
                    <TabsList>
                        <TabsTrigger value="table" className="gap-2">
                            <Table2 className="h-4 w-4" />
                            {isAr ? 'جدول' : 'Table'}
                        </TabsTrigger>
                        <TabsTrigger value="kanban" className="gap-2">
                            <LayoutGrid className="h-4 w-4" />
                            {isAr ? 'كانبان' : 'Kanban'}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <PendingRequests teamLeaderId={userId} />

            <Separator />

            {viewMode === 'table' ? (
                <TasksTable
                    projectId={undefined}
                    onTaskClick={handleTaskClick}
                    onCreateTask={() => handleCreateTask()}
                />
            ) : (
                <KanbanBoard
                    projectId={undefined}
                    onTaskClick={handleTaskClick}
                    onCreateTask={handleCreateTask}
                />
            )}

            <TaskForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                task={selectedTask}
                defaultStatus={defaultStatus}
                currentUserId={userId}
                onSuccess={handleFormSuccess}
            />

            <TaskDetails
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                taskId={selectedTask?.id ?? null}
                currentUserId={userId}
                onEdit={handleEditTask}
                canReturn={true}
            />
        </div>
    )
}
