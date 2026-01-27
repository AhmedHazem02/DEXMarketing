'use client'

import { useLocale } from 'next-intl'
import { TasksManager } from '@/components/admin/tasks-manager'

export default function AdminTasksPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">
                إدارة المهام الشاملة
            </h1>
            <p className="text-muted-foreground">
                عرض ومتابعة جميع المهام في النظام، وتصفية البيانات وتصديرها.
            </p>

            <TasksManager />
        </div>
    )
}
