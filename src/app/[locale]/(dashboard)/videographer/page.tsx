'use client'

import { Video, CheckCircle, Calendar } from 'lucide-react'
import { useMyTasks } from '@/hooks/use-tasks'
import { useCurrentUser } from '@/hooks/use-users'
import { RoleDashboard } from '@/components/shared/role-dashboard'
import type { RoleDashboardConfig } from '@/components/shared/role-dashboard'

const config: RoleDashboardConfig = {
    icon: Video,
    title: { ar: 'مهام التصوير', en: 'My Filming Tasks' },
    subtitle: { ar: 'المهام المسندة إليك للتصوير', en: 'Tasks assigned to you for filming' },
    activeLabel: { ar: 'المهام النشطة', en: 'Active Tasks' },
    workflowStage: 'filming',
    activeFilter: (t) => t.department === 'photography' && t.workflow_stage === 'filming',
    completedFilter: (t) => t.department === 'photography' && t.workflow_stage !== 'filming',
    emptyText: { ar: 'لا توجد مهام نشطة', en: 'No active tasks' },
    showLocationFields: true,
    showViewDetails: true,
    showCompletedSection: true,
    completedLabel: { ar: 'المهام السابقة', en: 'Previous Tasks' },
    stats: [
        {
            label: { ar: 'مهام نشطة', en: 'Active Tasks' },
            icon: Video,
            getValue: (active) => active.length,
        },
        {
            label: { ar: 'مكتملة', en: 'Completed' },
            icon: CheckCircle,
            iconClassName: 'text-green-500',
            getValue: (_, completed) => completed.length,
        },
        {
            label: { ar: 'لليوم', en: 'Today' },
            icon: Calendar,
            getValue: (active) =>
                active.filter(t => t.scheduled_date === new Date().toISOString().split('T')[0]).length,
        },
    ],
}

export default function VideographerDashboard() {
    const { data: currentUser } = useCurrentUser()
    const userId = currentUser?.id ?? ''
    const { data: tasks, isLoading } = useMyTasks(userId)

    return <RoleDashboard config={config} tasks={tasks} isLoading={isLoading} />
}
