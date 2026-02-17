'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LogOut,
    Home
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { getRoutes } from '@/lib/routes'
import type { Department } from '@/types/database'

export function Sidebar({ role, department }: { role?: string; department?: Department | null }) {
    const pathname = usePathname()
    const router = useRouter()

    const isAr = pathname.startsWith('/ar')
    const routes = getRoutes(role || 'guest', isAr, department)

    const handleLogout = useCallback(async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase.from('activity_log').insert({ user_id: user.id, action: 'logout' } as never)
        }
        await supabase.auth.signOut()
        router.refresh()
        router.push('/login')
    }, [router])

    return (
        <div className="hidden h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-xl font-black text-primary tracking-tighter">DEX</span>
                    <span className="text-sm font-light text-muted-foreground uppercase tracking-widest">ERP</span>
                </Link>
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
            <div className="border-t p-4 space-y-2">
                <Link href="/" className="block">
                    <Button variant="outline" className="w-full justify-start gap-2 border-dashed hover:border-primary hover:text-primary transition-colors">
                        <Home className="h-4 w-4" />
                        {isAr ? 'موقع الشركة' : 'Website'}
                    </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    {isAr ? 'تسجيل الخروج' : 'Logout'}
                </Button>
            </div>
        </div>
    )
}
