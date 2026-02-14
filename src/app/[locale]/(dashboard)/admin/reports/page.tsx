import { ReportsOverview, PageHeader } from '@/components/admin'

export const dynamic = 'force-dynamic'

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="التقارير"
                description="ملخص شامل للأداء المالي والتشغيلي"
            />
            <ReportsOverview />
        </div>
    )
}
