'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/use-notifications'
import { useCurrentUser } from '@/hooks/use-users'
import { Badge } from '@/components/ui/badge'

export function NotificationsPopover() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const [open, setOpen] = useState(false)

    const { data: currentUser } = useCurrentUser()
    const userId = currentUser?.id || ''

    const { data: notifications, isLoading } = useNotifications(userId)
    const markRead = useMarkNotificationRead()
    const markAllRead = useMarkAllNotificationsRead()

    const unreadCount = notifications?.filter(n => !n.is_read).length || 0

    const handleMarkAllRead = () => {
        markAllRead.mutate(userId)
    }

    const handleNotificationClick = (id: string, isRead: boolean) => {
        if (!isRead) markRead.mutate(id)
        // Navigate if needed?
    }

    const getIcon = (title: string) => {
        const lowerTitle = title.toLowerCase()
        if (lowerTitle.includes('error') || lowerTitle.includes('failed') || lowerTitle.includes('rejected')) return <XCircle className="h-4 w-4 text-red-500" />
        if (lowerTitle.includes('success') || lowerTitle.includes('approved') || lowerTitle.includes('completed')) return <CheckCircle className="h-4 w-4 text-green-500" />
        if (lowerTitle.includes('warning') || lowerTitle.includes('alert')) return <AlertTriangle className="h-4 w-4 text-yellow-500" />
        return <Info className="h-4 w-4 text-blue-500" />
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 end-1.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-background">
                            {unreadCount}
                        </span>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">{isAr ? 'الإشعارات' : 'Notifications'}</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto p-1"
                            onClick={handleMarkAllRead}
                        >
                            <Check className="h-3 w-3 me-1" />
                            {isAr ? 'تحديد الكل كمقروء' : 'Mark all read'}
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-80">
                    {isLoading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
                    ) : notifications?.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            {isAr ? 'لا توجد إشعارات' : 'No notifications'}
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications?.map((notification) => (
                                <button
                                    key={notification.id}
                                    className={`flex items-start gap-3 p-4 text-start hover:bg-muted/50 transition-colors border-b last:border-0 ${notification.is_read ? '' : 'bg-muted/20'}`}
                                    onClick={() => handleNotificationClick(notification.id, notification.is_read || false)}
                                >
                                    <div className="mt-1">
                                        {getIcon(notification.title)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className={`text-sm ${notification.is_read ? 'text-muted-foreground' : 'font-medium'}`}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: isAr ? ar : enUS })}
                                        </p>
                                    </div>
                                    {!notification.is_read && (
                                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
