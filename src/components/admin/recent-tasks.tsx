'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTasks } from '@/hooks'
import { Loader2, Clock } from 'lucide-react'
import type { TaskStatus } from '@/types/database'

const statusColors: Record<TaskStatus, string> = {
    new: 'bg-blue-500/20 text-blue-400',
    in_progress: 'bg-yellow-500/20 text-yellow-400',
    review: 'bg-purple-500/20 text-purple-400',
    revision: 'bg-orange-500/20 text-orange-400',
    approved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
}

const statusLabels: Record<TaskStatus, string> = {
    new: 'جديد',
    in_progress: 'قيد التنفيذ',
    review: 'مراجعة',
    revision: 'تعديل',
    approved: 'مقبول',
    rejected: 'مرفوض',
}

export function RecentTasks() {
    const { data: tasks, isLoading } = useTasks()

    const recentTasks = tasks?.slice(0, 5)

    const formatDate = (date: string | null) => {
        if (!date) return 'بدون موعد'
        return new Intl.DateTimeFormat('ar-EG', {
            day: 'numeric',
            month: 'short',
        }).format(new Date(date))
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>آخر المهام</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>آخر المهام</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {recentTasks?.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">لا توجد مهام بعد</p>
                    ) : (
                        recentTasks?.map((task) => (
                            <div key={task.id} className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{task.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className={statusColors[task.status]}>
                                            {statusLabels[task.status]}
                                        </Badge>
                                        {task.deadline && (
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(task.deadline)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
