import { PagesManager, PageHeader } from '@/components/admin'

export const dynamic = 'force-dynamic'

export default function CmsPagesPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="إدارة المحتوى"
                description="تعديل محتوى صفحات الموقع العامة"
            />
            <PagesManager />
        </div>
    )
}
