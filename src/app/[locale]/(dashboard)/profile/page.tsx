import { Suspense } from 'react'
import { ProfileClient } from './profile-client'
import { PageHeader } from '@/components/admin'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
    const t = await getTranslations('profile')
    
    return (
        <div className="space-y-6">
            <PageHeader
                title={t('title')}
                description={t('description')}
            />

            <Suspense fallback={<div className="animate-pulse h-96 bg-muted rounded-lg" />}>
                <ProfileClient />
            </Suspense>
        </div>
    )
}
