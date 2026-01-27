'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    Settings,
    FileText,
    Wallet,
    CheckSquare,
    Upload,
    Palette,
    LogOut,
    BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// Define base routes
const getRoutes = (role: string, isAr: boolean) => {
    const t = (en: string, ar: string) => isAr ? ar : en

    switch (role) {
        case 'admin':
            return [
                { name: t('Overview', 'نظرة عامة'), href: '/admin', icon: LayoutDashboard },
                { name: t('Users', 'المستخدمين'), href: '/admin/users', icon: Users },
                { name: t('Treasury', 'الخزينة'), href: '/admin/treasury', icon: Wallet },
                { name: t('Tasks', 'المهام'), href: '/admin/tasks', icon: CheckSquare },
                { name: t('Content (CMS)', 'المحتوى'), href: '/admin/pages', icon: FileText },
                { name: t('Theme', 'المظهر'), href: '/admin/theme', icon: Palette },
                { name: t('Reports', 'التقارير'), href: '/admin/reports', icon: BarChart3 },
                { name: t('Settings', 'الإعدادات'), href: '/admin/settings', icon: Settings },
            ]
        case 'client':
            return [
                { name: t('Dashboard', 'الرئيسية'), href: '/client', icon: LayoutDashboard },
                // Projects are accessed via dashboard
            ]
        case 'team_leader':
            return [
                { name: t('Tasks Board', 'لوحة المهام'), href: '/team-leader', icon: LayoutDashboard },
                { name: t('Revisions Hub', 'المراجعات'), href: '/team-leader/revisions', icon: FileText },
            ]
        case 'creator':
            return [
                { name: t('My Tasks', 'مهامي'), href: '/creator', icon: CheckSquare },
            ]
        case 'accountant':
            return [
                { name: t('Treasury', 'الخزينة'), href: '/accountant', icon: Wallet },
            ]
        default:
            return []
    }
}

export function Sidebar({ role }: { role?: string }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    // Naively extract locale from pathname (e.g. /ar/...) or assume 'en'
    const isAr = pathname.startsWith('/ar')
    const routes = getRoutes(role || 'guest', isAr)

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.refresh()
        router.push('/login')
    }

    return (
        <div className="flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
            <div className="flex h-16 items-center border-b px-6">
                <span className="text-lg font-bold text-primary">DEX ERP</span>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-2">
                    {routes.map((route) => {
                        const Icon = route.icon
                        const isActive = pathname.startsWith(route.href)
                        return (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {route.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>
            <div className="border-t p-4">
                <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    )
}
