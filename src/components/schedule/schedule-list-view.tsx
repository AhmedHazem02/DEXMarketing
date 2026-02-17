'use client'

import { useMemo } from 'react'
import { format, isToday as isTodayFn } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

import type { ScheduleWithRelations, ScheduleStatus } from '@/types/schedule'
import type { User } from '@/types/database'
import { ScheduleCard } from './schedule-card'

export interface ScheduleListViewProps {
    schedules: ScheduleWithRelations[]
    isAr: boolean
    memberMap: Map<string, Pick<User, 'id' | 'name' | 'avatar_url' | 'role'>>
    onEdit: (s: ScheduleWithRelations) => void
    onDelete: (id: string) => void
    onStatusChange: (id: string, status: ScheduleStatus) => void
    isAccountManager?: boolean
    onApproval?: (id: string, status: 'approved' | 'rejected') => void
}

export function ScheduleListView({ schedules, isAr, memberMap, onEdit, onDelete, onStatusChange, isAccountManager, onApproval }: ScheduleListViewProps) {
    const dateLocale = isAr ? ar : enUS

    const grouped = useMemo(() => {
        const map = new Map<string, ScheduleWithRelations[]>()
        const sorted = [...schedules].sort((a, b) => {
            const dateCompare = a.scheduled_date.localeCompare(b.scheduled_date)
            if (dateCompare !== 0) return dateCompare
            return (a.start_time || '').localeCompare(b.start_time || '')
        })
        sorted.forEach(s => {
            const arr = map.get(s.scheduled_date) || []
            arr.push(s)
            map.set(s.scheduled_date, arr)
        })
        return map
    }, [schedules])

    if (schedules.length === 0) {
        return (
            <Card className="border-border/50">
                <CardContent className="py-16">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
                            <CalendarIcon className="h-8 w-8 text-muted-foreground/20" />
                        </div>
                        <p className="text-muted-foreground font-medium">
                            {isAr ? 'لا توجد مواعيد هذا الشهر' : 'No schedules this month'}
                        </p>
                        <p className="text-xs text-muted-foreground/50 mt-1">
                            {isAr ? 'أضف جدولة جديدة للبدء' : 'Add a new schedule to get started'}
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-border/50">
            <ScrollArea className="h-[600px]">
                <div className="divide-y divide-border/30">
                    {Array.from(grouped.entries()).map(([dateStr, items]) => {
                        const date = new Date(dateStr)
                        const isToday = isTodayFn(date)

                        return (
                            <div key={dateStr} className="p-4">
                                {/* Date header */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-xs font-bold shrink-0 ${isToday ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-muted/50'}`}>
                                        <span className="leading-none text-[10px] font-medium opacity-70">
                                            {format(date, 'EEE', { locale: dateLocale })}
                                        </span>
                                        <span className="leading-none text-sm">
                                            {format(date, 'd')}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold">
                                            {format(date, 'EEEE', { locale: dateLocale })}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {format(date, 'd MMMM yyyy', { locale: dateLocale })}
                                            {isToday && (
                                                <Badge variant="outline" className="ms-2 text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary">
                                                    {isAr ? 'اليوم' : 'Today'}
                                                </Badge>
                                            )}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="ms-auto text-xs">
                                        {items.length}
                                    </Badge>
                                </div>

                                {/* Cards */}
                                <div className="space-y-2 ms-[52px]">
                                    {items.map(s => (
                                        <ScheduleCard
                                            key={s.id}
                                            schedule={s}
                                            isAr={isAr}
                                            memberMap={memberMap}
                                            onEdit={() => onEdit(s)}
                                            onDelete={() => onDelete(s.id)}
                                            onStatusChange={(status) => onStatusChange(s.id, status)}
                                            isAccountManager={isAccountManager}
                                            onApproval={onApproval}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
        </Card>
    )
}
