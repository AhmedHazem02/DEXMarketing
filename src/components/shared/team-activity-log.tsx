'use client'

import { useState, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
    Activity, User, Settings, FileText, DollarSign,
    CheckSquare, Calendar, Loader2, Filter, X, Search, Users,
} from 'lucide-react'
import { useTeamActivityLog } from '@/hooks/use-team-logs'

// ============================================
// Action config
// ============================================

const actionIcons: Record<string, React.ReactNode> = {
    login: <User className="h-4 w-4" />,
    logout: <User className="h-4 w-4" />,
    settings_update: <Settings className="h-4 w-4" />,
    page_update: <FileText className="h-4 w-4" />,
    transaction_create: <DollarSign className="h-4 w-4" />,
    task_create: <CheckSquare className="h-4 w-4" />,
    task_update: <CheckSquare className="h-4 w-4" />,
    schedule_create: <Calendar className="h-4 w-4" />,
    schedule_update: <Calendar className="h-4 w-4" />,
    schedule_delete: <Calendar className="h-4 w-4" />,
}

const actionLabels: Record<string, { en: string; ar: string }> = {
    login: { en: 'Login', ar: 'تسجيل دخول' },
    logout: { en: 'Logout', ar: 'تسجيل خروج' },
    settings_update: { en: 'Settings updated', ar: 'تحديث إعدادات' },
    page_update: { en: 'Page updated', ar: 'تحديث صفحة' },
    transaction_create: { en: 'New transaction', ar: 'معاملة جديدة' },
    task_create: { en: 'Task created', ar: 'مهمة جديدة' },
    task_update: { en: 'Task updated', ar: 'تحديث مهمة' },
    schedule_create: { en: 'Schedule created', ar: 'جدولة جديدة' },
    schedule_update: { en: 'Schedule updated', ar: 'تحديث جدولة' },
    schedule_delete: { en: 'Schedule deleted', ar: 'حذف جدولة' },
    user_update: { en: 'User updated', ar: 'تحديث مستخدم' },
    user_delete: { en: 'User deleted', ar: 'حذف مستخدم' },
}

// ============================================
// Component
// ============================================

interface TeamActivityLogProps {
    teamLeaderId: string
}

export function TeamActivityLog({ teamLeaderId }: TeamActivityLogProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const { data: logs, isLoading } = useTeamActivityLog(teamLeaderId)

    // Filter state
    const [memberFilter, setMemberFilter] = useState<string>('all')
    const [actionFilter, setActionFilter] = useState<string>('all')
    const [dateFrom, setDateFrom] = useState<string>('')
    const [dateTo, setDateTo] = useState<string>('')

    // Extract unique members from logs
    const uniqueMembers = useMemo(() => {
        const map = new Map<string, { id: string; name: string }>()
        logs?.forEach(log => {
            if (log.user) {
                map.set(log.user.id, { id: log.user.id, name: log.user.name || log.user.email })
            }
        })
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
    }, [logs])

    // Extract unique actions from logs
    const uniqueActions = useMemo(() => {
        const set = new Set<string>()
        logs?.forEach(log => set.add(log.action))
        return Array.from(set).sort()
    }, [logs])

    // Apply filters
    const filteredLogs = useMemo(() => {
        if (!logs) return []
        return logs.filter(log => {
            if (memberFilter !== 'all' && log.user?.id !== memberFilter) return false
            if (actionFilter !== 'all' && log.action !== actionFilter) return false
            if (dateFrom) {
                const logDate = new Date(log.created_at).toISOString().slice(0, 10)
                if (logDate < dateFrom) return false
            }
            if (dateTo) {
                const logDate = new Date(log.created_at).toISOString().slice(0, 10)
                if (logDate > dateTo) return false
            }
            return true
        })
    }, [logs, memberFilter, actionFilter, dateFrom, dateTo])

    const hasActiveFilters = memberFilter !== 'all' || actionFilter !== 'all' || dateFrom || dateTo
    const clearFilters = () => {
        setMemberFilter('all')
        setActionFilter('all')
        setDateFrom('')
        setDateTo('')
    }

    const formatDate = (date: string) => {
        const d = new Date(date)
        const now = new Date()
        const diff = now.getTime() - d.getTime()

        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000)
            return isAr ? `منذ ${minutes} دقيقة` : `${minutes}m ago`
        }

        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000)
            return isAr ? `منذ ${hours} ساعة` : `${hours}h ago`
        }

        return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    if (isLoading) {
        return (
            <Card className="rounded-2xl">
                <CardContent className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-primary" />
                    {isAr ? 'سجل نشاط الفريق' : 'Team Activity Log'}
                </CardTitle>
                <CardDescription>
                    {isAr ? `آخر ${logs?.length || 0} نشاط لأعضاء فريقك` : `Last ${logs?.length || 0} activities from your team`}
                </CardDescription>
            </CardHeader>

            {/* Filters */}
            <div className="px-6 pb-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Member filter */}
                    <Select value={memberFilter} onValueChange={setMemberFilter}>
                        <SelectTrigger className="w-[180px] h-9 text-xs">
                            <Users className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
                            <SelectValue placeholder={isAr ? 'العضو' : 'Member'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{isAr ? 'كل الأعضاء' : 'All Members'}</SelectItem>
                            {uniqueMembers.map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Action filter */}
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                        <SelectTrigger className="w-[180px] h-9 text-xs">
                            <Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
                            <SelectValue placeholder={isAr ? 'النشاط' : 'Action'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{isAr ? 'كل الأنشطة' : 'All Actions'}</SelectItem>
                            {uniqueActions.map(a => (
                                <SelectItem key={a} value={a}>
                                    {actionLabels[a] ? (isAr ? actionLabels[a].ar : actionLabels[a].en) : a}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Date from */}
                    <Input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="w-[150px] h-9 text-xs"
                        placeholder={isAr ? 'من تاريخ' : 'From'}
                    />

                    {/* Date to */}
                    <Input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="w-[150px] h-9 text-xs"
                        placeholder={isAr ? 'إلى تاريخ' : 'To'}
                    />

                    {/* Clear filters */}
                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-xs gap-1">
                            <X className="h-3.5 w-3.5" />
                            {isAr ? 'مسح' : 'Clear'}
                        </Button>
                    )}
                </div>

                {hasActiveFilters && (
                    <p className="text-xs text-muted-foreground">
                        {isAr
                            ? `عرض ${filteredLogs.length} من ${logs?.length || 0} نتيجة`
                            : `Showing ${filteredLogs.length} of ${logs?.length || 0} results`}
                    </p>
                )}
            </div>

            <CardContent>
                <ScrollArea className="h-[600px] pe-4">
                    <div className="space-y-3">
                        {filteredLogs.length === 0 ? (
                            <div className="text-center py-12">
                                <Activity className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    {isAr
                                        ? (hasActiveFilters ? 'لا توجد نتائج مطابقة للفلتر' : 'لا يوجد نشاط بعد')
                                        : (hasActiveFilters ? 'No results match your filters' : 'No activity yet')}
                                </p>
                            </div>
                        ) : (
                            filteredLogs.map((log) => {
                                const label = actionLabels[log.action]
                                return (
                                    <div
                                        key={log.id}
                                        className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-card/50 hover:bg-muted/30 transition-colors"
                                    >
                                        <Avatar className="h-9 w-9 shrink-0">
                                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                                {log.user?.name?.charAt(0) || '?'}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-sm">
                                                    {log.user?.name || log.user?.email || (isAr ? 'مستخدم غير معروف' : 'Unknown user')}
                                                </span>
                                                <Badge variant="outline" className="text-[10px] h-5 rounded-md px-1.5 gap-1">
                                                    {actionIcons[log.action] || <Activity className="h-3 w-3" />}
                                                    <span>{label ? (isAr ? label.ar : label.en) : log.action}</span>
                                                </Badge>
                                            </div>

                                            {log.details && (
                                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                                    {typeof log.details === 'string'
                                                        ? log.details
                                                        : JSON.stringify(log.details)}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                                                <span>{formatDate(log.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
