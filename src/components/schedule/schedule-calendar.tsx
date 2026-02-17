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
    CalendarDays, TrendingUp, Timer, Bug, ClipboardList
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
    useUpdateSchedule, useDeleteSchedule, useUpdateScheduleStatus,
    useUpdateScheduleApproval
} from '@/hooks/use-schedule'
import { useClients } from '@/hooks/use-clients'
import { useMyTasks } from '@/hooks/use-tasks'
import { useCurrentUser, useTeamMembers, getRoleLabel } from '@/hooks/use-users'
import {
    SCHEDULE_STATUS_CONFIG, getScheduleStatusConfig,
    isScheduleOverdue, OVERDUE_CONFIG, SCHEDULE_TYPE_CONFIG,
    MISSING_ITEMS_STATUS_CONFIG, APPROVAL_STATUS_CONFIG
} from '@/types/schedule'
import type { ScheduleWithRelations, CreateScheduleInput, ScheduleStatus } from '@/types/schedule'
import type { Department, User, ScheduleType, ScheduleLink, MissingItemsStatus } from '@/types/database'
import { EmojiTextarea } from '@/components/ui/emoji-textarea'
import { LinksInput } from '@/components/ui/links-input'
import { ImageUploader } from '@/components/ui/image-uploader'

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
    canCreate?: boolean  // Hide create button for read-only mode (e.g., Account Manager)
    userRole?: string   // To customize form fields based on role
    simplifiedForm?: boolean // Hide endTime & team members (for content creators)
}

export function ScheduleCalendar({ teamLeaderId, canCreate = true, userRole, simplifiedForm = false }: ScheduleCalendarProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const dateLocale = isAr ? ar : enUS

    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [view, setView] = useState<'calendar' | 'list'>('calendar')
    const [formOpen, setFormOpen] = useState(false)
    const [missingFormOpen, setMissingFormOpen] = useState(false)
    const [editingSchedule, setEditingSchedule] = useState<ScheduleWithRelations | null>(null)
    const [statusFilter, setStatusFilter] = useState<ScheduleStatus | 'all'>('all')
    const [clientFilter, setClientFilter] = useState<string>('all')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null)

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1

    const { data: currentUser } = useCurrentUser()
    const { data: schedules, isLoading } = useCalendarSchedules(teamLeaderId, year, month)
    const { data: teamMembers } = useTeamMembers(teamLeaderId)
    const { data: clients } = useClients()
    const createSchedule = useCreateSchedule()
    const updateSchedule = useUpdateSchedule()
    const deleteSchedule = useDeleteSchedule()
    const updateStatus = useUpdateScheduleStatus()
    const approveSchedule = useUpdateScheduleApproval()

    const isAccountManager = currentUser?.role === 'account_manager'

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
        let filtered = enrichedSchedules
        
        // Apply status filter
        if (statusFilter !== 'all') {
            if (statusFilter === 'scheduled') {
                // show non-overdue scheduled
                filtered = filtered.filter(s => s.status === 'scheduled' && !isScheduleOverdue(s))
            } else {
                filtered = filtered.filter(s => s.status === statusFilter)
            }
        }
        
        // Apply client filter
        if (clientFilter !== 'all') {
            filtered = filtered.filter(s => s.client_id === clientFilter)
        }
        
        return filtered
    }, [enrichedSchedules, statusFilter, clientFilter])

    // Calendar grid days
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        const calStart = startOfWeek(monthStart, { weekStartsOn: 6 })
        const calEnd = endOfWeek(monthEnd, { weekStartsOn: 6 })
        return eachDayOfInterval({ start: calStart, end: calEnd })
    }, [currentDate])

    // Group schedules by date (for calendar display - uses filter)
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

    // Group ALL schedules by date (for selected day panel - no filter)
    const allSchedulesByDate = useMemo(() => {
        const map = new Map<string, ScheduleWithRelations[]>()
        enrichedSchedules.forEach(s => {
            const key = s.scheduled_date
            const arr = map.get(key) || []
            arr.push(s)
            map.set(key, arr)
        })
        return map
    }, [enrichedSchedules])

    // Selected day schedules (show ALL schedules for selected day, ignore filter)
    const selectedSchedules = selectedDate
        ? allSchedulesByDate.get(format(selectedDate, 'yyyy-MM-dd')) || []
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
            missingItems: all.filter(s => s.missing_items && s.missing_items.trim() && s.missing_items_status !== 'resolved').length,
        }
    }, [enrichedSchedules])

    const handleCreate = async (input: CreateScheduleInput & { team_leader_id: string; assigned_members?: string[] }) => {
        console.log('🔵 [handleCreate] Current user:', { id: currentUser?.id, role: currentUser?.role, department: currentUser?.department })
        console.log('🔵 [handleCreate] Input payload:', JSON.stringify(input, null, 2))
        try {
            const result = await createSchedule.mutateAsync(input)
            console.log('✅ [handleCreate] Success:', result)
            setFormOpen(false)
            toast.success(isAr ? '✅ تم إنشاء الجدولة بنجاح' : '✅ Schedule created successfully')
        } catch (error: any) {
            console.error('❌ [handleCreate] Error:', { code: error?.code, message: error?.message, details: error?.details, hint: error?.hint })
            toast.error(isAr ? '❌ فشل إنشاء الجدولة' : '❌ Failed to create schedule')
        }
    }

    const handleCreateMissingItems = async (input: CreateScheduleInput & { team_leader_id: string; assigned_members?: string[] }) => {
        console.log('🟡 [handleCreateMissingItems] Current user:', { id: currentUser?.id, role: currentUser?.role, department: currentUser?.department })
        console.log('🟡 [handleCreateMissingItems] Input payload:', JSON.stringify(input, null, 2))
        try {
            const result = await createSchedule.mutateAsync(input)
            console.log('✅ [handleCreateMissingItems] Success:', result)
            setMissingFormOpen(false)
            toast.success(isAr ? '✅ تم إرسال النواقص بنجاح' : '✅ Missing items reported successfully')
        } catch (error: any) {
            console.error('❌ [handleCreateMissingItems] Error:', { code: error?.code, message: error?.message, details: error?.details, hint: error?.hint })
            toast.error(isAr ? '❌ فشل إرسال النواقص' : '❌ Failed to report missing items')
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

    const handleApproval = async (id: string, approval_status: 'approved' | 'rejected', manager_notes?: string) => {
        try {
            await approveSchedule.mutateAsync({ id, approval_status, manager_notes })
            toast.success(isAr
                ? (approval_status === 'approved' ? '✅ تمت الموافقة على الجدولة' : '❌ تم رفض الجدولة')
                : (approval_status === 'approved' ? '✅ Schedule approved' : '❌ Schedule rejected'))
        } catch (error) {
            toast.error(isAr ? '❌ فشل تحديث حالة الموافقة' : '❌ Failed to update approval status')
            console.error('Approval error:', error)
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
            <div className="flex flex-col gap-4">
                {/* Month Navigation and Filter */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
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
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Client Filter */}
                        <Select value={clientFilter} onValueChange={setClientFilter}>
                            <SelectTrigger className="w-full sm:w-[180px] h-9 rounded-xl border-border">
                                <div className="flex items-center gap-2">
                                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                    <SelectValue placeholder={isAr ? 'كل العملاء' : 'All Clients'} />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    {isAr ? 'كل العملاء' : 'All Clients'}
                                </SelectItem>
                                {clients?.map(client => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.name || client.company}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Reset Filter Button - Show when client filter is active */}
                        {clientFilter !== 'all' && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 rounded-xl border-border hover:bg-muted"
                                onClick={() => setClientFilter('all')}
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        )}

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
                        {canCreate && (
                            <Button
                                size="sm"
                                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                                onClick={() => { setEditingSchedule(null); setFormOpen(true) }}
                            >
                                <Plus className="h-4 w-4 me-1.5" />
                                {isAr ? 'جدولة جديدة' : 'New Schedule'}
                            </Button>
                        )}

                        {/* Edit/Create Dialog (always rendered so edit works even when canCreate=false) */}
                        <Dialog open={formOpen} onOpenChange={setFormOpen}>
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
                                    defaultClientId={clientFilter !== 'all' ? clientFilter : undefined}
                                    userRole={userRole}
                                    simplifiedForm={simplifiedForm}
                                />
                            </DialogContent>
                        </Dialog>

                        {/* Missing Items - separate form */}
                        {canCreate && (
                        <Dialog open={missingFormOpen} onOpenChange={setMissingFormOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
                                >
                                    <AlertTriangle className="h-4 w-4 me-1.5" />
                                    {isAr ? 'نواقص' : 'Missing Items'}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg border-amber-500/20">
                                <DialogHeader>
                                    <DialogTitle className="text-lg">
                                        {isAr ? '⚠️ إبلاغ عن نواقص' : '⚠️ Report Missing Items'}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {isAr ? 'أضف النواقص المطلوبة وسيتم إرسالها للمسؤول' : 'Add required missing items and they will be sent to the manager'}
                                    </DialogDescription>
                                </DialogHeader>
                                <MissingItemsForm
                                    teamLeaderId={teamLeaderId}
                                    initialDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined}
                                    isLoading={createSchedule.isPending}
                                    onSubmit={handleCreateMissingItems}
                                    defaultClientId={clientFilter !== 'all' ? clientFilter : undefined}
                                />
                            </DialogContent>
                        </Dialog>
                        )}
                    </div>
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
                    icon={<AlertTriangle className="h-5 w-5" />}
                    label={isAr ? 'النواقص' : 'Missing'}
                    value={monthStats.missingItems}
                    color="amber"
                    active={false}
                    onClick={() => setStatusFilter('all')}
                    pulse={monthStats.missingItems > 0}
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
                                    const allDaySchedules = allSchedulesByDate.get(dateKey) || []
                                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                                    const isCurrentMonth = isSameMonth(day, currentDate)
                                    const isToday = isTodayFn(day)
                                    const hasOverdue = allDaySchedules.some(s => isScheduleOverdue(s))
                                    const hasCompleted = allDaySchedules.some(s => s.status === 'completed')

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
                                                {allDaySchedules.length > 0 && (
                                                    <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md">
                                                        {allDaySchedules.length}
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
                                                                {s.start_time?.slice(0, 5)} {s.schedule_type ? (s.schedule_type === 'reels' ? '📹' : '📝') + ' ' : ''}{s.title}
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
                                            {allDaySchedules.length > 0 && (
                                                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                                                    {hasOverdue && <div className="w-1 h-1 rounded-full bg-red-500" />}
                                                    {hasCompleted && <div className="w-1 h-1 rounded-full bg-emerald-500" />}
                                                    {allDaySchedules.some(s => s.status === 'in_progress') && <div className="w-1 h-1 rounded-full bg-amber-400" />}
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
                        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-lg shadow-primary/10 animate-in fade-in slide-in-from-top-4 duration-300">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shadow-inner">
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
                                        <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10">
                                            {selectedSchedules.length} {isAr ? 'مواعيد' : 'events'}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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
                                        <p className="text-sm text-muted-foreground font-semibold">
                                            {isAr ? 'لا توجد مواعيد في هذا اليوم' : 'No events scheduled for this day'}
                                        </p>
                                        {canCreate && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-3 rounded-xl"
                                                onClick={() => { setEditingSchedule(null); setFormOpen(true) }}
                                            >
                                                <Plus className="h-3.5 w-3.5 me-1.5" />
                                                {isAr ? 'إضافة جدولة' : 'Add Schedule'}
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <ScrollArea className="max-h-[600px]">
                                        <div className="space-y-3 pe-1">
                                            {selectedSchedules.map(s => (
                                                <ScheduleCard
                                                    key={s.id}
                                                    schedule={s}
                                                    isAr={isAr}
                                                    memberMap={memberMap}
                                                    onEdit={() => openEditForm(s)}
                                                    onDelete={() => openDeleteDialog(s.id)}
                                                    onStatusChange={(status) => handleStatusChange(s.id, status)}
                                                    isAccountManager={isAccountManager}
                                                    onApproval={handleApproval}
                                                />
                                            ))}
                                        </div>
                                    </ScrollArea>
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
                    isAccountManager={isAccountManager}
                    onApproval={handleApproval}
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
    isAccountManager?: boolean
    onApproval?: (id: string, status: 'approved' | 'rejected') => void
}

function ScheduleCard({ schedule, isAr, memberMap, onEdit, onDelete, onStatusChange, isAccountManager, onApproval }: ScheduleCardProps) {
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

                        {schedule.schedule_type && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                                <span>{schedule.schedule_type === 'reels' ? '📹' : '📝'}</span>
                                <span className="truncate">{schedule.schedule_type === 'reels' ? (isAr ? 'ريلز' : 'Reels') : (isAr ? 'بوست' : 'Post')}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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
                            <span className="truncate max-w-[120px]">{schedule.client?.name || schedule.client?.company}</span>
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

                {/* Approval Status & Missing Items */}
                {(schedule.approval_status || schedule.missing_items) && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-border/20">
                        {schedule.approval_status && (
                            <Badge
                                variant="outline"
                                className={cn(
                                    'text-[10px] px-2 py-0 h-5 rounded-md border',
                                    schedule.approval_status === 'approved' && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
                                    schedule.approval_status === 'rejected' && 'bg-red-500/10 text-red-600 border-red-500/30',
                                    schedule.approval_status === 'pending' && 'bg-amber-500/10 text-amber-600 border-amber-500/30',
                                )}
                            >
                                {isAr
                                    ? APPROVAL_STATUS_CONFIG.find(c => c.id === schedule.approval_status)?.labelAr
                                    : APPROVAL_STATUS_CONFIG.find(c => c.id === schedule.approval_status)?.label}
                            </Badge>
                        )}
                        {schedule.missing_items && (
                            <Badge
                                variant="outline"
                                className={cn(
                                    'text-[10px] px-2 py-0 h-5 rounded-md border',
                                    schedule.missing_items_status === 'pending' && 'bg-orange-500/10 text-orange-600 border-orange-500/30',
                                    schedule.missing_items_status === 'resolved' && 'bg-green-500/10 text-green-600 border-green-500/30',
                                    schedule.missing_items_status === 'not_applicable' && 'bg-gray-400/10 text-gray-500 border-gray-400/30',
                                )}
                            >
                                <AlertTriangle className="h-3 w-3 me-1" />
                                {isAr ? 'نواقص' : 'Missing'}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Manager Notes */}
                {schedule.manager_notes && (
                    <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-blue-500/5 border border-blue-500/20">
                        <p className="text-[10px] font-semibold text-blue-600 mb-0.5">{isAr ? 'ملاحظات المدير' : 'Manager Notes'}</p>
                        <p className="text-xs text-blue-600/80 line-clamp-2">{schedule.manager_notes}</p>
                    </div>
                )}

                {/* Account Manager Approval Controls */}
                {isAccountManager && onApproval && schedule.approval_status !== 'approved' && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-xs rounded-lg bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
                            onClick={() => onApproval(schedule.id, 'approved')}
                        >
                            <CheckCircle2 className="h-3 w-3 me-1" />
                            {isAr ? 'موافقة' : 'Approve'}
                        </Button>
                        {schedule.approval_status !== 'rejected' && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-7 text-xs rounded-lg bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20"
                                onClick={() => onApproval(schedule.id, 'rejected')}
                            >
                                <X className="h-3 w-3 me-1" />
                                {isAr ? 'رفض' : 'Reject'}
                            </Button>
                        )}
                    </div>
                )}

                {/* Status Change Dropdown */}
                <div className="mt-3 pt-3 border-t border-border/20">
                    <Select value={schedule.status} onValueChange={(v) => onStatusChange(v as ScheduleStatus)}>
                        <SelectTrigger className="h-8 rounded-lg text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SCHEDULE_STATUS_CONFIG.map(cfg => (
                                <SelectItem key={cfg.id} value={cfg.id}>
                                    <span className="text-xs">{isAr ? cfg.labelAr : cfg.label}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
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
    isAccountManager?: boolean
    onApproval?: (id: string, status: 'approved' | 'rejected') => void
}

function ScheduleListView({ schedules, isAr, memberMap, onEdit, onDelete, onStatusChange, isAccountManager, onApproval }: ScheduleListViewProps) {
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

// ============================================
// Schedule Form
// ============================================

interface ScheduleFormProps {
    teamLeaderId: string
    initialDate?: string
    schedule?: ScheduleWithRelations | null
    isLoading: boolean
    onSubmit: (data: any) => void
    defaultClientId?: string  // من الفلتر
    userRole?: string         // لتخصيص الحقول حسب الدور
    simplifiedForm?: boolean  // إخفاء endTime و team members
}

function ScheduleForm({ teamLeaderId, initialDate, schedule, isLoading, onSubmit, defaultClientId, userRole, simplifiedForm = false }: ScheduleFormProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const { data: currentUser } = useCurrentUser()
    const { data: clients } = useClients()
    const { data: teamMembers } = useTeamMembers(teamLeaderId)

    const [title, setTitle] = useState(schedule?.title || '')
    const [date] = useState(schedule?.scheduled_date || initialDate || '')
    const [time, setTime] = useState(schedule?.start_time?.slice(0, 5) || '')
    const [endTime, setEndTime] = useState(schedule?.end_time?.slice(0, 5) || '')
    const [location, setLocation] = useState(schedule?.location || '')
    const [description, setDescription] = useState(schedule?.description || '')
    const [notes, setNotes] = useState(schedule?.notes || '')
    const [status, setStatus] = useState<ScheduleStatus>(schedule?.status || 'scheduled')
    const [clientId, setClientId] = useState(schedule?.client_id || defaultClientId || 'no-client')
    const [department, setDepartment] = useState<Department>(schedule?.department || (currentUser?.department || 'photography'))
    const [assignedMembers, setAssignedMembers] = useState<string[]>(schedule?.assigned_members || [])
    const [scheduleType, setScheduleType] = useState<ScheduleType>(schedule?.schedule_type || 'post')
    const [missingItems, setMissingItems] = useState(schedule?.missing_items || '')
    const [missingItemsStatus, setMissingItemsStatus] = useState<MissingItemsStatus>(schedule?.missing_items_status || 'not_applicable')
    const [links, setLinks] = useState<ScheduleLink[]>(schedule?.links || [])
    const [images, setImages] = useState<string[]>(schedule?.images || [])

    // Simplified form: hide endTime & team members (for content department)
    const isSimplified = simplifiedForm || userRole === 'creator' || currentUser?.role === 'creator'

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
        const selectedClient = clients?.find(c => c.id === clientId)
        const companyName = selectedClient ? (selectedClient.name || selectedClient.company) : title
        onSubmit({
            title,
            company_name: companyName,
            scheduled_date: date,
            start_time: time || null,
            end_time: endTime || null,
            location: location || null,
            description: description || null,
            notes: notes || null,
            status,
            client_id: clientId === 'no-client' ? null : clientId,
            department,
            assigned_members: assignedMembers,
            team_leader_id: teamLeaderId,
            schedule_type: scheduleType,
            missing_items: missingItems || null,
            missing_items_status: missingItems.trim() ? missingItemsStatus : 'not_applicable',
            links: links.filter(l => l.url.trim()),
            images,
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

            {/* Schedule Type */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? 'نوع المحتوى' : 'Content Type'} *
                </Label>
                <Select value={scheduleType} onValueChange={(v) => setScheduleType(v as ScheduleType)}>
                    <SelectTrigger className="rounded-xl">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {SCHEDULE_TYPE_CONFIG.map(cfg => (
                            <SelectItem key={cfg.id} value={cfg.id}>
                                <span className="flex items-center gap-2">
                                    <span>{cfg.icon}</span>
                                    <span>{isAr ? cfg.labelAr : cfg.label}</span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Date & Time */}
            <div className={cn("grid gap-3", isSimplified ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3")}>
                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {isAr ? 'التاريخ' : 'Date'}
                    </Label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-muted/30 text-sm">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{date ? format(new Date(date + 'T00:00:00'), 'dd MMM yyyy', { locale: isAr ? ar : enUS }) : (isAr ? 'اختر من التقويم' : 'Select from calendar')}</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {isAr ? 'من' : 'From'}
                    </Label>
                    <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="rounded-xl" />
                </div>
                {!isSimplified && (
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {isAr ? 'إلى' : 'To'}
                        </Label>
                        <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="rounded-xl" />
                    </div>
                )}
            </div>

            {/* Client */}
            <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5" />
                            {isAr ? 'العميل' : 'Client'}
                        </span>
                        {clients && clients.length > 0 && (
                            <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {clients.length} {isAr ? 'عميل' : 'clients'}
                            </span>
                        )}
                    </Label>
                    <Select value={clientId} onValueChange={setClientId}>
                        <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder={isAr ? 'اختر العميل (اختياري)' : 'Select client (optional)'} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {/* No Client Option */}
                            <SelectItem value="no-client">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">
                                            {isAr ? 'بدون عميل' : 'No Client'}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            {isAr ? 'مهمة عامة' : 'General task'}
                                        </div>
                                    </div>
                                </div>
                            </SelectItem>
                            
                            {clients && clients.length > 0 ? (
                                <>
                                    <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-t mt-1 pt-2">
                                        {isAr ? 'العملاء المتاحين' : 'Available Clients'}
                                    </div>
                                    {clients.map(client => {
                                        const hasUserAccount = !!client.user_id
                                        return (
                                            <SelectItem key={client.id} value={client.id}>
                                                <div className="flex items-center gap-2.5 py-1">
                                                    <Avatar className="h-8 w-8 border border-border/50">
                                                        <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-primary/20 to-primary/5">
                                                            {(client.name || client.company)?.charAt(0)?.toUpperCase() || '?'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-medium text-sm truncate">
                                                                {client.name || client.company}
                                                            </span>
                                                            {hasUserAccount && (
                                                                <span className="text-emerald-500" title={isAr ? 'لديه حساب - يمكنه الدخول' : 'Has account - Can login'}>
                                                                    ✓
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground truncate">
                                                            {hasUserAccount 
                                                                ? (client.email || (client.phone ? `📱 ${client.phone}` : (isAr ? 'لديه حساب' : 'Has account')))
                                                                : (isAr ? '⚠️ بدون حساب - لن يرى الجدولة' : '⚠️ No account - Won\'t see schedule')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        )
                                    })}
                                </>
                            ) : (
                                <div className="px-3 py-6 text-center">
                                    <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mx-auto mb-2">
                                        <Users className="h-6 w-6 text-muted-foreground/30" />
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-1 font-medium">
                                        {isAr ? 'لا يوجد عملاء' : 'No clients yet'}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground/60">
                                        {isAr ? 'قم بإضافة عميل جديد أولاً' : 'Add a new client first'}
                                    </p>
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                    {/* Warning if client has no account */}
                    {clientId && clientId !== 'no-client' && clients?.find(c => c.id === clientId && !c.user_id) && (
                        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            <div className="flex-1 text-[11px] text-amber-600 dark:text-amber-400">
                                <p className="font-semibold mb-0.5">
                                    {isAr ? '⚠️ تنبيه: هذا العميل ليس لديه حساب' : '⚠️ Warning: This client has no account'}
                                </p>
                                <p className="text-amber-600/80 dark:text-amber-400/80">
                                    {isAr 
                                        ? 'لن يتمكن من رؤية هذه الجدولة في لوحة التحكم الخاصة به. قم بإنشاء حساب له أولاً.'
                                        : 'They won\'t be able to see this schedule in their dashboard. Create an account for them first.'}
                                </p>
                            </div>
                        </div>
                    )}
                    {/* Debug tip for admins */}
                    {clientId && clientId !== 'no-client' && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/30 text-xs text-muted-foreground">
                            <Bug className="h-3.5 w-3.5 shrink-0" />
                            <span>
                                {isAr 
                                    ? 'للتشخيص: اذهب إلى Admin → 🔍 تشخيص الجدولات'
                                    : 'Debug: Go to Admin → 🔍 Debug Schedules'}
                            </span>
                        </div>
                    )}
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
            {!isSimplified && (
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
            )}

            {/* Department - Read Only */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? 'القسم' : 'Department'}
                </Label>
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-primary/30 bg-primary/5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        {department === 'photography' ? (
                            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        ) : (
                            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-sm text-foreground">
                            {department === 'photography' 
                                ? (isAr ? 'التصوير' : 'Photography')
                                : (isAr ? 'المحتوى' : 'Content')}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                            {isAr ? 'قسمك الحالي' : 'Your current department'}
                        </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 h-5 rounded-md">
                        {isAr ? 'تلقائي' : 'Auto'}
                    </Badge>
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? 'الوصف' : 'Description'}
                </Label>
                <EmojiTextarea
                    value={description}
                    onChange={setDescription}
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
                <EmojiTextarea
                    value={notes}
                    onChange={setNotes}
                    rows={3}
                    className="rounded-xl resize-none"
                    placeholder={isAr ? 'ملاحظات إضافية... يمكنك استخدام الإيموجي 😊' : 'Additional notes... You can use emoji 😊'}
                />
            </div>

            {/* Missing Items */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {isAr ? 'النواقص' : 'Missing Items'}
                </Label>
                <EmojiTextarea
                    value={missingItems}
                    onChange={(val) => {
                        setMissingItems(val)
                        if (val.trim() && missingItemsStatus === 'not_applicable') {
                            setMissingItemsStatus('pending')
                        } else if (!val.trim()) {
                            setMissingItemsStatus('not_applicable')
                        }
                    }}
                    rows={2}
                    className="rounded-xl resize-none"
                    placeholder={isAr ? 'مثال: المنيو، الشعار، صور المنتجات...' : 'e.g. Menu, Logo, Product photos...'}
                />
                {missingItems.trim() && (
                    <Select value={missingItemsStatus} onValueChange={(v) => setMissingItemsStatus(v as MissingItemsStatus)}>
                        <SelectTrigger className="rounded-xl">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {MISSING_ITEMS_STATUS_CONFIG.map(cfg => (
                                <SelectItem key={cfg.id} value={cfg.id}>
                                    <span className={cn('flex items-center gap-2', cfg.color)}>
                                        {isAr ? cfg.labelAr : cfg.label}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* Links */}
            <LinksInput
                value={links}
                onChange={setLinks}
                maxLinks={10}
            />

            {/* Images */}
            <ImageUploader
                value={images}
                onChange={setImages}
                maxImages={10}
            />

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

// ============================================
// Missing Items Form (Standalone)
// ============================================

interface MissingItemsFormProps {
    teamLeaderId: string
    initialDate?: string
    isLoading: boolean
    onSubmit: (data: any) => void
    defaultClientId?: string
}

function MissingItemsForm({ teamLeaderId, initialDate, isLoading, onSubmit }: MissingItemsFormProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const { data: currentUser } = useCurrentUser()
    const { data: myTasks } = useMyTasks(currentUser?.id || '')

    const [selectedTaskId, setSelectedTaskId] = useState<string>('no-task')
    const [missingItems, setMissingItems] = useState('')
    const [missingItemsStatus, setMissingItemsStatus] = useState<MissingItemsStatus>('pending')
    const [notes, setNotes] = useState('')

    const selectedTask = myTasks?.find(t => t.id === selectedTaskId)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!missingItems.trim()) return

        const taskLabel = selectedTask?.title || ''
        const clientLabel = selectedTask?.project?.client
            ? (selectedTask.project.client.name || selectedTask.project.client.company)
            : ''
        const autoTitle = isAr
            ? `نواقص${taskLabel ? ' - ' + taskLabel : ''}${clientLabel ? ' (' + clientLabel + ')' : ''}`
            : `Missing Items${taskLabel ? ' - ' + taskLabel : ''}${clientLabel ? ' (' + clientLabel + ')' : ''}`

        onSubmit({
            title: autoTitle,
            company_name: clientLabel || autoTitle,
            scheduled_date: initialDate || format(new Date(), 'yyyy-MM-dd'),
            start_time: format(new Date(), 'HH:mm'),
            end_time: null,
            location: null,
            description: null,
            notes: notes || null,
            status: 'scheduled' as ScheduleStatus,
            client_id: selectedTask?.project?.client?.id || null,
            department: currentUser?.department || 'content',
            assigned_members: [],
            team_leader_id: teamLeaderId,
            task_id: selectedTaskId !== 'no-task' ? selectedTaskId : undefined,
            schedule_type: 'post' as ScheduleType,
            missing_items: missingItems,
            missing_items_status: missingItemsStatus,
            links: [],
            images: [],
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            {/* Date (read-only) */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? 'التاريخ' : 'Date'}
                </Label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-muted/30 text-sm">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>
                        {initialDate
                            ? format(new Date(initialDate + 'T00:00:00'), 'dd MMM yyyy', { locale: isAr ? ar : enUS })
                            : format(new Date(), 'dd MMM yyyy', { locale: isAr ? ar : enUS })}
                    </span>
                </div>
            </div>

            {/* Task Selector */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ClipboardList className="h-3.5 w-3.5" />
                    {isAr ? 'التاسك' : 'Task'}
                </Label>
                <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                    <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder={isAr ? 'اختر التاسك' : 'Select task'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        <SelectItem value="no-task">
                            <div className="flex items-center gap-2">
                                <X className="h-4 w-4 text-muted-foreground" />
                                <span>{isAr ? 'بدون تاسك' : 'No Task'}</span>
                            </div>
                        </SelectItem>
                        {myTasks && myTasks.length > 0 ? (
                            <>
                                <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-t mt-1 pt-2">
                                    {isAr ? 'التاسكات الخاصة بك' : 'Your Tasks'}
                                </div>
                                {myTasks.map(task => {
                                    const clientName = task.project?.client
                                        ? (task.project.client.name || task.project.client.company)
                                        : null
                                    return (
                                        <SelectItem key={task.id} value={task.id}>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-medium truncate max-w-[300px]">
                                                    {task.title}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground truncate">
                                                    {task.project?.name || ''}
                                                    {clientName ? ` • ${clientName}` : ''}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    )
                                })}
                            </>
                        ) : (
                            <div className="px-3 py-4 text-center">
                                <p className="text-xs text-muted-foreground">
                                    {isAr ? 'لا يوجد تاسكات' : 'No tasks found'}
                                </p>
                            </div>
                        )}
                    </SelectContent>
                </Select>
                {selectedTask?.project?.client && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-1">
                        <Building2 className="h-3 w-3" />
                        <span>{selectedTask.project.client.name || selectedTask.project.client.company}</span>
                    </div>
                )}
            </div>

            {/* Missing Items */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {isAr ? 'النواقص' : 'Missing Items'} *
                </Label>
                <EmojiTextarea
                    value={missingItems}
                    onChange={setMissingItems}
                    rows={4}
                    className="rounded-xl resize-none"
                    placeholder={isAr ? 'اكتب النواقص المطلوبة...\nمثال: المنيو، الشعار، صور المنتجات...' : 'Describe missing items...\ne.g. Menu, Logo, Product photos...'}
                />
            </div>

            {/* Missing Items Status */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? 'حالة النواقص' : 'Status'}
                </Label>
                <Select value={missingItemsStatus} onValueChange={(v) => setMissingItemsStatus(v as MissingItemsStatus)}>
                    <SelectTrigger className="rounded-xl">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {MISSING_ITEMS_STATUS_CONFIG.map(cfg => (
                            <SelectItem key={cfg.id} value={cfg.id}>
                                <span className={cn('flex items-center gap-2', cfg.color)}>
                                    {isAr ? cfg.labelAr : cfg.label}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? 'ملاحظات' : 'Notes'}
                </Label>
                <EmojiTextarea
                    value={notes}
                    onChange={setNotes}
                    rows={2}
                    className="rounded-xl resize-none"
                    placeholder={isAr ? 'ملاحظات إضافية...' : 'Additional notes...'}
                />
            </div>

            {/* Submit */}
            <Button
                type="submit"
                disabled={isLoading || !missingItems.trim()}
                className="w-full rounded-xl h-11 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <>
                        <AlertTriangle className="h-4 w-4 me-2" />
                        {isAr ? 'إرسال النواقص' : 'Submit Missing Items'}
                    </>
                )}
            </Button>
        </form>
    )
}
