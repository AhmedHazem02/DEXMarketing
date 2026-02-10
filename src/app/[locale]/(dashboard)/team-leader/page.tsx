'use client'

import { useState, useCallback, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import {
    KanbanBoard,
    TaskForm,
    TaskDetails,
    type TaskWithRelations
} from '@/components/tasks'
import type { TaskStatus } from '@/types/database'
import { Loader2 } from 'lucide-react'
import { useTasksRealtime } from '@/hooks/use-realtime'

export default function TeamLeaderDashboard() {
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

    // Enable realtime updates for tasks, comments, and attachments
    useTasksRealtime(undefined)

    // State for modals
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null)
    const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('new')

    // Handlers
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
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {isAr ? 'لوحة إدارة المهام' : 'Task Management'}
                </h1>
                <p className="text-muted-foreground mt-1">
                    {isAr
                        ? 'إدارة وتتبع جميع المهام والمشاريع'
                        : 'Manage and track all tasks and projects'
                    }
                </p>
            </div>

            {/* Kanban Board */}
            <KanbanBoard
                projectId={undefined} // Pass undefined for all projects
                onTaskClick={handleTaskClick}
                onCreateTask={handleCreateTask}
            />

            {/* Task Form Modal */}
            <TaskForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                task={selectedTask}
                defaultStatus={defaultStatus}
                currentUserId={userId}
                onSuccess={handleFormSuccess}
            />

            {/* Task Details Sheet */}
            <TaskDetails
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                taskId={selectedTask?.id ?? null}
                currentUserId={userId}
                onEdit={handleEditTask}
            />
        </div>
    )
}
