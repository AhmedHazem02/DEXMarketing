import { Suspense } from 'react'
import { SettingsClient } from './settings-client'
import { PageHeader } from '@/components/admin'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const t = await getTranslations('settings')
    
    return (
        <div className="space-y-6">
            <PageHeader
                title={t('title')}
                description={t('description')}
            />

            <Suspense fallback={<div className="animate-pulse h-96 bg-muted rounded-lg" />}>
                <SettingsClient />
            </Suspense>
        </div>
    )
}
