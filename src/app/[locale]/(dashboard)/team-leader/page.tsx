'use client'

import { useState, useCallback } from 'react'
import { useLocale } from 'next-intl'
import {
    KanbanBoard,
    TaskForm,
    TaskDetails,
    type TaskWithRelations
} from '@/components/tasks'
import type { TaskStatus } from '@/types/database'

// Temporary mock user - Replace with actual auth
const CURRENT_USER_ID = '00000000-0000-0000-0000-000000000001'

export default function TeamLeaderDashboard() {
    const locale = useLocale()
    const isAr = locale === 'ar'

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
                onTaskClick={handleTaskClick}
                onCreateTask={handleCreateTask}
            />

            {/* Task Form Modal */}
            <TaskForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                task={selectedTask}
                defaultStatus={defaultStatus}
                currentUserId={CURRENT_USER_ID}
                onSuccess={handleFormSuccess}
            />

            {/* Task Details Sheet */}
            <TaskDetails
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                taskId={selectedTask?.id ?? null}
                currentUserId={CURRENT_USER_ID}
                onEdit={handleEditTask}
            />
        </div>
    )
}
