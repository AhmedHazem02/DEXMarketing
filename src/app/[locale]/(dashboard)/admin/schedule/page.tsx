import nextDynamic from 'next/dynamic'

const AdminScheduleView = nextDynamic(
    () => import('@/components/admin/admin-schedule').then(mod => ({ default: mod.AdminScheduleView })),
    { loading: () => <div className="animate-pulse space-y-4"><div className="h-10 bg-muted rounded" /><div className="h-96 bg-muted rounded" /></div> }
)

export const dynamic = 'force-dynamic'

export default function AdminSchedulePage() {
    return <AdminScheduleView />
}
