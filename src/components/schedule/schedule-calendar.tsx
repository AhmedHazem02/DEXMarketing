'use client'

import { useState, useMemo, useCallback } from 'react'
import { useLocale } from 'next-intl'
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval,
    startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths,
    subMonths, isToday as isTodayFn
} from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight,
    Plus, Clock, MapPin, Building2, Loader2,
    LayoutGrid, List, Trash2, Edit2, CheckCircle2,
    Users, AlertTriangle, X, Search, Filter,
    CalendarDays, TrendingUp, Timer
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from '@/components/ui/tooltip'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

import {
    useCalendarSchedules, useCreateSchedule,
    useUpdateSchedule, useDeleteSchedule, useUpdateScheduleStatus
} from '@/hooks/use-schedule'
import { useClients } from '@/hooks/use-clients'
import { useCurrentUser, useTeamMembers, getRoleLabel } from '@/hooks/use-users'
import {
    SCHEDULE_STATUS_CONFIG, getScheduleStatusConfig,
    isScheduleOverdue, OVERDUE_CONFIG
} from '@/types/schedule'
import type { ScheduleWithRelations, CreateScheduleInput, ScheduleStatus } from '@/types/schedule'
import type { Department, User } from '@/types/database'

// ============================================
// Status color helpers
// ============================================

function getStatusDot(status: ScheduleStatus, overdue: boolean): string {
    if (overdue) return 'bg-red-500'
    switch (status) {
        case 'completed': return 'bg-emerald-500'
        case 'in_progress': return 'bg-amber-400'
        case 'cancelled': return 'bg-gray-400'
        default: return 'bg-sky-400'
    }
}

function getStatusBadgeClasses(status: ScheduleStatus, overdue: boolean): string {
    if (overdue) return 'bg-red-500/15 text-red-400 border-red-500/30'
    switch (status) {
        case 'completed': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
        case 'in_progress': return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
        case 'cancelled': return 'bg-gray-500/15 text-gray-400 border-gray-500/30'
        default: return 'bg-sky-500/15 text-sky-400 border-sky-500/30'
    }
}

function getCardBorderClass(status: ScheduleStatus, overdue: boolean): string {
    if (overdue) return 'border-red-500/40 hover:border-red-500/60'
    switch (status) {
        case 'completed': return 'border-emerald-500/30 hover:border-emerald-500/50'
        case 'in_progress': return 'border-amber-500/30 hover:border-amber-500/50'
        default: return 'border-border hover:border-primary/30'
    }
}

// ============================================
// Schedule Calendar View
// ============================================

interface ScheduleCalendarProps {
    teamLeaderId: string
}

export function ScheduleCalendar({ teamLeaderId }: ScheduleCalendarProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const dateLocale = isAr ? ar : enUS

    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [view, setView] = useState<'calendar' | 'list'>('calendar')
    const [formOpen, setFormOpen] = useState(false)
    const [editingSchedule, setEditingSchedule] = useState<ScheduleWithRelations | null>(null)
    const [statusFilter, setStatusFilter] = useState<ScheduleStatus | 'all'>('all')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null)

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1

    const { data: schedules, isLoading } = useCalendarSchedules(teamLeaderId, year, month)
    const { data: teamMembers } = useTeamMembers(teamLeaderId)
    const createSchedule = useCreateSchedule()
    const updateSchedule = useUpdateSchedule()
    const deleteSchedule = useDeleteSchedule()
    const updateStatus = useUpdateScheduleStatus()

    // Build a lookup map for team members
    const memberMap = useMemo(() => {
        const map = new Map<string, Pick<User, 'id' | 'name' | 'avatar_url' | 'role'>>()
        teamMembers?.forEach(m => map.set(m.id, m as Pick<User, 'id' | 'name' | 'avatar_url' | 'role'>))
        return map
    }, [teamMembers])

    // Enrich schedules with member details
    const enrichedSchedules = useMemo(() => {
        return (schedules || []).map(s => ({
            ...s,
            assigned_member_details: (s.assigned_members || [])
                .map(id => memberMap.get(id))
                .filter(Boolean) as Pick<User, 'id' | 'name' | 'avatar_url' | 'role'>[],
        }))
    }, [schedules, memberMap])

    // Filter schedules
    const filteredSchedules = useMemo(() => {
        if (statusFilter === 'all') return enrichedSchedules
        if (statusFilter === 'scheduled') {
            // show non-overdue scheduled
            return enrichedSchedules.filter(s => s.status === 'scheduled' && !isScheduleOverdue(s))
        }
        return enrichedSchedules.filter(s => s.status === statusFilter)
    }, [enrichedSchedules, statusFilter])

    // Calendar grid days
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        const calStart = startOfWeek(monthStart, { weekStartsOn: 6 })
        const calEnd = endOfWeek(monthEnd, { weekStartsOn: 6 })
        return eachDayOfInterval({ start: calStart, end: calEnd })
    }, [currentDate])

    // Group schedules by date
    const schedulesByDate = useMemo(() => {
        const map = new Map<string, ScheduleWithRelations[]>()
        filteredSchedules.forEach(s => {
            const key = s.scheduled_date
            const arr = map.get(key) || []
            arr.push(s)
            map.set(key, arr)
        })
        return map
    }, [filteredSchedules])

    const selectedSchedules = selectedDate
        ? schedulesByDate.get(format(selectedDate, 'yyyy-MM-dd')) || []
        : []

    // Monthly stats
    const monthStats = useMemo(() => {
        const all = enrichedSchedules
        const overdueCount = all.filter(s => isScheduleOverdue(s)).length
        return {
            total: all.length,
            completed: all.filter(s => s.status === 'completed').length,
            overdue: overdueCount,
            upcoming: all.filter(s => s.status === 'scheduled' && !isScheduleOverdue(s)).length,
            inProgress: all.filter(s => s.status === 'in_progress').length,
        }
    }, [enrichedSchedules])

    const handleCreate = async (input: CreateScheduleInput & { team_leader_id: string; assigned_members?: string[] }) => {
        try {
            await createSchedule.mutateAsync(input)
            setFormOpen(false)
            toast.success(isAr ? '✅ تم إنشاء الجدولة بنجاح' : '✅ Schedule created successfully')
        } catch (error) {
            toast.error(isAr ? '❌ فشل إنشاء الجدولة' : '❌ Failed to create schedule')
            console.error('Create schedule error:', error)
        }
    }

    const handleUpdate = async (input: Partial<CreateScheduleInput> & { team_leader_id?: string; assigned_members?: string[] }) => {
        if (!editingSchedule) return
        try {
            await updateSchedule.mutateAsync({ id: editingSchedule.id, ...input })
            setEditingSchedule(null)
            setFormOpen(false)
            toast.success(isAr ? '✅ تم تحديث الجدولة بنجاح' : '✅ Schedule updated successfully')
        } catch (error) {
            toast.error(isAr ? '❌ فشل تحديث الجدولة' : '❌ Failed to update schedule')
            console.error('Update schedule error:', error)
        }
    }

    const openDeleteDialog = (id: string) => {
        setScheduleToDelete(id)
        setDeleteDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!scheduleToDelete) return
        try {
            await deleteSchedule.mutateAsync(scheduleToDelete)
            setDeleteDialogOpen(false)
            setScheduleToDelete(null)
            toast.success(isAr ? '✅ تم حذف الجدولة بنجاح' : '✅ Schedule deleted successfully')
        } catch (error) {
            toast.error(isAr ? '❌ فشل حذف الجدولة' : '❌ Failed to delete schedule')
            console.error('Delete schedule error:', error)
        }
    }

    const handleStatusChange = async (id: string, status: ScheduleStatus) => {
        try {
            await updateStatus.mutateAsync({ id, status })
            toast.success(isAr ? '✅ تم تحديث الحالة' : '✅ Status updated')
        } catch (error) {
            toast.error(isAr ? '❌ فشل تحديث الحالة' : '❌ Failed to update status')
            console.error('Update status error:', error)
        }
    }

    const openEditForm = useCallback((s: ScheduleWithRelations) => {
        setEditingSchedule(s)
        setFormOpen(true)
    }, [])

    const weekDays = useMemo(() => {
        const days = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
        const daysAr = ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة']
        return isAr ? daysAr : days
    }, [isAr])

    return (
        <TooltipProvider>
            <div className="space-y-6">
            {/* ===== Top Bar ===== */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Month Navigation */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-card border border-border rounded-xl overflow-hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-none hover:bg-primary/10"
                            onClick={() => setCurrentDate(d => subMonths(d, 1))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="px-4 min-w-[160px] text-center">
                            <h2 className="text-base font-bold tracking-wide">
                                {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
                            </h2>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-none hover:bg-primary/10"
                            onClick={() => setCurrentDate(d => addMonths(d, 1))}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()) }}
                    >
                        <CalendarDays className="h-3.5 w-3.5 me-1.5" />
                        {isAr ? 'اليوم' : 'Today'}
                    </Button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex bg-card border border-border rounded-xl overflow-hidden">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                'rounded-none px-3 h-9',
                                view === 'calendar' && 'bg-primary text-primary-foreground hover:bg-primary/90'
                            )}
                            onClick={() => setView('calendar')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                'rounded-none px-3 h-9',
                                view === 'list' && 'bg-primary text-primary-foreground hover:bg-primary/90'
                            )}
                            onClick={() => setView('list')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* New Schedule */}
                    <Dialog open={formOpen} onOpenChange={setFormOpen}>
                        <DialogTrigger asChild>
                            <Button
                                size="sm"
                                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                                onClick={() => setEditingSchedule(null)}
                            >
                                <Plus className="h-4 w-4 me-1.5" />
                                {isAr ? 'جدولة جديدة' : 'New Schedule'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg border-primary/20">
                            <DialogHeader>
                                <DialogTitle className="text-lg">
                                    {editingSchedule
                                        ? (isAr ? '✏️ تعديل الجدول' : '✏️ Edit Schedule')
                                        : (isAr ? '📅 جدولة جديدة' : '📅 New Schedule')}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingSchedule
                                        ? (isAr ? 'تعديل تفاصيل الجدولة' : 'Edit schedule details')
                                        : (isAr ? 'إضافة جدولة جديدة للفريق' : 'Add a new schedule for your team')}
                                </DialogDescription>
                            </DialogHeader>
                            <ScheduleForm
                                teamLeaderId={teamLeaderId}
                                initialDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined}
                                schedule={editingSchedule}
                                isLoading={createSchedule.isPending || updateSchedule.isPending}
                                onSubmit={editingSchedule ? handleUpdate : handleCreate}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* ===== Stats Cards ===== */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <StatsCard
                    icon={<CalendarIcon className="h-5 w-5" />}
                    label={isAr ? 'إجمالي' : 'Total'}
                    value={monthStats.total}
                    color="primary"
                    active={statusFilter === 'all'}
                    onClick={() => setStatusFilter('all')}
                />
                <StatsCard
                    icon={<Timer className="h-5 w-5" />}
                    label={isAr ? 'مجدول' : 'Scheduled'}
                    value={monthStats.upcoming}
                    color="sky"
                    active={statusFilter === 'scheduled'}
                    onClick={() => setStatusFilter('scheduled')}
                />
                <StatsCard
                    icon={<TrendingUp className="h-5 w-5" />}
                    label={isAr ? 'جاري' : 'In Progress'}
                    value={monthStats.inProgress}
                    color="amber"
                    active={statusFilter === 'in_progress'}
                    onClick={() => setStatusFilter('in_progress')}
                />
                <StatsCard
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    label={isAr ? 'مكتمل' : 'Done'}
                    value={monthStats.completed}
                    color="emerald"
                    active={statusFilter === 'completed'}
                    onClick={() => setStatusFilter('completed')}
                />
                <StatsCard
                    icon={<AlertTriangle className="h-5 w-5" />}
                    label={isAr ? 'متأخر' : 'Overdue'}
                    value={monthStats.overdue}
                    color="red"
                    active={false}
                    onClick={() => setStatusFilter('all')}
                    pulse={monthStats.overdue > 0}
                />
            </div>

            {/* ===== Main Content ===== */}
            {isLoading ? (
                <Card className="border-border/50">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-7 gap-2">
                            {[...Array(35)].map((_, i) => (
                                <Skeleton key={i} className="h-24 rounded-xl" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : view === 'calendar' ? (
                <div className="space-y-4">
                    {/* Calendar */}
                    <Card className="border-border/50 overflow-hidden">
                        <CardContent className="p-3 sm:p-4">
                            {/* Week day headers */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {weekDays.map(day => (
                                    <div
                                        key={day}
                                        className="text-center text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider py-2"
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar grid */}
                            <div className="grid grid-cols-7 gap-1">
                                {calendarDays.map(day => {
                                    const dateKey = format(day, 'yyyy-MM-dd')
                                    const daySchedules = schedulesByDate.get(dateKey) || []
                                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                                    const isCurrentMonth = isSameMonth(day, currentDate)
                                    const isToday = isTodayFn(day)
                                    const hasOverdue = daySchedules.some(s => isScheduleOverdue(s))
                                    const hasCompleted = daySchedules.some(s => s.status === 'completed')

                                    return (
                                        <button
                                            key={dateKey}
                                            onClick={() => setSelectedDate(day)}
                                            className={cn(
                                                'relative min-h-[90px] p-2 rounded-xl border transition-all duration-200 text-start group',
                                                isCurrentMonth
                                                    ? 'bg-card/50 hover:bg-card'
                                                    : 'bg-background/30 opacity-40',
                                                isSelected
                                                    ? 'ring-2 ring-primary border-primary/50 bg-primary/5'
                                                    : 'border-border/30',
                                                isToday && !isSelected && 'border-primary/40',
                                                hasOverdue && !isSelected && 'border-red-500/30',
                                            )}
                                        >
                                            {/* Day number */}
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={cn(
                                                    'text-xs font-bold w-7 h-7 flex items-center justify-center rounded-lg transition-colors',
                                                    isToday
                                                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                                                        : isSelected
                                                            ? 'text-primary'
                                                            : 'text-muted-foreground group-hover:text-foreground'
                                                )}>
                                                    {format(day, 'd')}
                                                </span>
                                                {daySchedules.length > 0 && (
                                                    <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md">
                                                        {daySchedules.length}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Schedule pills */}
                                            <div className="space-y-1">
                                                {daySchedules.slice(0, 2).map(s => {
                                                    const overdue = isScheduleOverdue(s)
                                                    return (
                                                        <div
                                                            key={s.id}
                                                            className={cn(
                                                                'flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium',
                                                                overdue
                                                                    ? 'bg-red-500/15 text-red-400'
                                                                    : s.status === 'completed'
                                                                        ? 'bg-emerald-500/10 text-emerald-400'
                                                                        : s.status === 'in_progress'
                                                                            ? 'bg-amber-500/10 text-amber-400'
                                                                            : 'bg-sky-500/10 text-sky-300'
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                'w-1 h-1 rounded-full shrink-0',
                                                                getStatusDot(s.status, overdue)
                                                            )} />
                                                            <span className="truncate">
                                                                {s.start_time?.slice(0, 5)} {s.company_name || s.title}
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                                {daySchedules.length > 2 && (
                                                    <div className="text-[10px] text-muted-foreground/60 font-medium px-1.5">
                                                        +{daySchedules.length - 2} {isAr ? 'أخرى' : 'more'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bottom accent for days with events */}
                                            {daySchedules.length > 0 && (
                                                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                                                    {hasOverdue && <div className="w-1 h-1 rounded-full bg-red-500" />}
                                                    {hasCompleted && <div className="w-1 h-1 rounded-full bg-emerald-500" />}
                                                    {daySchedules.some(s => s.status === 'in_progress') && <div className="w-1 h-1 rounded-full bg-amber-400" />}
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Selected Day Panel */}
                    {selectedDate && (
                        <Card className="border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <CalendarIcon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">
                                                {format(selectedDate, 'EEEE', { locale: dateLocale })}
                                            </CardTitle>
                                            <p className="text-xs text-muted-foreground">
                                                {format(selectedDate, 'd MMMM yyyy', { locale: dateLocale })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="border-primary/30 text-primary">
                                            {selectedSchedules.length} {isAr ? 'مواعيد' : 'events'}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground"
                                            onClick={() => setSelectedDate(null)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {selectedSchedules.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                                            <CalendarIcon className="h-6 w-6 text-muted-foreground/30" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {isAr ? 'لا توجد مواعيد في هذا اليوم' : 'No events scheduled for this day'}
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-3 rounded-xl"
                                            onClick={() => { setEditingSchedule(null); setFormOpen(true) }}
                                        >
                                            <Plus className="h-3.5 w-3.5 me-1.5" />
                                            {isAr ? 'إضافة جدولة' : 'Add Schedule'}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedSchedules.map(s => (
                                            <ScheduleCard
                                                key={s.id}
                                                schedule={s}
                                                isAr={isAr}
                                                memberMap={memberMap}
                                                onEdit={() => openEditForm(s)}
                                                onDelete={() => openDeleteDialog(s.id)}
                                                onStatusChange={(status) => handleStatusChange(s.id, status)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            ) : (
                <ScheduleListView
                    schedules={filteredSchedules}
                    isAr={isAr}
                    memberMap={memberMap}
                    onEdit={openEditForm}
                    onDelete={openDeleteDialog}
                    onStatusChange={handleStatusChange}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {isAr ? '⚠️ تأكيد الحذف' : '⚠️ Confirm Deletion'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {isAr 
                                ? 'هل أنت متأكد من حذف هذه الجدولة؟ لا يمكن التراجع عن هذا الإجراء.'
                                : 'Are you sure you want to delete this schedule? This action cannot be undone.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            {isAr ? 'إلغاء' : 'Cancel'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteSchedule.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                isAr ? 'حذف' : 'Delete'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        </TooltipProvider>
    )
}

// ============================================
// Stats Card
// ============================================

interface StatsCardProps {
    icon: React.ReactNode
    label: string
    value: number
    color: 'primary' | 'sky' | 'amber' | 'emerald' | 'red'
    active: boolean
    onClick: () => void
    pulse?: boolean
}

const colorMap = {
    primary: {
        bg: 'bg-primary/10',
        icon: 'text-primary',
        value: 'text-primary',
        ring: 'ring-primary/30',
        border: 'border-primary/20',
    },
    sky: {
        bg: 'bg-sky-500/10',
        icon: 'text-sky-400',
        value: 'text-sky-400',
        ring: 'ring-sky-500/30',
        border: 'border-sky-500/20',
    },
    amber: {
        bg: 'bg-amber-500/10',
        icon: 'text-amber-400',
        value: 'text-amber-400',
        ring: 'ring-amber-500/30',
        border: 'border-amber-500/20',
    },
    emerald: {
        bg: 'bg-emerald-500/10',
        icon: 'text-emerald-400',
        value: 'text-emerald-400',
        ring: 'ring-emerald-500/30',
        border: 'border-emerald-500/20',
    },
    red: {
        bg: 'bg-red-500/10',
        icon: 'text-red-400',
        value: 'text-red-400',
        ring: 'ring-red-500/30',
        border: 'border-red-500/20',
    },
}

function StatsCard({ icon, label, value, color, active, onClick, pulse }: StatsCardProps) {
    const colors = colorMap[color]

    return (
        <button
            onClick={onClick}
            className={cn(
                'relative flex items-center gap-3 p-3 sm:p-4 rounded-2xl border transition-all duration-200',
                'bg-card/50 hover:bg-card hover:shadow-lg',
                colors.border,
                active && `ring-2 ${colors.ring} ${colors.bg}`,
            )}
        >
            <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                colors.bg
            )}>
                <span className={colors.icon}>
                    {icon}
                </span>
            </div>
            <div className="text-start">
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <p className={cn('text-xl font-bold', colors.value)}>{value}</p>
            </div>
            {pulse && value > 0 && (
                <span className="absolute top-2 end-2 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
            )}
        </button>
    )
}

// ============================================
// Schedule Card
// ============================================

interface ScheduleCardProps {
    schedule: ScheduleWithRelations
    isAr: boolean
    memberMap: Map<string, Pick<User, 'id' | 'name' | 'avatar_url' | 'role'>>
    onEdit: () => void
    onDelete: (id: string) => void
    onStatusChange: (status: ScheduleStatus) => void
}

function ScheduleCard({ schedule, isAr, memberMap, onEdit, onDelete, onStatusChange }: ScheduleCardProps) {
    const overdue = isScheduleOverdue(schedule)
    const statusCfg = overdue ? OVERDUE_CONFIG : getScheduleStatusConfig(schedule.status)

    const members = useMemo(() => 
        (schedule.assigned_members || [])
            .map(id => memberMap.get(id))
            .filter(Boolean) as Pick<User, 'id' | 'name' | 'avatar_url' | 'role'>[],
        [schedule.assigned_members, memberMap]
    )

    return (
        <div className={cn(
            'group relative rounded-xl border p-4 transition-all duration-200',
            getCardBorderClass(schedule.status, overdue),
            overdue && 'bg-red-500/5',
            schedule.status === 'completed' && 'bg-emerald-500/5',
        )}>
            {/* Status accent line */}
            <div className={cn(
                'absolute top-0 start-0 w-1 h-full rounded-s-xl',
                getStatusDot(schedule.status, overdue)
            )} />

            <div className="ps-3">
                {/* Top row: title + actions */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm truncate">{schedule.title}</h4>
                            <Badge
                                variant="outline"
                                className={cn('shrink-0 text-[10px] px-2 py-0 h-5 rounded-md border', getStatusBadgeClasses(schedule.status, overdue))}
                            >
                                {overdue
                                    ? (isAr ? 'متأخر' : 'Overdue')
                                    : (isAr ? statusCfg?.labelAr : statusCfg?.label)}
                            </Badge>
                        </div>

                        {schedule.company_name && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                                <Building2 className="h-3 w-3 shrink-0" />
                                <span className="truncate">{schedule.company_name}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {(schedule.status === 'scheduled' || schedule.status === 'in_progress') && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-lg hover:bg-emerald-500/10"
                                        onClick={() => onStatusChange(
                                            schedule.status === 'scheduled' ? 'in_progress' : 'completed'
                                        )}
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{isAr ? 'تقدم الحالة' : 'Advance status'}</TooltipContent>
                            </Tooltip>
                        )}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-lg hover:bg-muted"
                                    onClick={onEdit}
                                >
                                    <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{isAr ? 'تعديل' : 'Edit'}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-lg hover:bg-destructive/10 text-destructive"
                                    onClick={() => onDelete(schedule.id)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{isAr ? 'حذف' : 'Delete'}</TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Info chips */}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                    {schedule.start_time && (
                        <div className="flex items-center gap-1 text-xs bg-muted/30 text-muted-foreground px-2 py-1 rounded-lg">
                            <Clock className="h-3 w-3" />
                            {schedule.start_time.slice(0, 5)}
                            {schedule.end_time && (
                                <span className="text-muted-foreground/60">
                                    → {schedule.end_time.slice(0, 5)}
                                </span>
                            )}
                        </div>
                    )}
                    {schedule.location && (
                        <div className="flex items-center gap-1 text-xs bg-muted/30 text-muted-foreground px-2 py-1 rounded-lg">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">{schedule.location}</span>
                        </div>
                    )}
                    {schedule.client && (
                        <div className="flex items-center gap-1 text-xs bg-primary/5 text-primary px-2 py-1 rounded-lg">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">{schedule.client.company || schedule.client.name}</span>
                        </div>
                    )}
                </div>

                {/* Assigned Members */}
                {members.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                        <Users className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                        <div className="flex -space-x-1.5">
                            {members.slice(0, 6).map(member => (
                                <Tooltip key={member.id}>
                                    <TooltipTrigger asChild>
                                            <Avatar className="h-7 w-7 border-2 border-card ring-0">
                                                <AvatarImage src={member.avatar_url || ''} />
                                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                                                    {member.name?.charAt(0) || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="text-xs">
                                            <p className="font-semibold">{member.name}</p>
                                            <p className="text-muted-foreground">
                                                {getRoleLabel(member.role, isAr)}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                        </div>
                        {members.length > 6 && (
                            <span className="text-[10px] text-muted-foreground">
                                +{members.length - 6}
                            </span>
                        )}
                        <span className="text-xs text-muted-foreground/60 ms-1">
                            {members.map(m => m.name?.split(' ')[0]).join(' · ')}
                        </span>
                    </div>
                )}

                {/* Notes */}
                {schedule.notes && (
                    <p className="text-xs text-muted-foreground/60 mt-2 line-clamp-1 italic">
                        {schedule.notes}
                    </p>
                )}
            </div>
        </div>
    )
}

// ============================================
// Schedule List View
// ============================================

interface ScheduleListViewProps {
    schedules: ScheduleWithRelations[]
    isAr: boolean
    memberMap: Map<string, Pick<User, 'id' | 'name' | 'avatar_url' | 'role'>>
    onEdit: (s: ScheduleWithRelations) => void
    onDelete: (id: string) => void
    onStatusChange: (id: string, status: ScheduleStatus) => void
}

function ScheduleListView({ schedules, isAr, memberMap, onEdit, onDelete, onStatusChange }: ScheduleListViewProps) {
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
                                    <div className={cn(
                                        'w-10 h-10 rounded-xl flex flex-col items-center justify-center text-xs font-bold shrink-0',
                                        isToday
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                                            : 'bg-muted/50'
                                    )}>
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

// ============================================
// Schedule Form
// ============================================

interface ScheduleFormProps {
    teamLeaderId: string
    initialDate?: string
    schedule?: ScheduleWithRelations | null
    isLoading: boolean
    onSubmit: (data: any) => void
}

function ScheduleForm({ teamLeaderId, initialDate, schedule, isLoading, onSubmit }: ScheduleFormProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const { data: currentUser } = useCurrentUser()
    const { data: clients } = useClients()
    const { data: teamMembers } = useTeamMembers(teamLeaderId)

    const [title, setTitle] = useState(schedule?.title || '')
    const [date, setDate] = useState(schedule?.scheduled_date || initialDate || '')
    const [time, setTime] = useState(schedule?.start_time?.slice(0, 5) || '')
    const [endTime, setEndTime] = useState(schedule?.end_time?.slice(0, 5) || '')
    const [location, setLocation] = useState(schedule?.location || '')
    const [companyName, setCompanyName] = useState(schedule?.company_name || '')
    const [description, setDescription] = useState(schedule?.description || '')
    const [notes, setNotes] = useState(schedule?.notes || '')
    const [status, setStatus] = useState<ScheduleStatus>(schedule?.status || 'scheduled')
    const [clientId, setClientId] = useState(schedule?.client_id || '')
    const [department, setDepartment] = useState<Department>(schedule?.department || (currentUser?.department || 'photography'))
    const [assignedMembers, setAssignedMembers] = useState<string[]>(schedule?.assigned_members || [])

    const toggleMember = (memberId: string) => {
        setAssignedMembers(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        )
    }

    const selectAllMembers = () => {
        if (teamMembers) {
            setAssignedMembers(teamMembers.map(m => m.id))
        }
    }

    const clearAllMembers = () => {
        setAssignedMembers([])
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit({
            title,
            scheduled_date: date,
            start_time: time || null,
            end_time: endTime || null,
            location: location || null,
            company_name: companyName || null,
            description: description || null,
            notes: notes || null,
            status,
            client_id: clientId || null,
            department,
            assigned_members: assignedMembers,
            team_leader_id: teamLeaderId,
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            {/* Title */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? 'العنوان' : 'Title'} *
                </Label>
                <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    className="rounded-xl"
                    placeholder={isAr ? 'مثال: تصوير منتجات' : 'e.g. Product Photoshoot'}
                />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {isAr ? 'التاريخ' : 'Date'} *
                    </Label>
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {isAr ? 'من' : 'From'}
                    </Label>
                    <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {isAr ? 'إلى' : 'To'}
                    </Label>
                    <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="rounded-xl" />
                </div>
            </div>

            {/* Client & Company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {isAr ? 'العميل' : 'Client'}
                    </Label>
                    <Select value={clientId} onValueChange={setClientId}>
                        <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder={isAr ? 'اختر العميل' : 'Select client'} />
                        </SelectTrigger>
                        <SelectContent>
                            {clients?.map(client => (
                                <SelectItem key={client.id} value={client.id}>
                                    {client.company || client.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {isAr ? 'اسم الشركة' : 'Company'}
                    </Label>
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} className="rounded-xl" />
                </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? 'الموقع' : 'Location'}
                </Label>
                <Input
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="rounded-xl"
                    placeholder={isAr ? 'عنوان أو رابط الموقع' : 'Address or location link'}
                />
            </div>

            {/* Team Members */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" />
                        {isAr ? 'أعضاء الفريق' : 'Team Members'}
                        {assignedMembers.length > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-md">
                                {assignedMembers.length}
                            </Badge>
                        )}
                    </Label>
                    {teamMembers && teamMembers.length > 0 && (
                        <div className="flex gap-1.5">
                            <button
                                type="button"
                                onClick={selectAllMembers}
                                className="text-[10px] text-primary hover:underline font-medium"
                            >
                                {isAr ? 'تحديد الكل' : 'Select all'}
                            </button>
                            {assignedMembers.length > 0 && (
                                <>
                                    <span className="text-muted-foreground/30">|</span>
                                    <button
                                        type="button"
                                        onClick={clearAllMembers}
                                        className="text-[10px] text-muted-foreground hover:underline font-medium"
                                    >
                                        {isAr ? 'إلغاء الكل' : 'Clear'}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
                {teamMembers && teamMembers.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                        {teamMembers.map(member => {
                            const isSelected = assignedMembers.includes(member.id)
                            return (
                                <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => toggleMember(member.id)}
                                    className={cn(
                                        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm transition-all duration-200',
                                        isSelected
                                            ? 'bg-primary/10 border-primary/40 shadow-sm'
                                            : 'bg-card/50 hover:bg-muted/50 border-border/50'
                                    )}
                                >
                                    <div className="relative">
                                        <Avatar className="h-7 w-7">
                                            <AvatarImage src={member.avatar_url || ''} />
                                            <AvatarFallback className={cn(
                                                'text-[10px] font-bold',
                                                isSelected ? 'bg-primary/20 text-primary' : 'bg-muted'
                                            )}>
                                                {member.name?.charAt(0) || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        {isSelected && (
                                            <div className="absolute -top-0.5 -end-0.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
                                                <CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-start min-w-0">
                                        <div className={cn(
                                            'font-medium text-xs truncate',
                                            isSelected ? 'text-primary' : 'text-foreground'
                                        )}>
                                            {member.name}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground truncate">
                                            {getRoleLabel(member.role, isAr)}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-4 rounded-xl border border-dashed border-border/50">
                        <Users className="h-5 w-5 text-muted-foreground/30 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">
                            {isAr ? 'لا يوجد أعضاء فريق متاحين' : 'No team members available'}
                        </p>
                    </div>
                )}
            </div>

            {/* Department */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? 'القسم' : 'Department'}
                </Label>
                <Select value={department} onValueChange={(v) => setDepartment(v as Department)}>
                    <SelectTrigger className="rounded-xl">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="photography">{isAr ? 'التصوير' : 'Photography'}</SelectItem>
                        <SelectItem value="content">{isAr ? 'المحتوى' : 'Content'}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? 'الوصف' : 'Description'}
                </Label>
                <Textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={2}
                    className="rounded-xl resize-none"
                    placeholder={isAr ? 'وصف تفصيلي...' : 'Detailed description...'}
                />
            </div>

            {/* Status (editing only) */}
            {schedule && (
                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {isAr ? 'الحالة' : 'Status'}
                    </Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as ScheduleStatus)}>
                        <SelectTrigger className="rounded-xl">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SCHEDULE_STATUS_CONFIG.map(cfg => (
                                <SelectItem key={cfg.id} value={cfg.id}>
                                    {isAr ? cfg.labelAr : cfg.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? 'ملاحظات' : 'Notes'}
                </Label>
                <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    className="rounded-xl resize-none"
                    placeholder={isAr ? 'ملاحظات إضافية...' : 'Additional notes...'}
                />
            </div>

            {/* Submit */}
            <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl h-11 text-sm font-semibold shadow-lg shadow-primary/20"
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : schedule ? (
                    <>
                        <Edit2 className="h-4 w-4 me-2" />
                        {isAr ? 'تحديث الجدولة' : 'Update Schedule'}
                    </>
                ) : (
                    <>
                        <Plus className="h-4 w-4 me-2" />
                        {isAr ? 'إنشاء الجدولة' : 'Create Schedule'}
                    </>
                )}
            </Button>
        </form>
    )
}
