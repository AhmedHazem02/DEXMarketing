'use client'

import { useState, useMemo, memo } from 'react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    useTreasury,
    useTransactionSummary,
    useTransactions,
    useUsers,
    useTasks,
} from '@/hooks'
import {
    DollarSign,
    Users,
    TrendingUp,
    TrendingDown,
    ArrowUp,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    CheckCircle2,
    AlertTriangle,
    ListTodo,
    Building2,
    CalendarDays,
    Activity,
    RotateCcw,
} from 'lucide-react'
import { isBefore } from 'date-fns'
import type { TaskStatus, Transaction, User } from '@/types/database'
import type { TaskWithRelations } from '@/types/task'
import { Skeleton } from '@/components/ui/skeleton'
import {
    DASHBOARD_DEPARTMENT_OPTIONS,
    PERIOD_OPTIONS,
    getFormatters,
    type Period,
} from '@/lib/constants/admin'
import { StatusBadge as TaskStatusBadge, PriorityDot } from '@/components/shared/task-badges'

// ============================================
// Loading Skeleton
// ============================================

function DashboardSkeleton() {
    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-4 w-60" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-[140px]" />
                    <Skeleton className="h-9 w-[130px]" />
                </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-lg" />)}
            </div>
        </div>
    )
}

// ============================================
// Main Component
// ============================================

export function AdminDashboardClient() {
    const locale = useLocale()
    const t = useTranslations('adminDashboard')
    const { formatCurrency, formatDate } = useMemo(() => getFormatters(locale), [locale])
    const [period, setPeriod] = useState<Period>('month')
    const [departmentFilter, setDepartmentFilter] = useState('all')

    // Data hooks - each has staleTime for caching
    const { data: treasury, isLoading: treasuryLoading } = useTreasury()
    const { data: summary } = useTransactionSummary(period)
    const { data: users, isLoading: usersLoading } = useUsers()
    const { data: allTasks, isLoading: tasksLoading } = useTasks()
    const { data: transactions } = useTransactions({ limit: 7 })

    // Filter tasks by department
    const tasks = useMemo(() => {
        if (!allTasks) return [] as TaskWithRelations[]
        if (departmentFilter === 'all') return allTasks as TaskWithRelations[]
        return (allTasks as TaskWithRelations[]).filter((t) => t.department === departmentFilter)
    }, [allTasks, departmentFilter])

    // Task statistics - single pass instead of multiple .filter() calls
    const taskStats = useMemo(() => {
        if (!tasks) return null
        const arr = tasks
        const now = new Date()

        const stats = {
            total: arr.length,
            new: 0,
            inProgress: 0,
            review: 0,
            revision: 0,
            approved: 0,
            rejected: 0,
            overdue: 0,
            contentDept: 0,
            photoDept: 0,
            noDept: 0,
            urgent: 0,
            high: 0,
        }

        for (const t of arr) {
            // Status counts
            switch (t.status) {
                case 'new': stats.new++; break
                case 'in_progress': stats.inProgress++; break
                case 'review': stats.review++; break
                case 'revision': stats.revision++; break
                case 'approved': stats.approved++; break
                case 'rejected': stats.rejected++; break
            }

            // Overdue check
            if (t.deadline && isBefore(new Date(t.deadline), now) && t.status !== 'approved' && t.status !== 'rejected') {
                stats.overdue++
            }

            // Department counts
            if (t.department === 'content') stats.contentDept++
            else if (t.department === 'photography') stats.photoDept++
            else if (!t.department) stats.noDept++

            // Priority counts
            if (t.priority === 'urgent') stats.urgent++
            else if (t.priority === 'high') stats.high++
        }

        return stats
    }, [tasks])

    // User statistics - single pass
    const userStats = useMemo(() => {
        if (!users) return null

        const stats = {
            total: users.length,
            active: 0,
            admins: 0,
            teamLeaders: 0,
            creators: 0,
            editors: 0,
            videographers: 0,
            photographers: 0,
            clients: 0,
            contentDept: 0,
            photoDept: 0,
        }

        for (const u of users) {
            if (u.is_active) stats.active++

            switch (u.role) {
                case 'admin': stats.admins++; break
                case 'team_leader': stats.teamLeaders++; break
                case 'creator': stats.creators++; break
                case 'editor': stats.editors++; break
                case 'videographer': stats.videographers++; break
                case 'photographer': stats.photographers++; break
                case 'client': stats.clients++; break
            }

            if (u.department === 'content') stats.contentDept++
            else if (u.department === 'photography') stats.photoDept++
        }

        return stats
    }, [users])

    // Recent tasks (latest 6)
    const recentTasks = useMemo(() => {
        if (!tasks) return [] as TaskWithRelations[]
        return tasks.slice(0, 6)
    }, [tasks])

    // Progressive loading - show content as it arrives instead of blocking all
    const isInitialLoading = treasuryLoading && usersLoading && tasksLoading

    // Memoized period label
    const periodLabel = useMemo(() =>
        PERIOD_OPTIONS.find(p => p.value === period)?.label ?? '',
    [period])

    if (isInitialLoading) {
        return <DashboardSkeleton />
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {t('subtitle')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-[140px] sm:w-[160px] h-9 text-sm">
                            <Building2 className="w-3.5 h-3.5 ms-1.5 text-muted-foreground shrink-0" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {DASHBOARD_DEPARTMENT_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                        <SelectTrigger className="w-[130px] sm:w-[150px] h-9 text-sm">
                            <CalendarDays className="w-3.5 h-3.5 ms-1.5 text-muted-foreground shrink-0" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PERIOD_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* ============================================ */}
            {/* Financial Stats - Top Row */}
            {/* ============================================ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                <StatCard
                    title={t('treasuryBalance')}
                    value={formatCurrency(treasury?.current_balance || 0)}
                    icon={<DollarSign className="h-4 w-4" />}
                    iconBg="bg-emerald-500/10 text-emerald-600"
                />
                <StatCard
                    title={t('revenue', { period: periodLabel })}
                    value={formatCurrency(summary?.totalIncome || 0)}
                    icon={<TrendingUp className="h-4 w-4" />}
                    iconBg="bg-green-500/10 text-green-600"
                    subtitle={summary?.totalIncome ? t('netAmount', { amount: formatCurrency(summary.netBalance) }) : undefined}
                    subtitleColor={summary && summary.netBalance >= 0 ? 'text-green-600' : 'text-red-500'}
                />
                <StatCard
                    title={t('expenses', { period: periodLabel })}
                    value={formatCurrency(summary?.totalExpense || 0)}
                    icon={<TrendingDown className="h-4 w-4" />}
                    iconBg="bg-red-500/10 text-red-600"
                />
                <StatCard
                    title={t('activeUsers')}
                    value={userStats?.active ?? 0}
                    icon={<Users className="h-4 w-4" />}
                    iconBg="bg-blue-500/10 text-blue-600"
                    subtitle={t('ofTotal', { total: String(userStats?.total ?? 0) })}
                />
            </div>

            {/* ============================================ */}
            {/* Task Stats - Status Breakdown */}
            {/* ============================================ */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                <MiniStatCard label={t('statusNew')} value={taskStats?.new ?? 0} color="bg-blue-500" />
                <MiniStatCard label={t('statusInProgress')} value={taskStats?.inProgress ?? 0} color="bg-yellow-500" />
                <MiniStatCard label={t('statusReview')} value={taskStats?.review ?? 0} color="bg-purple-500" />
                <MiniStatCard label={t('statusRevision')} value={taskStats?.revision ?? 0} color="bg-orange-500" />
                <MiniStatCard label={t('statusApproved')} value={taskStats?.approved ?? 0} color="bg-green-500" />
                <MiniStatCard label={t('statusRejected')} value={taskStats?.rejected ?? 0} color="bg-red-500" />
                <MiniStatCard
                    label={t('statusOverdue')}
                    value={taskStats?.overdue ?? 0}
                    color="bg-red-600"
                    alert={taskStats ? taskStats.overdue > 0 : false}
                />
            </div>

            {/* ============================================ */}
            {/* Middle Section: Departments + Team + Priorities */}
            {/* ============================================ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {/* Department Breakdown */}
                <Card>
                    <CardHeader className="pb-3 px-3 sm:px-6 pt-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            {t('tasksByDepartment')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6 pb-4 space-y-3">
                        <DeptBar
                            label={t('deptContent')}
                            count={taskStats?.contentDept ?? 0}
                            total={taskStats?.total ?? 1}
                            color="bg-indigo-500"
                        />
                        <DeptBar
                            label={t('deptPhotography')}
                            count={taskStats?.photoDept ?? 0}
                            total={taskStats?.total ?? 1}
                            color="bg-cyan-500"
                        />
                        <DeptBar
                            label={t('deptNone')}
                            count={taskStats?.noDept ?? 0}
                            total={taskStats?.total ?? 1}
                            color="bg-gray-400"
                        />
                        <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between">
                            <span>{t('totalTasks')}</span>
                            <span className="font-bold text-foreground">{taskStats?.total ?? 0}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Team Breakdown */}
                <Card>
                    <CardHeader className="pb-3 px-3 sm:px-6 pt-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            {t('team')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6 pb-4">
                        <div className="grid grid-cols-2 gap-2">
                            <RoleStat label={t('roleAdmin')} count={userStats?.admins ?? 0} icon="🛡️" />
                            <RoleStat label={t('roleTeamLeader')} count={userStats?.teamLeaders ?? 0} icon="👑" />
                            <RoleStat label={t('roleCreator')} count={userStats?.creators ?? 0} icon="✍️" />
                            <RoleStat label={t('roleVideographer')} count={userStats?.videographers ?? 0} icon="🎬" />
                            <RoleStat label={t('roleEditor')} count={userStats?.editors ?? 0} icon="🎞️" />
                            <RoleStat label={t('rolePhotographer')} count={userStats?.photographers ?? 0} icon="📷" />
                            <RoleStat label={t('roleClients')} count={userStats?.clients ?? 0} icon="👤" />
                            <RoleStat label={t('total')} count={userStats?.total ?? 0} icon="📊" highlight />
                        </div>
                    </CardContent>
                </Card>

                {/* Urgent & Priority */}
                <Card>
                    <CardHeader className="pb-3 px-3 sm:px-6 pt-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                            {t('importantAlerts')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6 pb-4 space-y-3">
                        {(taskStats?.overdue ?? 0) > 0 && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                                    <Clock className="w-4 h-4 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-red-700 dark:text-red-400">{t('overdueTasksAlert', { count: taskStats?.overdue ?? 0 })}</p>
                                    <p className="text-[10px] text-red-500">{t('pastDeadline')}</p>
                                </div>
                            </div>
                        )}
                        {(taskStats?.urgent ?? 0) > 0 && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20">
                                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-orange-700 dark:text-orange-400">{t('urgentTasksAlert', { count: taskStats?.urgent ?? 0 })}</p>
                                    <p className="text-[10px] text-orange-500">{t('needsImmediateAttention')}</p>
                                </div>
                            </div>
                        )}
                        {(taskStats?.high ?? 0) > 0 && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                    <ArrowUp className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">{t('highPriorityAlert', { count: taskStats?.high ?? 0 })}</p>
                                    <p className="text-[10px] text-amber-500">{t('needsFollowUp')}</p>
                                </div>
                            </div>
                        )}
                        {(taskStats?.revision ?? 0) > 0 && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20">
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                                    <RotateCcw className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-purple-700 dark:text-purple-400">{t('revisionTasksAlert', { count: taskStats?.revision ?? 0 })}</p>
                                    <p className="text-[10px] text-purple-500">{t('needsRevisions')}</p>
                                </div>
                            </div>
                        )}
                        {(taskStats?.overdue ?? 0) === 0 && (taskStats?.urgent ?? 0) === 0 && (taskStats?.high ?? 0) === 0 && (taskStats?.revision ?? 0) === 0 && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 dark:bg-green-500/10">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <p className="text-sm text-green-700 dark:text-green-400">{t('noAlerts')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ============================================ */}
            {/* Bottom Section: Recent Tasks + Recent Transactions */}
            {/* ============================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                {/* Recent Tasks */}
                <Card>
                    <CardHeader className="pb-3 px-3 sm:px-6 pt-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <ListTodo className="w-4 h-4 text-muted-foreground" />
                                {t('recentTasks')}
                                {departmentFilter !== 'all' && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5">
                                        {departmentFilter === 'content' ? t('content') : t('photography')}
                                    </Badge>
                                )}
                            </CardTitle>
                            <span className="text-xs text-muted-foreground">{t('taskCount', { count: taskStats?.total ?? 0 })}</span>
                        </div>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6 pb-4">
                        <div className="space-y-2.5">
                            {recentTasks.length === 0 ? (
                                <p className="text-muted-foreground text-center py-6 text-sm">{t('noTasks')}</p>
                            ) : (
                                recentTasks.map((task) => (
                                    <div key={task.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-sm truncate">{task.title}</p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                <TaskStatusBadge status={task.status} className="text-[10px] px-1.5 py-0" />
                                                {task.department && (
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                        {task.department === 'content' ? t('content') : t('photography')}
                                                    </Badge>
                                                )}
                                                <PriorityDot priority={task.priority} />
                                                {task.deadline && (
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                                        <Clock className="h-2.5 w-2.5" />
                                                        {formatDate(task.deadline)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-start shrink-0">
                                            {task.assigned_user ? (
                                                <div className="flex items-center gap-1.5">
                                                    {task.assigned_user.avatar_url ? (
                                                        <Image src={task.assigned_user.avatar_url} alt={task.assigned_user.name || 'User avatar'} width={20} height={20} className="w-5 h-5 rounded-full" />
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">
                                                            {task.assigned_user.name?.[0]}
                                                        </div>
                                                    )}
                                                    <span className="text-xs text-muted-foreground hidden sm:inline">{task.assigned_user.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground">{t('unassigned')}</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card>
                    <CardHeader className="pb-3 px-3 sm:px-6 pt-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Activity className="w-4 h-4 text-muted-foreground" />
                                {t('recentTransactions')}
                            </CardTitle>
                            {summary && (
                                <Badge variant={summary.netBalance >= 0 ? 'default' : 'destructive'} className="text-[10px]">
                                    {t('netAmount', { amount: formatCurrency(summary.netBalance) })}
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6 pb-4">
                        <div className="space-y-2.5">
                            {!transactions || transactions.length === 0 ? (
                                <p className="text-muted-foreground text-center py-6 text-sm">{t('noTransactions')}</p>
                            ) : (
                                (transactions as Transaction[]).map((tx) => (
                                    <div key={tx.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                            tx.type === 'income'
                                                ? 'bg-green-500/15 text-green-600'
                                                : 'bg-red-500/15 text-red-600'
                                        }`}>
                                            {tx.type === 'income' ? (
                                                <ArrowUpRight className="h-4 w-4" />
                                            ) : (
                                                <ArrowDownRight className="h-4 w-4" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">
                                                {tx.description || (tx.type === 'income' ? t('income') : t('expense'))}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {tx.category || t('general')} • {formatDate(tx.created_at)}
                                            </p>
                                        </div>
                                        <span className={`font-bold text-sm whitespace-nowrap ${
                                            tx.type === 'income' ? 'text-green-600' : 'text-red-500'
                                        }`}>
                                            {tx.type === 'income' ? '+' : '-'}
                                            {formatCurrency(tx.amount)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// ============================================
// Sub-Components (Memoized)
// ============================================

const StatCard = memo(function StatCard({
    title,
    value,
    icon,
    iconBg,
    subtitle,
    subtitleColor,
}: {
    title: string
    value: string | number
    icon: React.ReactNode
    iconBg: string
    subtitle?: string
    subtitleColor?: string
}) {
    return (
        <Card>
            <CardContent className="p-3 sm:p-4 md:p-5">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">{title}</p>
                        <p className="text-base sm:text-lg md:text-2xl font-bold mt-0.5 truncate">{value}</p>
                        {subtitle && (
                            <p className={`text-[10px] sm:text-xs mt-0.5 ${subtitleColor || 'text-muted-foreground'}`}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
})

const MiniStatCard = memo(function MiniStatCard({
    label,
    value,
    color,
    alert = false,
}: {
    label: string
    value: number
    color: string
    alert?: boolean
}) {
    return (
        <div className={`rounded-lg border p-2 sm:p-2.5 text-center transition-colors ${
            alert ? 'border-red-300 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5' : ''
        }`}>
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{label}</span>
            </div>
            <p className={`text-lg sm:text-xl font-bold ${alert && value > 0 ? 'text-red-600' : ''}`}>{value}</p>
        </div>
    )
})

const DeptBar = memo(function DeptBar({
    label,
    count,
    total,
    color,
}: {
    label: string
    count: number
    total: number
    color: string
}) {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-semibold">{count} <span className="text-muted-foreground font-normal">({percentage}%)</span></span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                    className={`h-full rounded-full ${color} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
})

const RoleStat = memo(function RoleStat({
    label,
    count,
    icon,
    highlight = false,
}: {
    label: string
    count: number
    icon: string
    highlight?: boolean
}) {
    return (
        <div className={`flex items-center gap-2 p-2 rounded-lg border text-sm ${
            highlight ? 'bg-primary/5 border-primary/20' : ''
        }`}>
            <span className="text-sm">{icon}</span>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{label}</p>
                <p className="font-bold text-sm">{count}</p>
            </div>
        </div>
    )
})

// TaskStatusBadge and PriorityDot imported from @/components/shared/task-badges
