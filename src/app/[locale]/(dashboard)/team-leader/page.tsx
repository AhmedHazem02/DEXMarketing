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
import type { TaskStatus, Department } from '@/types/database'
import { Loader2, LayoutGrid, Table2 } from 'lucide-react'
import { useTasksRealtime } from '@/hooks/use-realtime'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCurrentUser } from '@/hooks/use-users'

export default function TeamLeaderDashboard() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const [userId, setUserId] = useState<string | null>(null)
    const { data: currentUser } = useCurrentUser()
    const myDepartment = currentUser?.department as Department | undefined
    const otherDepartment: Department | undefined = myDepartment === 'photography' ? 'content' : myDepartment === 'content' ? 'photography' : undefined

    // Department filter: 'mine' = my department, 'other' = the other department
    const [deptFilter, setDeptFilter] = useState<'mine' | 'other'>('mine')
    const activeDepartment = deptFilter === 'mine' ? myDepartment : otherDepartment

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
    const [viewMode, setViewMode] = useState<'kanban' | 'table'>('table')

    // Read-only when viewing the other department
    const isOtherDept = deptFilter === 'other'

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
            <div className="flex items-start justify-between gap-4">
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
                
                <div className="flex items-center gap-3">
                    {/* Department Filter */}
                    {myDepartment && otherDepartment && (
                        <Tabs value={deptFilter} onValueChange={(v) => setDeptFilter(v as 'mine' | 'other')}>
                            <TabsList>
                                <TabsTrigger value="mine" className="gap-2">
                                    {isAr
                                        ? myDepartment === 'photography' ? '📸 التصوير' : '✍️ المحتوى'
                                        : myDepartment === 'photography' ? '📸 Photography' : '✍️ Content'
                                    }
                                </TabsTrigger>
                                <TabsTrigger value="other" className="gap-2">
                                    {isAr
                                        ? otherDepartment === 'photography' ? '📸 التصوير' : '✍️ المحتوى'
                                        : otherDepartment === 'photography' ? '📸 Photography' : '✍️ Content'
                                    }
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}

                    {/* View Toggle */}
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
            </div>

            {/* Client Requests Section */}
            <PendingRequests teamLeaderId={userId} />

            <Separator />

            {/* Tasks View - Table or Kanban */}
            {viewMode === 'table' ? (
                <TasksTable
                    projectId={undefined}
                    department={activeDepartment}
                    readOnly={isOtherDept}
                    onTaskClick={handleTaskClick}
                    onCreateTask={isOtherDept ? undefined : () => handleCreateTask()}
                />
            ) : (
                <KanbanBoard
                    projectId={undefined}
                    department={activeDepartment}
                    readOnly={isOtherDept}
                    onTaskClick={handleTaskClick}
                    onCreateTask={isOtherDept ? undefined : handleCreateTask}
                />
            )}

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
                onEdit={isOtherDept ? undefined : handleEditTask}
                canReturn={!isOtherDept}
            />
        </div>
    )
}
