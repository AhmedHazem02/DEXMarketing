'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const toggleLanguage = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar'
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <button
      onClick={toggleLanguage}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300"
      aria-label={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      <Globe className="h-4 w-4" />
      <span className="font-mono uppercase">{locale === 'ar' ? 'EN' : 'AR'}</span>
    </button>
  )
}
