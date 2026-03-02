'use client'

import { useLocale } from 'next-intl'
import { TreasuryStats, TransactionForm, TransactionsTable } from '@/components/treasury'
import { PageHeader } from '@/components/admin/page-header'
import { useTreasuryRealtimeSync } from '@/hooks/use-realtime'

export function TreasuryPageClient() {
    const locale = useLocale()
    const isAr = locale === 'ar'

    // Subscribe to real-time transaction changes so balance updates automatically
    useTreasuryRealtimeSync()

    return (
        <div className="space-y-6">
            <PageHeader
                title={isAr ? 'الإدارة المالية' : 'Financial Management'}
                description={isAr ? 'متابعة حركة الخزينة والمصروفات والإيرادات' : 'Track treasury movements, income and expenses'}
                actions={<TransactionForm />}
            />

            {/* Stats Cards */}
            <TreasuryStats />

            {/* Transactions Table */}
            <TransactionsTable />
        </div>
    )
}
