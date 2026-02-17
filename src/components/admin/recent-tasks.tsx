'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTasks } from '@/hooks'
import { Loader2, Clock } from 'lucide-react'
import { STATUS_CONFIG, getFormatters } from '@/lib/constants/admin'

export function RecentTasks() {
    const t = useTranslations('recentTasks')
    const { data: tasks, isLoading } = useTasks({}, 5)

    const { formatDate } = useMemo(() => getFormatters('ar'), [])

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t('title')}</CardTitle>
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
                <CardTitle>{t('title')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {tasks?.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">{t('noTasks')}</p>
                    ) : (
                        tasks?.map((task) => (
                            <div key={task.id} className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{task.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className={STATUS_CONFIG[task.status]?.style || STATUS_CONFIG.new.style}>
                                            {STATUS_CONFIG[task.status]?.label || task.status}
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
