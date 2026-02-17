'use client'

import { useLocale } from 'next-intl'
import { MessageSquare, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function AccountManagerChatPage() {
    const locale = useLocale()
    const isAr = locale === 'ar'

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">
                    {isAr ? 'المراسلات' : 'Messages'}
                </h1>
            </div>

            <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
                        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                            <Lock className="h-10 w-10 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold">
                                {isAr ? 'سيتم تفعيل هذه الميزة قريباً' : 'Coming Soon'}
                            </h2>
                            <p className="text-muted-foreground max-w-md text-lg">
                                {isAr 
                                    ? 'نعمل حالياً على تطوير نظام المراسلات. سيتم إطلاقه قريباً!' 
                                    : 'We are currently developing the messaging system. It will be launched soon!'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
