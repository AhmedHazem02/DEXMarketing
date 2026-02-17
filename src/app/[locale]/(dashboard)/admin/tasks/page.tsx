import nextDynamic from 'next/dynamic'
import { PageHeader } from '@/components/admin/page-header'

const TasksManager = nextDynamic(
    () => import('@/components/admin/tasks-manager').then(mod => ({ default: mod.TasksManager })),
    { loading: () => <div className="animate-pulse space-y-4"><div className="h-10 bg-muted rounded" /><div className="h-96 bg-muted rounded" /></div> }
)

export const dynamic = 'force-dynamic'

export default function AdminTasksPage() {
    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title="إدارة المهام الشاملة"
                description="عرض ومتابعة جميع المهام في النظام، وتصفية البيانات وتصديرها."
            />
            <TasksManager />
        </div>
    )
}
