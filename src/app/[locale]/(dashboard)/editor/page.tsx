'use client'

import { Film, CheckCircle } from 'lucide-react'
import { useEditorTasks } from '@/hooks/use-tasks'
import { useCurrentUser } from '@/hooks/use-users'
import { RoleDashboard } from '@/components/shared/role-dashboard'
import type { RoleDashboardConfig } from '@/components/shared/role-dashboard'

const config: RoleDashboardConfig = {
    icon: Film,
    title: { ar: 'مهام المونتاج', en: 'Editing Tasks' },
    subtitle: { ar: 'مهام المونتاج المسندة إليك', en: 'Video editing tasks assigned to you' },
    activeLabel: { ar: 'مهام المونتاج الحالية', en: 'Current Editing Tasks' },
    workflowStage: 'editing',
    activeFilter: (t) => t.workflow_stage === 'editing',
    completedFilter: (t) => t.workflow_stage === 'editing_done',
    emptyText: { ar: 'لا توجد مهام مونتاج حالية', en: 'No editing tasks right now' },
    showLocationFields: false,
    showViewDetails: false,
    showCompletedSection: false,
    stats: [
        {
            label: { ar: 'قيد المونتاج', en: 'In Editing' },
            icon: Film,
            iconClassName: 'text-purple-500',
            getValue: (active) => active.length,
        },
        {
            label: { ar: 'مكتملة', en: 'Completed' },
            icon: CheckCircle,
            iconClassName: 'text-green-500',
            getValue: (_, completed) => completed.length,
        },
    ],
}

export default function EditorDashboard() {
    const { data: currentUser } = useCurrentUser()
    const userId = currentUser?.id ?? ''
    const { data: tasks, isLoading } = useEditorTasks(userId)

    return <RoleDashboard config={config} tasks={tasks} isLoading={isLoading} />
}
