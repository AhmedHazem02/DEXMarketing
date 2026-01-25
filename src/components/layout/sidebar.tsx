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

const adminRoutes = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Content (CMS)', href: '/admin/pages', icon: FileText },
    { name: 'Theme', href: '/admin/theme', icon: Palette },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
]

const accountantRoutes = [
    { name: 'Treasury', href: '/accountant', icon: Wallet },
]

const teamLeaderRoutes = [
    { name: 'Tasks Board', href: '/team-leader', icon: LayoutDashboard },
    { name: 'Create Task', href: '/team-leader/tasks/new', icon: CheckSquare },
]

const creatorRoutes = [
    { name: 'My Tasks', href: '/creator', icon: CheckSquare },
    { name: 'Uploads', href: '/creator/uploads', icon: Upload },
]

export function Sidebar({ role }: { role?: string }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    let routes: { name: string; href: string; icon: any }[] = []

    // Simple role logic (expand later)
    if (role === 'admin') routes = adminRoutes
    else if (role === 'accountant') routes = accountantRoutes
    else if (role === 'team_leader') routes = teamLeaderRoutes
    else if (role === 'creator') routes = creatorRoutes
    else routes = [] // Client or unknown

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
