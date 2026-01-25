import { ReportsOverview } from '@/components/admin'
import { locales } from '@/i18n/config'

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }))
}

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">التقارير</h1>
                <p className="text-muted-foreground">
                    ملخص شامل للأداء المالي والتشغيلي
                </p>
            </div>

            <ReportsOverview />
        </div>
    )
}
