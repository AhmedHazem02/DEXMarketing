import { PagesManager } from '@/components/admin'
import { locales } from '@/i18n/config'

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }))
}

export default function CmsPagesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">إدارة المحتوى</h1>
                <p className="text-muted-foreground">
                    تعديل محتوى صفحات الموقع العامة
                </p>
            </div>

            <PagesManager />
        </div>
    )
}
