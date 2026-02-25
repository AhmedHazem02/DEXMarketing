'use client'

import { useState, useMemo } from 'react'
import { useLocale } from 'next-intl'
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday as isTodayFn,
} from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    Building2,
    Users,
    Briefcase,
    Filter,
    X,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { useMySchedules, useClientSchedules, useCalendarSchedules } from '@/hooks/use-schedule'
import { useUsers, getRoleLabel } from '@/hooks/use-users'
import { getScheduleStatusConfig, isScheduleOverdue, OVERDUE_CONFIG } from '@/types/schedule'
import type { ScheduleWithRelations } from '@/types/schedule'
import type { User } from '@/types/database'

interface ReadOnlyScheduleViewProps {
    userId?: string
    clientId?: string
    teamLeaderId?: string
    title?: string
}

export function ReadOnlyScheduleView({ userId, clientId, teamLeaderId, title }: ReadOnlyScheduleViewProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const dateLocale = isAr ? ar : enUS

    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [clientFilter, setClientFilter] = useState<string>('all')

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1

    // Fetch schedules based on type
    const { data: mySchedules, isLoading: myLoading } = useMySchedules(
        userId || '',
        year,
        month
    )
    const { data: clientSchedules, isLoading: clientLoading } = useClientSchedules(
        clientId || '',
        year,
        month
    )
    const { data: teamSchedules, isLoading: teamLoading } = useCalendarSchedules(
        teamLeaderId || '',
        year,
        month
    )

    const rawSchedules = teamLeaderId ? teamSchedules : userId ? mySchedules : clientSchedules
    const isLoading = teamLeaderId ? teamLoading : userId ? myLoading : clientLoading

    // Extract unique clients for filter dropdown
    const uniqueClients = useMemo(() => {
        const map = new Map<string, { id: string; label: string }>()
        rawSchedules?.forEach((s) => {
            if (s.client) {
                const label = s.client.name
                if (label) map.set(s.client.id, { id: s.client.id, label })
            }
        })
        return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label))
    }, [rawSchedules])

    // Apply client filter
    const schedules = useMemo(() => {
        if (clientFilter === 'all') return rawSchedules
        return rawSchedules?.filter(s => s.client?.id === clientFilter) ?? []
    }, [rawSchedules, clientFilter])

    // Fetch all users for member name resolution
    const { data: allUsers } = useUsers()
    const memberMap = useMemo(() => {
        const map = new Map<string, Pick<User, 'id' | 'name' | 'avatar_url' | 'role'>>()
        allUsers?.forEach(u => map.set(u.id, u))
        return map
    }, [allUsers])

    // Calendar grid
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        const calStart = startOfWeek(monthStart, { weekStartsOn: 6 })
        const calEnd = endOfWeek(monthEnd, { weekStartsOn: 6 })
        return eachDayOfInterval({ start: calStart, end: calEnd })
    }, [currentDate])

    const schedulesByDate = useMemo(() => {
        const map = new Map<string, ScheduleWithRelations[]>()
        schedules?.forEach((s) => {
            const key = s.scheduled_date
            const arr = map.get(key) || []
            arr.push(s)
            map.set(key, arr)
        })
        return map
    }, [schedules])

    const selectedSchedules = selectedDate
        ? schedulesByDate.get(format(selectedDate, 'yyyy-MM-dd')) || []
        : []

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const handleToday = () => setCurrentDate(new Date())

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <CalendarIcon className="h-6 w-6 text-primary" />
                    <h2 className="text-xl sm:text-2xl font-bold">
                        {title || (isAr ? 'الجدول الزمني' : 'Schedule')}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleToday}>
                        {isAr ? 'اليوم' : 'Today'}
                    </Button>
                    <div className="text-sm font-medium min-w-[140px] text-center">
                        {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
                    </div>
                    <Button variant="outline" size="sm" onClick={handleNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Client Filter */}
            {uniqueClients.length > 0 && (
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Select value={clientFilter} onValueChange={setClientFilter}>
                        <SelectTrigger className="w-[200px] sm:w-[250px] h-9 text-sm">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground me-1.5" />
                            <SelectValue placeholder={isAr ? 'كل العملاء' : 'All Clients'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                {isAr ? 'كل العملاء' : 'All Clients'}
                            </SelectItem>
                            {uniqueClients.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {clientFilter !== 'all' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setClientFilter('all')}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            )}

            {/* Calendar Grid */}
            <Card>
                <CardContent className="p-4">
                    {isLoading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 gap-1 sm:gap-2">
                            {/* Week days header */}
                            {[6, 0, 1, 2, 3, 4, 5].map((day) => {
                                const dayDate = new Date(2024, 0, day + 1)
                                return (
                                    <div
                                        key={day}
                                        className="text-center text-xs sm:text-sm font-medium text-muted-foreground p-1 sm:p-2"
                                    >
                                        {format(dayDate, 'EEE', { locale: dateLocale })}
                                    </div>
                                )
                            })}

                            {/* Calendar cells */}
                            {calendarDays.map((day, i) => {
                                const dateKey = format(day, 'yyyy-MM-dd')
                                const daySchedules = schedulesByDate.get(dateKey) || []
                                const isCurrentMonth = isSameMonth(day, currentDate)
                                const isToday = isTodayFn(day)
                                const isSelected = selectedDate && isSameDay(day, selectedDate)
                                const hasOverdue = daySchedules.some(s => isScheduleOverdue(s))

                                return (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            if (daySchedules.length > 0) {
                                                setSelectedDate(day)
                                            }
                                        }}
                                        className={cn(
                                            'min-h-[60px] sm:min-h-[80px] p-1 sm:p-2 border rounded-md text-start transition-all',
                                            'hover:bg-muted/50',
                                            isCurrentMonth ? 'bg-background' : 'bg-muted/20',
                                            isToday && 'ring-2 ring-primary',
                                            isSelected && 'bg-primary/10',
                                            hasOverdue && !isSelected && 'border-red-300 dark:border-red-800',
                                            daySchedules.length > 0 && 'cursor-pointer'
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'text-xs sm:text-sm font-medium mb-1',
                                                !isCurrentMonth && 'text-muted-foreground',
                                                isToday && 'text-primary font-bold'
                                            )}
                                        >
                                            {format(day, 'd')}
                                        </div>
                                        <div className="space-y-0.5">
                                            {daySchedules.slice(0, 2).map((schedule) => {
                                                const overdue = isScheduleOverdue(schedule)
                                                const deptEmoji = schedule.department === 'photography' ? '📸' : schedule.department === 'content' ? '✍️' : ''
                                                return (
                                                    <div
                                                        key={schedule.id}
                                                        className={cn(
                                                            'text-[10px] sm:text-xs p-0.5 sm:p-1 rounded truncate font-medium',
                                                            overdue
                                                                ? 'bg-red-500/15 text-red-700 dark:text-red-400'
                                                                : schedule.status === 'completed'
                                                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                                                    : getScheduleStatusConfig(schedule.status).bgColor
                                                        )}
                                                    >
                                                        {deptEmoji} {schedule.start_time?.slice(0, 5)} {schedule.schedule_type ? (schedule.schedule_type === 'reels' ? '📹' : '📝') + ' ' : ''}{schedule.title}
                                                    </div>
                                                )
                                            })}
                                            {daySchedules.length > 2 && (
                                                <div className="text-[10px] text-muted-foreground">
                                                    +{daySchedules.length - 2} {isAr ? 'أخرى' : 'more'}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Selected Day Details */}
            {selectedDate && selectedSchedules.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base sm:text-lg">
                            {format(selectedDate, 'PPP', { locale: dateLocale })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px] sm:h-[400px]">
                            <div className="space-y-3">
                                {selectedSchedules.map((schedule) => {
                                    const overdue = isScheduleOverdue(schedule)
                                    const statusCfg = overdue ? OVERDUE_CONFIG : getScheduleStatusConfig(schedule.status)
                                    const members = (schedule.assigned_members || [])
                                        .map(id => memberMap.get(id))
                                        .filter(Boolean) as Pick<User, 'id' | 'name' | 'avatar_url' | 'role'>[]

                                    return (
                                        <div
                                            key={schedule.id}
                                            className={cn(
                                                'flex items-start gap-3 p-3 border rounded-lg',
                                                overdue && 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20',
                                                schedule.status === 'completed' && 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/10'
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    'w-1 h-full min-h-[40px] rounded-full shrink-0',
                                                    overdue
                                                        ? 'bg-red-500'
                                                        : schedule.status === 'completed'
                                                            ? 'bg-emerald-500'
                                                            : schedule.status === 'in_progress'
                                                                ? 'bg-amber-500'
                                                                : 'bg-blue-500'
                                                )}
                                            />
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-sm mb-1.5">{schedule.title}</h4>
                                                        {schedule.department && (
                                                            <Badge variant="secondary" className="text-xs gap-1.5">
                                                                <Briefcase className="h-3 w-3" />
                                                                {isAr
                                                                    ? schedule.department === 'photography'
                                                                        ? 'التصوير'
                                                                        : schedule.department === 'content'
                                                                            ? 'المحتوى'
                                                                            : schedule.department
                                                                    : schedule.department === 'photography'
                                                                        ? 'Photography'
                                                                        : schedule.department === 'content'
                                                                            ? 'Content'
                                                                            : schedule.department}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            'shrink-0 text-xs',
                                                            overdue && 'border-red-300 text-red-600 bg-red-50 dark:bg-red-950/30',
                                                            schedule.status === 'completed' && 'border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
                                                        )}
                                                    >
                                                        {overdue
                                                            ? (isAr ? 'متأخر' : 'Overdue')
                                                            : (isAr ? statusCfg.labelAr : statusCfg.label)}
                                                    </Badge>
                                                </div>

                                                {schedule.schedule_type && (
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <span>{schedule.schedule_type === 'reels' ? '📹' : '📝'}</span>
                                                        <span>{schedule.schedule_type === 'reels' ? (isAr ? 'ريلز' : 'Reels') : (isAr ? 'بوست' : 'Post')}</span>
                                                    </div>
                                                )}

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
                                                            {schedule.location}
                                                        </span>
                                                    )}
                                                    {schedule.client && (
                                                        <span className="flex items-center gap-1">
                                                            <Building2 className="h-3 w-3" />
                                                            {schedule.client.name}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Assigned Members */}
                                                {members.length > 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-3 w-3 text-muted-foreground" />
                                                        <div className="flex -space-x-1.5 rtl:space-x-reverse">
                                                            {members.slice(0, 5).map(m => (
                                                                <Avatar key={m.id} className="h-5 w-5 border-2 border-background">
                                                                    <AvatarImage src={m.avatar_url || ''} />
                                                                    <AvatarFallback className="text-[9px] bg-primary/10">
                                                                        {m.name?.charAt(0) || '?'}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            ))}
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">
                                                            {members.map(m => m.name?.split(' ')[0]).join(', ')}
                                                        </span>
                                                    </div>
                                                )}

                                                {schedule.description && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {schedule.description}
                                                    </p>
                                                )}

                                                {schedule.notes && (
                                                    <p className="text-xs text-muted-foreground italic">
                                                        {schedule.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}

            {!isLoading && schedules?.length === 0 && (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center">
                            <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
                            <p className="text-muted-foreground">
                                {isAr
                                    ? 'لا توجد مواعيد مجدولة هذا الشهر'
                                    : 'No scheduled appointments this month'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
