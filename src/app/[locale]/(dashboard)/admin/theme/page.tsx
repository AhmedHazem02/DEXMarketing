import { ThemeEditor, PageHeader } from '@/components/admin'

export const dynamic = 'force-dynamic'

export default function ThemePage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="إعدادات الثيم"
                description="تخصيص ألوان ومظهر النظام"
            />
            <ThemeEditor />
        </div>
    )
}
