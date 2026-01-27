'use client'

import { useLocale } from 'next-intl'
import { ArrowDown, ArrowUp, Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useTreasury, useTransactionSummary } from '@/hooks/use-treasury'
import { Skeleton } from '@/components/ui/skeleton'

export function TreasuryStats() {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const { data: treasury, isLoading: treasuryLoading } = useTreasury()
    const { data: summary, isLoading: summaryLoading } = useTransactionSummary('month')

    const isLoading = treasuryLoading || summaryLoading

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
            </div>
        )
    }

    const currentBalance = treasury?.current_balance ?? 0
    const income = summary?.totalIncome ?? 0
    const expense = summary?.totalExpense ?? 0
    const net = summary?.netBalance ?? 0

    return (
        <div className="grid gap-4 md:grid-cols-3">
            {/* Current Balance */}
            <Card className="bg-primary text-primary-foreground border-primary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {isAr ? 'الرصيد الحالي' : 'Current Balance'}
                    </CardTitle>
                    <Wallet className="h-4 w-4 text-primary-foreground/70" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">
                        ${currentBalance.toLocaleString()}
                    </div>
                    <p className="text-xs text-primary-foreground/70 mt-1">
                        {isAr ? 'صافي السيولة المتاحة' : 'Net available liquidity'}
                    </p>
                </CardContent>
            </Card>

            {/* Monthly Income */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {isAr ? 'إيرادات الشهر' : 'Monthly Income'}
                    </CardTitle>
                    <div className="h-4 w-4 rounded-full bg-green-500/20 flex items-center justify-center">
                        <ArrowUp className="h-3 w-3 text-green-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                        +${income.toLocaleString()}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <TrendingUp className="h-3 w-3 me-1 text-green-500" />
                        {isAr ? 'مداخيل الفترة الحالية' : 'Current period income'}
                    </div>
                </CardContent>
            </Card>

            {/* Monthly Expense */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {isAr ? 'مصروفات الشهر' : 'Monthly Expenses'}
                    </CardTitle>
                    <div className="h-4 w-4 rounded-full bg-red-500/20 flex items-center justify-center">
                        <ArrowDown className="h-3 w-3 text-red-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                        -${expense.toLocaleString()}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <TrendingDown className="h-3 w-3 me-1 text-red-500" />
                        {isAr ? 'مصاريف الفترة الحالية' : 'Current period expenses'}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
