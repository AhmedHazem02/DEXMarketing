'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useActivityLog } from '@/hooks/use-cms'
import { useLocale, useTranslations } from 'next-intl'
import { Loader2, Activity, User, Settings, FileText, DollarSign, CheckSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'

const actionIcons: Record<string, React.ReactNode> = {
    login: <User className="h-4 w-4" />,
    logout: <User className="h-4 w-4" />,
    settings_update: <Settings className="h-4 w-4" />,
    page_update: <FileText className="h-4 w-4" />,
    transaction_create: <DollarSign className="h-4 w-4" />,
    task_create: <CheckSquare className="h-4 w-4" />,
    task_update: <CheckSquare className="h-4 w-4" />,
    task_delete: <CheckSquare className="h-4 w-4" />,
    schedule_create: <FileText className="h-4 w-4" />,
    schedule_update: <FileText className="h-4 w-4" />,
    schedule_delete: <FileText className="h-4 w-4" />,
    client_create: <User className="h-4 w-4" />,
    client_update: <User className="h-4 w-4" />,
    client_delete: <User className="h-4 w-4" />,
    user_create: <User className="h-4 w-4" />,
    theme_update: <Settings className="h-4 w-4" />,
    transaction_update: <DollarSign className="h-4 w-4" />,
    transaction_delete: <DollarSign className="h-4 w-4" />,
}

export function ActivityLogViewer() {
    const t = useTranslations('activityLog')
    const locale = useLocale()
    const { data: logs, isLoading } = useActivityLog(50)

    const formatDate = (date: string) => {
        return formatDistanceToNow(new Date(date), { addSuffix: true, locale: locale === 'ar' ? ar : undefined })
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    {t('title')}
                </CardTitle>
                <CardDescription>
                    {t('description')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[500px] pe-4">
                    <div className="space-y-4">
                        {logs?.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                {t('noActivity')}
                            </p>
                        ) : (
                            logs?.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src="" />
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {log.user?.name?.charAt(0) || log.user?.email?.charAt(0) || '?'}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium">
                                                {log.user?.name || log.user?.email || t('unknownUser')}
                                            </span>
                                            <Badge variant="outline" className="text-xs">
                                                {actionIcons[log.action] || <Activity className="h-3 w-3" />}
                                                <span className="ms-1">{t.has(`actions.${log.action}` as any) ? t(`actions.${log.action}` as any) : log.action}</span>
                                            </Badge>
                                        </div>

                                        {log.details && (
                                            <p className="text-sm text-muted-foreground mt-1 truncate">
                                                {typeof log.details === 'string'
                                                    ? log.details
                                                    : JSON.stringify(log.details)
                                                }
                                            </p>
                                        )}

                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <span>{formatDate(log.created_at)}</span>
                                            {log.ip_address && <span>IP: {log.ip_address}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
