'use client'

import { usePathname } from 'next/navigation'
import type { Department } from '@/types/database'
import { SidebarContent } from './sidebar-content'

export function Sidebar({ role, department }: { role?: string; department?: Department | null }) {
    const pathname = usePathname()
    const isAr = pathname.startsWith('/ar')
    const pathWithoutLocale = pathname.replace(/^\/(en|ar)/, '') || '/'

    return (
        <div className="hidden h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
            <SidebarContent
                role={role}
                department={department}
                isAr={isAr}
                pathWithoutLocale={pathWithoutLocale}
            />
        </div>
    )
}
