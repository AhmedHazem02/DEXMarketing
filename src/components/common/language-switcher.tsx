'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Languages } from 'lucide-react'
import { useTransition } from 'react'

export function LanguageSwitcher() {
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()
    const [isPending, startTransition] = useTransition()

    const toggleLanguage = () => {
        const nextLocale = locale === 'ar' ? 'en' : 'ar'
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale })
        })
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            disabled={isPending}
            className={`flex items-center gap-2 font-medium hover:bg-primary/10 hover:text-primary transition-colors ${isPending ? 'opacity-50' : ''
                }`}
        >
            <Languages className="h-4 w-4" />
            <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
        </Button>
    )
}
