import { UsersTable } from '@/components/admin/users-table'
import { PageHeader } from '@/components/admin/page-header'

export const dynamic = 'force-dynamic'

export default function UsersPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="إدارة المستخدمين"
                description="إدارة جميع مستخدمي النظام وصلاحياتهم"
            />
            <UsersTable />
        </div>
    )
}
