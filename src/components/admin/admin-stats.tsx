'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTreasury, useTransactionSummary, useUsers, useTasks } from '@/hooks'
import { DollarSign, Users, CheckCircle, TrendingUp, TrendingDown, Loader2, ArrowUp, ArrowDown } from 'lucide-react'

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
    const { data: treasury, isLoading: treasuryLoading } = useTreasury()
    const { data: summary, isLoading: summaryLoading } = useTransactionSummary('month')
    const { data: users, isLoading: usersLoading } = useUsers()
    const { data: tasks, isLoading: tasksLoading } = useTasks()

    const activeUsers = users?.filter(u => u.is_active).length || 0
    const activeTasks = tasks?.filter(t => !['approved', 'rejected'].includes(t.status)).length || 0

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="رصيد الخزنة"
                value={formatCurrency(treasury?.current_balance || 0)}
                icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                loading={treasuryLoading}
            />
            <StatCard
                title="الإيرادات (هذا الشهر)"
                value={formatCurrency(summary?.totalIncome || 0)}
                change="+20.1%"
                trend="up"
                icon={<TrendingUp className="h-4 w-4 text-green-500" />}
                loading={summaryLoading}
            />
            <StatCard
                title="المصروفات (هذا الشهر)"
                value={formatCurrency(summary?.totalExpense || 0)}
                change="-4.5%"
                trend="down"
                icon={<TrendingDown className="h-4 w-4 text-red-500" />}
                loading={summaryLoading}
            />
            <StatCard
                title="المستخدمين النشطين"
                value={activeUsers}
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
                loading={usersLoading}
            />
        </div>
    )
}
