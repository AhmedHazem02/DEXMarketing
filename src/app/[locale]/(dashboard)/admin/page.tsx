import nextDynamic from 'next/dynamic'
import type { Metadata } from 'next'

const AdminDashboardClient = nextDynamic(
    () => import('@/components/admin/admin-dashboard-client').then(mod => ({ default: mod.AdminDashboardClient })),
    { loading: () => <div className="animate-pulse space-y-4"><div className="h-10 bg-muted rounded" /><div className="h-96 bg-muted rounded" /></div> }
)

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Admin Dashboard | DEX ERP',
    description: 'DEX ERP Admin Dashboard — Manage users, teams, clients, and projects.',
}

export default function AdminDashboard() {
    return <AdminDashboardClient />
}
