'use client'

import { Camera, CheckCircle, Calendar } from 'lucide-react'
import { useMyTasks } from '@/hooks/use-tasks'
import { useCurrentUser } from '@/hooks/use-users'
import { RoleDashboard } from '@/components/shared/role-dashboard'
import type { RoleDashboardConfig } from '@/components/shared/role-dashboard'

const config: RoleDashboardConfig = {
    icon: Camera,
    title: { ar: 'مهام التصوير الفوتوغرافي', en: 'Photography Tasks' },
    subtitle: { ar: 'المهام المسندة إليك للتصوير', en: 'Photo shoot tasks assigned to you' },
    activeLabel: { ar: 'جلسات التصوير', en: 'Photo Sessions' },
    workflowStage: 'shooting',
    activeFilter: (t) => t.department === 'photography' && t.workflow_stage === 'shooting',
    completedFilter: (t) => t.department === 'photography' && t.workflow_stage !== 'shooting',
    emptyText: { ar: 'لا توجد جلسات تصوير الآن', en: 'No photo sessions scheduled' },
    showLocationFields: true,
    showViewDetails: true,
    showCompletedSection: false,
    stats: [
        {
            label: { ar: 'مهام نشطة', en: 'Active' },
            icon: Camera,
            getValue: (active) => active.length,
        },
        {
            label: { ar: 'مكتملة', en: 'Done' },
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

export default function PhotographerDashboard() {
    const { data: currentUser } = useCurrentUser()
    const userId = currentUser?.id ?? ''
    const { data: tasks, isLoading } = useMyTasks(userId)

    return <RoleDashboard config={config} tasks={tasks} isLoading={isLoading} />
}
