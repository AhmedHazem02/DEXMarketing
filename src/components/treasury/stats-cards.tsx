'use client'

import { useLocale } from 'next-intl'
import { ArrowDown, ArrowUp, Wallet, TrendingUp, TrendingDown, Banknote, Smartphone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTreasury, useTransactionSummary, usePaymentMethodSummary } from '@/hooks/use-treasury'
import { Skeleton } from '@/components/ui/skeleton'

export function TreasuryStats() {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const { isLoading: treasuryLoading } = useTreasury()
    const { data: summary, isLoading: summaryLoading } = useTransactionSummary('month')
    const { data: allTimeSummary, isLoading: allTimeLoading } = useTransactionSummary(undefined)
    const { data: paymentSummary, isLoading: paymentLoading } = usePaymentMethodSummary()

    const isLoading = treasuryLoading || summaryLoading || allTimeLoading || paymentLoading

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-28 rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    // Compute current balance from all approved transactions (more reliable than stored value)
    const currentBalance = (allTimeSummary?.totalIncome ?? 0) - (allTimeSummary?.totalExpense ?? 0)
    const income = summary?.totalIncome ?? 0
    const expense = summary?.totalExpense ?? 0
    const cashNet = (paymentSummary?.cashIncome ?? 0) - (paymentSummary?.cashExpense ?? 0)
    const walletNet = (paymentSummary?.walletIncome ?? 0) - (paymentSummary?.walletExpense ?? 0)

    return (
        <div className="space-y-4">
            {/* Row 1: Balance + Monthly Stats */}
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
                            {isAr ? 'صافي الإيرادات المعتمدة' : 'Net approved transactions'}
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

            {/* Row 2: Payment Method Net Balance (all time approved) */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Cash Net */}
                <Card className={cashNet >= 0 ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {isAr ? 'رصيد النقد' : 'Cash Balance'}
                        </CardTitle>
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                            cashNet >= 0
                                ? 'bg-green-500/15 border border-green-500/25'
                                : 'bg-red-500/15 border border-red-500/25'
                        }`}>
                            <Banknote className={`h-4 w-4 ${cashNet >= 0 ? 'text-green-600' : 'text-red-500'}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${cashNet >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {cashNet >= 0 ? '+' : ''}{cashNet.toLocaleString()} ج.م
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {isAr
                                ? `دخل ${(paymentSummary?.cashIncome ?? 0).toLocaleString()} — مصروف ${(paymentSummary?.cashExpense ?? 0).toLocaleString()} ج.م`
                                : `Income ${(paymentSummary?.cashIncome ?? 0).toLocaleString()} — Expense ${(paymentSummary?.cashExpense ?? 0).toLocaleString()} EGP`
                            }
                        </p>
                    </CardContent>
                </Card>

                {/* Wallet Net */}
                <Card className={walletNet >= 0 ? 'border-blue-500/20 bg-blue-500/5' : 'border-red-500/20 bg-red-500/5'}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {isAr ? 'رصيد المحفظة الإلكترونية' : 'Mobile Wallet Balance'}
                        </CardTitle>
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                            walletNet >= 0
                                ? 'bg-blue-500/15 border border-blue-500/25'
                                : 'bg-red-500/15 border border-red-500/25'
                        }`}>
                            <Smartphone className={`h-4 w-4 ${walletNet >= 0 ? 'text-blue-500' : 'text-red-500'}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${walletNet >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                            {walletNet >= 0 ? '+' : ''}{walletNet.toLocaleString()} ج.م
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {isAr
                                ? `دخل ${(paymentSummary?.walletIncome ?? 0).toLocaleString()} — مصروف ${(paymentSummary?.walletExpense ?? 0).toLocaleString()} ج.م`
                                : `Income ${(paymentSummary?.walletIncome ?? 0).toLocaleString()} — Expense ${(paymentSummary?.walletExpense ?? 0).toLocaleString()} EGP`
                            }
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
