'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTransactions } from '@/hooks'
import { ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'
import { getFormatters } from '@/lib/constants/admin'

export function RecentTransactions() {
    const t = useTranslations('recentTransactions')
    const { data: transactions, isLoading } = useTransactions({ limit: 5 })
    const { formatCurrency, formatDate } = useMemo(() => getFormatters('ar'), [])

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t('title')}</CardTitle>
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
                <CardTitle>{t('title')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {transactions?.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">{t('noTransactions')}</p>
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
                                    <div className="min-w-0 flex-1 px-3">
                                        <p className="font-medium text-sm truncate">
                                            {transaction.description || (transaction.type === 'income' ? t('income') : t('expense'))}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {transaction.category || t('general')} • {formatDate(transaction.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <span className={`font-bold whitespace-nowrap ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
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
