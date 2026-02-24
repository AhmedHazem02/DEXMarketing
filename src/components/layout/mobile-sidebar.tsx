'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Department } from '@/types/database'
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { SidebarContent } from './sidebar-content'

export function MobileSidebar({ role, department }: { role?: string; department?: Department | null }) {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    const isAr = pathname.startsWith('/ar')
    const pathWithoutLocale = pathname.replace(/^\/(en|ar)/, '') || '/'

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden me-4">
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side={isAr ? 'right' : 'left'} className="w-64 p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
                <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
                    <SidebarContent
                        role={role}
                        department={department}
                        isAr={isAr}
                        pathWithoutLocale={pathWithoutLocale}
                        onNavigate={() => setOpen(false)}
                    />
                </div>
            </SheetContent>
        </Sheet>
    )
}
