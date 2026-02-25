'use client'

import { useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { RevisionsHub, TaskDetails, type TaskWithRelations } from '@/components/tasks'
import { useCurrentUser } from '@/hooks/use-users'

export default function AccountManagerRevisionsPage() {
    const { data: currentUser, isLoading } = useCurrentUser()

    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null)

    const handleTaskClick = useCallback((task: TaskWithRelations) => {
        setSelectedTask(task)
        setIsDetailsOpen(true)
    }, [])

    if (isLoading || !currentUser) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <>
            <RevisionsHub onTaskClick={handleTaskClick} />

            <TaskDetails
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                taskId={selectedTask?.id ?? null}
                currentUserId={currentUser.id}
            />
        </>
    )
}
