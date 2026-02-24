'use client'

import { useLocale } from 'next-intl'
import { ArrowDown, ArrowUp, Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

    return (
        <div className="grid gap-4 md:grid-cols-3">
            {/* Current Balance — amber glass highlight card */}
            <Card className="relative overflow-hidden border-primary/40 bg-primary/10 text-white shadow-[0_0_40px_rgba(251,191,36,0.12)] ring-1 ring-primary/20">
                {/* Ambient glow */}
                <div className="pointer-events-none absolute -end-6 -top-6 h-24 w-24 rounded-full bg-primary/20 blur-2xl" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white/80">
                        {isAr ? 'الرصيد الحالي' : 'Current Balance'}
                    </CardTitle>
                    <div className="h-8 w-8 rounded-xl border border-primary/30 bg-primary/15 flex items-center justify-center shadow-[0_0_12px_rgba(251,191,36,0.25)]">
                        <Wallet className="h-4 w-4 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-white">
                        {currentBalance.toLocaleString()} ج.م
                    </div>
                    <p className="text-xs text-white/55 mt-1">
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
                    <div className="h-9 w-9 rounded-xl bg-green-500/15 border border-green-500/25 flex items-center justify-center shadow-[0_0_12px_rgba(34,197,94,0.2)]">
                        <ArrowUp className="h-4 w-4 text-green-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-500">
                        +{income.toLocaleString()} ج.م
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
                    <div className="h-9 w-9 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.2)]">
                        <ArrowDown className="h-4 w-4 text-red-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-500">
                        -{expense.toLocaleString()} ج.م
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
