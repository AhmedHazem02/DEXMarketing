'use client'

import { useLocale } from 'next-intl'
import { Menu, Search, User, UserCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NotificationsPopover } from '@/components/shared/notifications-popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

import { MobileSidebar } from '@/components/layout/mobile-sidebar'
import type { Department } from '@/types/database'

export function Header({ user, role, department }: { user?: any, role?: string, department?: Department | null }) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const router = useRouter()

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.refresh()
        router.push('/login')
    }

    const navigateToAccount = () => {
        router.push(`/${locale}/account`)
    }

    const navigateToProfile = () => {
        router.push(`/${locale}/profile`)
    }

    return (
        <header className="flex h-16 items-center border-b bg-background px-6">
            <MobileSidebar role={role} department={department} />

            <div className="flex flex-1 items-center gap-4">
                <div className="relative w-full max-w-sm hidden md:flex">
                    <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder={isAr ? 'بحث...' : 'Search...'}
                        className="w-full bg-background ps-8"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <NotificationsPopover />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.user_metadata?.avatar_url || ''} alt={user?.email || ''} />
                                <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{isAr ? 'حسابي' : 'My Account'}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={navigateToAccount} className="cursor-pointer">
                            <UserCircle className="mr-2 h-4 w-4" />
                            {isAr ? 'حسابي' : 'Account'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={navigateToProfile} className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            {isAr ? 'الملف الشخصي' : 'Profile'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                            {isAr ? 'تسجيل الخروج' : 'Log out'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
