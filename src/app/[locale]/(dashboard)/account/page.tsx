import { Suspense } from 'react'
import { AccountClient } from './account-client'
import { PageHeader } from '@/components/admin'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
    const t = await getTranslations('account')
    
    return (
        <div className="space-y-6">
            <PageHeader
                title={t('title')}
                description={t('description')}
            />

            <Suspense fallback={<div className="animate-pulse space-y-4">
                <div className="h-32 bg-muted rounded-lg" />
                <div className="h-48 bg-muted rounded-lg" />
            </div>}>
                <AccountClient />
            </Suspense>
        </div>
    )
}
