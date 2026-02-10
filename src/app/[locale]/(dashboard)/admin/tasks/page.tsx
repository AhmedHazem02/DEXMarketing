'use client'

import { useLocale } from 'next-intl'
import { TasksManager } from '@/components/admin/tasks-manager'

export default function AdminTasksPage() {
    return (
        <div className="space-y-4 md:space-y-6">
            <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                    إدارة المهام الشاملة
                </h1>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                    عرض ومتابعة جميع المهام في النظام، وتصفية البيانات وتصديرها.
                </p>
            </div>

            <TasksManager />
        </div>
    )
}
