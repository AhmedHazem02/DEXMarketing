import { AdminStats, RecentTransactions, RecentTasks } from '@/components/admin'
import { locales } from '@/i18n/config'

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }))
}

export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">لوحة التحكم</h1>
                <p className="text-muted-foreground">
                    مرحباً بك في مركز القيادة الرقمي
                </p>
            </div>

            <AdminStats />

            <div className="grid gap-4 md:grid-cols-2">
                <RecentTransactions />
                <RecentTasks />
            </div>
        </div>
    )
}
