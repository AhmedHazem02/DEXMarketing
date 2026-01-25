'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTreasury, useTransactionSummary, useUsers, useTasks } from '@/hooks'
import { Loader2, Download, TrendingUp, TrendingDown, Users, CheckCircle, Clock, DollarSign } from 'lucide-react'
import { useState } from 'react'

type Period = 'week' | 'month' | 'year'

export function ReportsOverview() {
    const [period, setPeriod] = useState<Period>('month')

    const { data: treasury, isLoading: treasuryLoading } = useTreasury()
    const { data: summary, isLoading: summaryLoading } = useTransactionSummary(period)
    const { data: users } = useUsers()
    const { data: tasks } = useTasks()

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0,
        }).format(amount)
    }

    const periodLabels: Record<Period, string> = {
        week: 'هذا الأسبوع',
        month: 'هذا الشهر',
        year: 'هذا العام',
    }

    // Calculate stats
    const activeUsers = users?.filter(u => u.is_active).length || 0
    const totalUsers = users?.length || 0
    const completedTasks = tasks?.filter(t => t.status === 'approved').length || 0
    const pendingTasks = tasks?.filter(t => !['approved', 'rejected'].includes(t.status)).length || 0
    const totalTasks = tasks?.length || 0

    const handleExport = () => {
        // Create CSV data
        const csvData = [
            ['التقرير المالي - ' + periodLabels[period]],
            [''],
            ['البند', 'القيمة'],
            ['رصيد الخزنة', treasury?.current_balance || 0],
            ['الإيرادات', summary?.totalIncome || 0],
            ['المصروفات', summary?.totalExpense || 0],
            ['صافي الربح', summary?.netBalance || 0],
            [''],
            ['إحصائيات المستخدمين'],
            ['إجمالي المستخدمين', totalUsers],
            ['المستخدمين النشطين', activeUsers],
            [''],
            ['إحصائيات المهام'],
            ['إجمالي المهام', totalTasks],
            ['المهام المكتملة', completedTasks],
            ['المهام قيد التنفيذ', pendingTasks],
        ]

        const csvContent = csvData.map(row => row.join(',')).join('\n')
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `report-${period}-${new Date().toISOString().split('T')[0]}.csv`
        link.click()
    }

    const isLoading = treasuryLoading || summaryLoading

    return (
        <div className="space-y-6">
            {/* Header with Period Selector */}
            <div className="flex items-center justify-between">
                <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="week">هذا الأسبوع</SelectItem>
                        <SelectItem value="month">هذا الشهر</SelectItem>
                        <SelectItem value="year">هذا العام</SelectItem>
                    </SelectContent>
                </Select>

                <Button onClick={handleExport} variant="outline">
                    <Download className="h-4 w-4 me-2" />
                    تصدير Excel
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <>
                    {/* Financial Summary */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">رصيد الخزنة</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(treasury?.current_balance || 0)}</div>
                            </CardContent>
                        </Card>

                        <Card className="border-green-500/30 bg-green-500/5">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">الإيرادات</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-500">
                                    {formatCurrency(summary?.totalIncome || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">{periodLabels[period]}</p>
                            </CardContent>
                        </Card>

                        <Card className="border-red-500/30 bg-red-500/5">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">المصروفات</CardTitle>
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-500">
                                    {formatCurrency(summary?.totalExpense || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">{periodLabels[period]}</p>
                            </CardContent>
                        </Card>

                        <Card className={summary?.netBalance && summary.netBalance >= 0 ? 'border-green-500/30' : 'border-red-500/30'}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
                                {summary?.netBalance && summary.netBalance >= 0 ? (
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${summary?.netBalance && summary.netBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {formatCurrency(summary?.netBalance || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">{periodLabels[period]}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Other Stats */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Users Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    إحصائيات المستخدمين
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">إجمالي المستخدمين</span>
                                        <span className="text-2xl font-bold">{totalUsers}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">المستخدمين النشطين</span>
                                        <span className="text-2xl font-bold text-green-500">{activeUsers}</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all"
                                            style={{ width: `${totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tasks Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5" />
                                    إحصائيات المهام
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">إجمالي المهام</span>
                                        <span className="text-2xl font-bold">{totalTasks}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            مكتملة
                                        </span>
                                        <span className="text-xl font-bold text-green-500">{completedTasks}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-4 w-4 text-yellow-500" />
                                            قيد التنفيذ
                                        </span>
                                        <span className="text-xl font-bold text-yellow-500">{pendingTasks}</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all"
                                            style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    )
}
