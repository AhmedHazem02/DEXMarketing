import nextDynamic from 'next/dynamic'
import { PageHeader } from '@/components/admin/page-header'

const UsersTable = nextDynamic(
    () => import('@/components/admin/users-table').then(mod => ({ default: mod.UsersTable })),
    { loading: () => <div className="animate-pulse space-y-4"><div className="h-10 bg-muted rounded" /><div className="h-96 bg-muted rounded" /></div> }
)

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
