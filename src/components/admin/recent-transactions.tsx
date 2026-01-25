'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTransactions } from '@/hooks'
import { ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'

export function RecentTransactions() {
    const { data: transactions, isLoading } = useTransactions({ limit: 5 })

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0,
        }).format(amount)
    }

    const formatDate = (date: string) => {
        return new Intl.DateTimeFormat('ar-EG', {
            day: 'numeric',
            month: 'short',
        }).format(new Date(date))
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>آخر المعاملات</CardTitle>
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
                <CardTitle>آخر المعاملات</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {transactions?.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">لا توجد معاملات بعد</p>
                    ) : (
                        transactions?.map((transaction) => (
                            <div key={transaction.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${transaction.type === 'income'
                                            ? 'bg-green-500/20 text-green-500'
                                            : 'bg-red-500/20 text-red-500'
                                        }`}>
                                        {transaction.type === 'income' ? (
                                            <ArrowUpRight className="h-4 w-4" />
                                        ) : (
                                            <ArrowDownRight className="h-4 w-4" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">
                                            {transaction.description || (transaction.type === 'income' ? 'إيراد' : 'مصروف')}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {transaction.category || 'عام'} • {formatDate(transaction.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <span className={`font-bold ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                                    }`}>
                                    {transaction.type === 'income' ? '+' : '-'}
                                    {formatCurrency(transaction.amount)}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
