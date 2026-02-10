import { AdminDashboardClient } from '@/components/admin/admin-dashboard-client'
import { locales } from '@/i18n/config'

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }))
}

export default function AdminDashboard() {
    return <AdminDashboardClient />
}
