'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTreasury, useTransactionSummary, useUsers } from '@/hooks'
import { DollarSign, Users, TrendingUp, TrendingDown, Loader2, ArrowUp, ArrowDown } from 'lucide-react'
import { getFormatters } from '@/lib/constants/admin'

interface StatCardProps {
    title: string
    value: string | number
    change?: string
    trend?: 'up' | 'down'
    icon: React.ReactNode
    loading?: boolean
}

function StatCard({ title, value, change, trend, icon, loading }: StatCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                    <>
                        <div className="text-2xl font-bold">{value}</div>
                        {change && (
                            <p className={`text-xs flex items-center gap-1 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                {trend === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                {change}
                            </p>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}

export function AdminStats() {
    const t = useTranslations('adminStats')
    const { data: treasury, isLoading: treasuryLoading } = useTreasury()
    const { data: summary, isLoading: summaryLoading } = useTransactionSummary('month')
    const { data: users, isLoading: usersLoading } = useUsers()

    const { formatCurrency } = useMemo(() => getFormatters('ar'), [])

    const activeUsers = users?.filter(u => u.is_active).length || 0

    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title={t('treasuryBalance')}
                value={formatCurrency(treasury?.current_balance || 0)}
                icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                loading={treasuryLoading}
            />
            <StatCard
                title={t('revenueThisMonth')}
                value={formatCurrency(summary?.totalIncome || 0)}
                icon={<TrendingUp className="h-4 w-4 text-green-500" />}
                loading={summaryLoading}
            />
            <StatCard
                title={t('expensesThisMonth')}
                value={formatCurrency(summary?.totalExpense || 0)}
                icon={<TrendingDown className="h-4 w-4 text-red-500" />}
                loading={summaryLoading}
            />
            <StatCard
                title={t('activeUsers')}
                value={`${activeUsers} / ${users?.length || 0}`}
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
                loading={usersLoading}
            />
        </div>
    )
}
