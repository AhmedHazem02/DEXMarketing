'use client'

import { useState, useMemo } from 'react'
import { useLocale } from 'next-intl'
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval,
    startOfWeek, endOfWeek, isSameMonth, isSameDay,
    addMonths, subMonths, isToday as isTodayFn,
} from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight,
    Clock, MapPin, Users, ExternalLink, Image as ImageIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useContentSchedules } from '@/hooks/use-schedule'
import { getScheduleStatusConfig, isScheduleOverdue, OVERDUE_CONFIG, SCHEDULE_TYPE_CONFIG } from '@/types/schedule'
import type { ScheduleWithRelations } from '@/types/schedule'

// ============================================
// Status helpers
// ============================================

function getStatusDot(status: string, overdue: boolean): string {
    if (overdue) return 'bg-red-500'
    switch (status) {
        case 'completed': return 'bg-emerald-500'
        case 'in_progress': return 'bg-amber-400'
        case 'cancelled': return 'bg-gray-400'
        default: return 'bg-sky-400'
    }
}

function getApprovalBadge(approval: string | null, isAr: boolean) {
    switch (approval) {
        case 'approved':
            return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]">{isAr ? 'معتمد' : 'Approved'}</Badge>
        case 'rejected':
            return <Badge className="bg-red-500/15 text-red-600 border-red-500/30 text-[10px]">{isAr ? 'مرفوض' : 'Rejected'}</Badge>
        default:
            return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px]">{isAr ? 'قيد المراجعة' : 'Pending'}</Badge>
    }
}

// ============================================
// Content Schedule Read-Only View
// ============================================

export function ContentScheduleReadOnly() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const dateLocale = isAr ? ar : enUS

    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1

    const { data: schedules, isLoading } = useContentSchedules(year, month)

    const calendarDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 6 })
        const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 6 })
        return eachDayOfInterval({ start, end })
    }, [currentDate])

    const schedulesForDate = useMemo(() => {
        if (!selectedDate || !schedules) return []
        return schedules.filter(s =>
            isSameDay(new Date(s.scheduled_date + 'T00:00:00'), selectedDate)
        )
    }, [selectedDate, schedules])

    const dayNames = isAr
        ? ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة']
        : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-[400px] rounded-2xl" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                    {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
                </h3>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl"
                        onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-xl text-xs"
                        onClick={() => setCurrentDate(new Date())}
                    >
                        {isAr ? 'اليوم' : 'Today'}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl"
                        onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <Card className="rounded-2xl border-border/50 overflow-hidden">
                <CardContent className="p-0">
                    {/* Day Names */}
                    <div className="grid grid-cols-7 border-b border-border/50">
                        {dayNames.map(day => (
                            <div key={day} className="py-2 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7">
                        {calendarDays.map((day, i) => {
                            const isCurrentMonth = isSameMonth(day, currentDate)
                            const isToday = isTodayFn(day)
                            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                            const dayStr = format(day, 'yyyy-MM-dd')
                            const daySchedules = (schedules || []).filter(s => s.scheduled_date === dayStr)

                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setSelectedDate(day)}
                                    className={cn(
                                        'relative p-1.5 min-h-[72px] border-b border-e border-border/30 transition-colors text-start',
                                        !isCurrentMonth && 'opacity-30',
                                        isSelected && 'bg-primary/5',
                                        isToday && 'bg-amber-500/5',
                                    )}
                                >
                                    <div className={cn(
                                        'text-xs font-medium mb-1',
                                        isToday && 'text-amber-600 font-bold',
                                        isSelected && 'text-primary font-bold',
                                    )}>
                                        {format(day, 'd')}
                                    </div>
                                    {daySchedules.slice(0, 2).map((s) => {
                                        const overdue = isScheduleOverdue({ scheduled_date: s.scheduled_date, status: s.status })
                                        return (
                                            <div
                                                key={s.id}
                                                className="flex items-center gap-1 text-[10px] leading-tight truncate mb-0.5"
                                            >
                                                <div className={cn('w-1 h-1 rounded-full shrink-0', getStatusDot(s.status, overdue))} />
                                                <span className="truncate">
                                                    {s.schedule_type ? (s.schedule_type === 'reels' ? '📹' : '📝') + ' ' : ''}{s.title}
                                                </span>
                                            </div>
                                        )
                                    })}
                                    {daySchedules.length > 2 && (
                                        <div className="text-[10px] text-muted-foreground/60 font-medium">
                                            +{daySchedules.length - 2} {isAr ? 'أخرى' : 'more'}
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Selected Day Details */}
            {selectedDate && (
                <Card className="rounded-2xl border-border/50">
                    <CardContent className="p-4">
                        <h4 className="font-semibold text-sm mb-3">
                            {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: dateLocale })}
                        </h4>
                        {schedulesForDate.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground text-sm">
                                <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                <p>{isAr ? 'لا يوجد محتوى مجدول' : 'No content scheduled'}</p>
                            </div>
                        ) : (
                            <ScrollArea className="max-h-[400px]">
                                <div className="space-y-3">
                                    {schedulesForDate.map(schedule => {
                                        const overdue = isScheduleOverdue({ scheduled_date: schedule.scheduled_date, status: schedule.status })
                                        const statusCfg = overdue ? OVERDUE_CONFIG : getScheduleStatusConfig(schedule.status)
                                        const typeCfg = SCHEDULE_TYPE_CONFIG.find(t => t.id === schedule.schedule_type)

                                        return (
                                            <div
                                                key={schedule.id}
                                                className="p-3 rounded-xl border border-border/50 bg-card/50 space-y-2"
                                            >
                                                {/* Header */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {typeCfg && (
                                                                <span className="text-sm">{typeCfg.icon}</span>
                                                            )}
                                                            <h5 className="font-semibold text-sm truncate">{schedule.title}</h5>
                                                        </div>
                                                        {schedule.description && (
                                                            <p className="text-xs text-muted-foreground line-clamp-2">{schedule.description}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                'text-[10px] px-1.5 py-0 h-5 rounded-md',
                                                                overdue
                                                                    ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                                                    : statusCfg
                                                                        ? 'bg-primary/10 text-primary border-primary/30'
                                                                        : ''
                                                            )}
                                                        >
                                                            {overdue
                                                                ? (isAr ? 'متأخر' : 'Overdue')
                                                                : (isAr ? statusCfg?.labelAr : statusCfg?.label)}
                                                        </Badge>
                                                        {getApprovalBadge(schedule.approval_status || null, isAr)}
                                                    </div>
                                                </div>

                                                {/* Time & Location */}
                                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                                    {schedule.start_time && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {schedule.start_time.slice(0, 5)}
                                                            {schedule.end_time && ` - ${schedule.end_time.slice(0, 5)}`}
                                                        </span>
                                                    )}
                                                    {schedule.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            <span className="truncate max-w-[150px]">{schedule.location}</span>
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Client */}
                                                {schedule.client && (
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Avatar className="h-5 w-5">
                                                            <AvatarFallback className="text-[8px] bg-primary/10">
                                                                {(schedule.client.name || schedule.client.company)?.charAt(0)?.toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-muted-foreground">
                                                            {schedule.client.name || schedule.client.company}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Links */}
                                                {schedule.links && schedule.links.length > 0 && (
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                                                            {isAr ? 'روابط' : 'Links'}
                                                        </span>
                                                        {schedule.links.map((link, idx) => (
                                                            <a
                                                                key={idx}
                                                                href={link.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                                                            >
                                                                <ExternalLink className="h-3 w-3 shrink-0" />
                                                                <span className="truncate">{link.comment || link.url}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Images preview */}
                                                {schedule.images && schedule.images.length > 0 && (
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <ImageIcon className="h-3 w-3" />
                                                        <span>{schedule.images.length} {isAr ? 'صورة' : 'images'}</span>
                                                    </div>
                                                )}

                                                {/* Notes */}
                                                {schedule.notes && (
                                                    <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-2.5 py-1.5 whitespace-pre-line">
                                                        {schedule.notes}
                                                    </p>
                                                )}

                                                {/* Manager Notes */}
                                                {schedule.manager_notes && (
                                                    <div className="text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5">
                                                        <span className="font-semibold text-amber-600">
                                                            {isAr ? 'ملاحظات المدير: ' : 'Manager notes: '}
                                                        </span>
                                                        <span className="text-amber-700 dark:text-amber-400">{schedule.manager_notes}</span>
                                                    </div>
                                                )}

                                                {/* Assigned Members */}
                                                {schedule.assigned_members && schedule.assigned_members.length > 0 && (
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Users className="h-3 w-3" />
                                                        <span>{schedule.assigned_members.length} {isAr ? 'عضو' : 'members'}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
