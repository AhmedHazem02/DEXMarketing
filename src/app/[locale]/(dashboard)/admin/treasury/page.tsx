'use client'

import { useLocale } from 'next-intl'
import { TreasuryStats, TransactionForm, TransactionsTable } from '@/components/treasury'

export default function TreasuryPage() {
    const locale = useLocale()
    const isAr = locale === 'ar'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isAr ? 'الإدارة المالية' : 'Financial Management'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isAr
                            ? 'متابعة حركة الخزينة والمصروفات والإيرادات'
                            : 'Track treasury movements, income and expenses'
                        }
                    </p>
                </div>
                <TransactionForm />
            </div>

            {/* Stats Cards */}
            <TreasuryStats />

            {/* Transactions Table */}
            <TransactionsTable />
        </div>
    )
}
