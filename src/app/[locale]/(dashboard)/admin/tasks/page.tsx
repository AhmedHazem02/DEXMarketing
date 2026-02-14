import { TasksManager } from '@/components/admin/tasks-manager'
import { PageHeader } from '@/components/admin/page-header'

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
