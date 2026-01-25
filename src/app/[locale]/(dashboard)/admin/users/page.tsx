import { UsersTable } from '@/components/admin/users-table'
import { locales } from '@/i18n/config'

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }))
}

export default function UsersPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">إدارة المستخدمين</h1>
                <p className="text-muted-foreground">
                    إدارة جميع مستخدمي النظام وصلاحياتهم
                </p>
            </div>

            <UsersTable />
        </div>
    )
}
