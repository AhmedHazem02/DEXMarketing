'use client'

import { useLocale } from 'next-intl'
import { MessageSquare } from 'lucide-react'
import { ChatLayout } from '@/components/chat'
import { useCurrentUser } from '@/hooks/use-users'

export default function TeamLeaderChatPage() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const { data: user, isLoading } = useCurrentUser()

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">
                    {isAr ? 'المراسلات' : 'Messages'}
                </h1>
            </div>

            {isLoading || !user ? (
                <div className="h-[calc(100vh-10rem)] rounded-lg border flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
            ) : (
                <ChatLayout userId={user.id} userName={user.name || ''} />
            )}
        </div>
    )
}
