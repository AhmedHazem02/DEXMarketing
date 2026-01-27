'use client'

import { useState, useCallback } from 'react'
import { RevisionsHub, TaskDetails, type TaskWithRelations } from '@/components/tasks'

// Temporary mock user - Replace with actual auth
const CURRENT_USER_ID = '00000000-0000-0000-0000-000000000001'

export default function RevisionsPage() {
    // State
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null)

    // Handlers
    const handleTaskClick = useCallback((task: TaskWithRelations) => {
        setSelectedTask(task)
        setIsDetailsOpen(true)
    }, [])

    return (
        <>
            <RevisionsHub onTaskClick={handleTaskClick} />

            {/* Task Details Sheet */}
            <TaskDetails
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                taskId={selectedTask?.id ?? null}
                currentUserId={CURRENT_USER_ID}
            />
        </>
    )
}
