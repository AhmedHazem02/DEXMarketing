import { ThemeEditor } from '@/components/admin'
import { locales } from '@/i18n/config'

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }))
}

export default function ThemePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">إعدادات الثيم</h1>
                <p className="text-muted-foreground">
                    تخصيص ألوان ومظهر النظام
                </p>
            </div>

            <ThemeEditor />
        </div>
    )
}
