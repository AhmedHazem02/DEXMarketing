'use client'

import { MessageSquare } from 'lucide-react'
import { ComingSoonPage } from '@/components/shared/coming-soon-page'

export default function AccountManagerChatPage() {
    return (
        <ComingSoonPage
            icon={MessageSquare}
            titleAr="المراسلات"
            titleEn="Messages"
            descriptionAr="نعمل حالياً على تطوير نظام المراسلات. سيتم إطلاقه قريباً!"
            descriptionEn="We are currently developing the messaging system. It will be launched soon!"
        />
    )
}
