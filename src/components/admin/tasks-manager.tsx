'use client'

import { useState, useMemo, useCallback, memo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAdminTasks, useAdminTasksStats, useAdminTasksExport } from '@/hooks/use-tasks'
import { useTasksRealtime } from '@/hooks/use-realtime'
import { useDebounce } from '@/hooks'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Loader2,
    Download,
    Search,
    FileText,
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    X,
    SlidersHorizontal,
    Building2,
    FileSpreadsheet
} from 'lucide-react'
import { exportTasksToCSV, exportTasksToPDF, type TaskExportData } from '@/lib/export-utils'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import type { TaskFilters, TaskWithRelations } from '@/types/task'
import {
    DEPARTMENT_OPTIONS,
    STATUS_OPTIONS,
    PRIORITY_OPTIONS,
    TASK_TYPE_OPTIONS,
    STATUS_CONFIG,
    PRIORITY_STYLE_CONFIG,
    DEPARTMENT_BADGE_CONFIG,
} from '@/lib/constants/admin'

// ============================================
// Utility Functions
// ============================================

/**
 * Safely format a date string, returning fallback if invalid
 */
function formatTaskDate(dateString: string | null | undefined, formatStr: string = 'dd/MM/yyyy'): string {
    if (!dateString) return '-'
    try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return '-'
        return format(date, formatStr)
    } catch {
        return '-'
    }
}

// ============================================
// Custom Hooks for Performance
// ============================================

function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined') return

        const mql = window.matchMedia(query)
        setMatches(mql.matches)
        const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
        mql.addEventListener('change', handler)
        return () => mql.removeEventListener('change', handler)
    }, [query])
    return matches
}

const ROWS_PER_PAGE = 15

export function TasksManager() {
    const t = useTranslations('tasksManager')
    // Real-time subscription for live task updates
    useTasksRealtime()

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [departmentFilter, setDepartmentFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')
    const [taskTypeFilter, setTaskTypeFilter] = useState('all')
    const [date, setDate] = useState<DateRange | undefined>()
    const [currentPage, setCurrentPage] = useState(1)
    const [showFilters, setShowFilters] = useState(false)
    const [isExporting, setIsExporting] = useState<'csv' | 'pdf' | null>(null)
    const isSmallScreen = useMediaQuery('(max-width: 639px)')

    // Debounce search to avoid excessive API calls
    const debouncedSearch = useDebounce(search, 400)

    // Build filters object — only include non-default values
    const filters = useMemo<TaskFilters>(() => ({
        search: debouncedSearch.length > 2 ? debouncedSearch : undefined,
        status: statusFilter === 'all' ? undefined : (statusFilter as any),
        department: departmentFilter === 'all' ? undefined : (departmentFilter as any),
        priority: priorityFilter === 'all' ? undefined : (priorityFilter as any),
        task_type: taskTypeFilter === 'all' ? undefined : (taskTypeFilter as any),
        dateFrom: date?.from?.toISOString(),
        dateTo: date?.to?.toISOString(),
    }), [debouncedSearch, statusFilter, departmentFilter, priorityFilter, taskTypeFilter, date])

    // Server-side paginated data
    const { data: paginatedResult, isLoading, error, isFetching } = useAdminTasks(filters, currentPage, ROWS_PER_PAGE)
    // Lightweight stats query (separate so stats don't flicker on page change)
    const { data: stats } = useAdminTasksStats(filters)
    // Export data (only fetched when requested)
    const { data: exportData } = useAdminTasksExport(filters, isExporting !== null)

    const tasks = paginatedResult?.data ?? []
    const totalCount = paginatedResult?.totalCount ?? 0
    const totalPages = Math.ceil(totalCount / ROWS_PER_PAGE)

    // Count active filters
    const activeFilterCount = useMemo(() => {
        let count = 0
        if (statusFilter !== 'all') count++
        if (departmentFilter !== 'all') count++
        if (priorityFilter !== 'all') count++
        if (taskTypeFilter !== 'all') count++
        if (date?.from) count++
        if (debouncedSearch.length > 2) count++
        return count
    }, [statusFilter, departmentFilter, priorityFilter, taskTypeFilter, date, debouncedSearch])

    // Reset page to 1 when any filter changes
    const handleStatusChange = useCallback((value: string) => {
        setStatusFilter(value)
        setCurrentPage(1)
    }, [])

    const handleDepartmentChange = useCallback((value: string) => {
        setDepartmentFilter(value)
        setCurrentPage(1)
    }, [])

    const handlePriorityChange = useCallback((value: string) => {
        setPriorityFilter(value)
        setCurrentPage(1)
    }, [])

    const handleTaskTypeChange = useCallback((value: string) => {
        setTaskTypeFilter(value)
        setCurrentPage(1)
    }, [])

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value)
        setCurrentPage(1)
    }, [])

    const handleDateChange = useCallback((range: DateRange | undefined) => {
        setDate(range)
        setCurrentPage(1)
    }, [])

    const clearAllFilters = useCallback(() => {
        setSearch('')
        setStatusFilter('all')
        setDepartmentFilter('all')
        setPriorityFilter('all')
        setTaskTypeFilter('all')
        setDate(undefined)
        setCurrentPage(1)
    }, [])

    // Export handlers - trigger data fetch and wait for useEffect to handle the actual export
    const handleExportCSV = useCallback(() => {
        setIsExporting('csv')
    }, [])

    const handleExportPDF = useCallback(() => {
        setIsExporting('pdf')
    }, [])

    // Perform download once data is available (single source of truth)
    useEffect(() => {
        if (isExporting && exportData && exportData.length > 0) {
            if (isExporting === 'csv') {
                exportTasksToCSV(exportData as TaskExportData[])
                setIsExporting(null)
            } else if (isExporting === 'pdf') {
                exportTasksToPDF(exportData as TaskExportData[], undefined, stats)
                    .catch((error) => console.error('Error exporting PDF:', error))
                    .finally(() => setIsExporting(null))
            }
        }
    }, [isExporting, exportData, stats])

    if (isLoading) {
        return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    if (error) {
        return <div className="text-red-500 p-3 md:p-4 border border-red-200 rounded-lg bg-red-50 text-sm">{t('errorLoadingData')}</div>
    }

    // Type-safe tasks data
    const typedTasks = tasks as TaskWithRelations[]

    return (
        <Card>
            <CardContent className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
                {/* Summary Stats — from lightweight stats query */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                    <TaskStatCard value={stats?.total ?? 0} label={t('totalTasks')} colorClass="bg-blue-100 dark:bg-blue-500/20 text-blue-700" />
                    <TaskStatCard value={stats?.in_progress ?? 0} label={t('inProgress')} colorClass="bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700" />
                    <TaskStatCard value={stats?.review ?? 0} label={t('review')} colorClass="bg-purple-100 dark:bg-purple-500/20 text-purple-700" />
                    <TaskStatCard value={stats?.approved ?? 0} label={t('approved')} colorClass="bg-green-100 dark:bg-green-500/20 text-green-700" />
                </div>

                {/* Search + Filter Toggle (Mobile) + Export */}
                <div className="flex flex-col gap-3">
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder={t('searchPlaceholder')}
                                value={search}
                                onChange={handleSearchChange}
                                className="pr-9"
                            />
                        </div>
                        {/* Filter Toggle - visible on mobile, hidden on lg+ */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="lg:hidden shrink-0 relative"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </Button>
                        {/* Mobile Export Dropdown */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="md:hidden shrink-0"
                                    disabled={totalCount === 0 || isExporting !== null}
                                    title={t('export')}
                                >
                                    <Download className="w-4 h-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-2" align="end">
                                <div className="flex flex-col gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleExportCSV}
                                        disabled={isExporting !== null}
                                        className="justify-start"
                                    >
                                        {isExporting === 'csv' ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 ml-2" />}
                                        CSV
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleExportPDF}
                                        disabled={isExporting !== null}
                                        className="justify-start"
                                    >
                                        {isExporting === 'pdf' ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <FileText className="w-4 h-4 ml-2" />}
                                        PDF
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                        {/* Desktop Export Buttons */}
                        <div className="hidden md:flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleExportCSV}
                                disabled={totalCount === 0 || isExporting !== null}
                            >
                                {isExporting === 'csv' ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 ml-2" />}
                                CSV
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleExportPDF}
                                disabled={totalCount === 0 || isExporting !== null}
                            >
                                {isExporting === 'pdf' ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <FileText className="w-4 h-4 ml-2" />}
                                PDF
                            </Button>
                        </div>
                    </div>

                    {/* Filters Panel - always visible on lg+, collapsible on mobile */}
                    <div className={cn(
                        "flex-col gap-3 transition-all duration-200",
                        showFilters ? "flex" : "hidden lg:flex"
                    )}>
                        {/* Row 1: Department + Status + Priority + Task Type */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                            <Select value={departmentFilter} onValueChange={handleDepartmentChange}>
                                <SelectTrigger className="w-full">
                                    <Building2 className="w-4 h-4 ml-1 shrink-0 text-muted-foreground" />
                                    <SelectValue placeholder={t('department')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {DEPARTMENT_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={handleStatusChange}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t('status')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={priorityFilter} onValueChange={handlePriorityChange}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t('priority')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRIORITY_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={taskTypeFilter} onValueChange={handleTaskTypeChange}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t('type')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {TASK_TYPE_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Row 2: Date + Clear */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant="outline"
                                        className={cn(
                                            "w-full sm:w-[240px] justify-start text-left font-normal text-sm",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="ml-2 h-4 w-4 shrink-0" />
                                        {date?.from ? (
                                            date.to ? (
                                                <span className="truncate">
                                                    {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                                                </span>
                                            ) : (
                                                format(date.from, "LLL dd, y")
                                            )
                                        ) : (
                                            <span>{t('selectDate')}</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={date?.from}
                                        selected={date}
                                        onSelect={handleDateChange}
                                        numberOfMonths={isSmallScreen ? 1 : 2}
                                    />
                                </PopoverContent>
                            </Popover>
                            {date && (
                                <Button variant="ghost" size="icon" onClick={() => handleDateChange(undefined)} title={t('removeDate')}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}

                            {activeFilterCount > 0 && (
                                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                    <X className="w-4 h-4 ml-1" />
                                    {t('clearAll', { count: activeFilterCount })}
                                </Button>
                            )}
                        </div>

                        {/* Active Filters Badges */}
                        {activeFilterCount > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                                {[
                                    { filter: departmentFilter, options: DEPARTMENT_OPTIONS, handler: handleDepartmentChange, icon: <Building2 className="w-3 h-3" /> },
                                    { filter: statusFilter, options: STATUS_OPTIONS, handler: handleStatusChange },
                                    { filter: priorityFilter, options: PRIORITY_OPTIONS, handler: handlePriorityChange },
                                    { filter: taskTypeFilter, options: TASK_TYPE_OPTIONS, handler: handleTaskTypeChange },
                                ].map(({ filter, options, handler, icon }, idx) => (
                                    filter !== 'all' && (
                                        <Badge key={idx} variant="secondary" className="gap-1 text-xs">
                                            {icon}
                                            {options.find(o => o.value === filter)?.label}
                                            <button onClick={() => handler('all')} className="ml-0.5 hover:text-red-500">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                    {isFetching && !isLoading && (
                        <div className="flex justify-center py-2">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    )}
                    {typedTasks.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground text-sm">
                            {t('noMatchingTasks')}
                        </div>
                    ) : (
                        typedTasks.map((task) => (
                            <MobileTaskCard key={task.id} task={task} />
                        ))
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block border rounded-lg overflow-hidden relative">
                    {isFetching && !isLoading && (
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    )}
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="text-right">{t('taskTitle')}</TableHead>
                                <TableHead className="text-right">{t('client')}</TableHead>
                                <TableHead className="text-right hidden lg:table-cell">{t('teamLeader')}</TableHead>
                                <TableHead className="text-right hidden lg:table-cell">{t('designer')}</TableHead>
                                <TableHead className="text-center">{t('status')}</TableHead>
                                <TableHead className="text-center hidden lg:table-cell">{t('priority')}</TableHead>
                                <TableHead className="text-center hidden xl:table-cell">{t('date')}</TableHead>
                                <TableHead className="text-left">{t('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {typedTasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                        {t('noMatchingTasks')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                typedTasks.map((task) => (
                                    <TableRow key={task.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span className="line-clamp-1">{task.title}</span>
                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{task.description}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium text-sm">
                                                {task.client?.name || task.project?.client?.name || task.company_name || '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="flex items-center gap-2">
                                                {task.creator?.avatar_url && (
                                                    <img src={task.creator.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                                                )}
                                                <span>{task.creator?.name || 'System'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            {task.assigned_user ? (
                                                <div className="flex items-center gap-2">
                                                    {task.assigned_user.avatar_url && (
                                                        <img src={task.assigned_user.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                                                    )}
                                                    <span>{task.assigned_user.name}</span>
                                                </div>
                                            ) : (
                                                <Badge variant="outline" className="opacity-50">{t('unassigned')}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <StatusBadge status={task.status} />
                                        </TableCell>
                                        <TableCell className="text-center hidden lg:table-cell">
                                            <PriorityBadge priority={task.priority} />
                                        </TableCell>
                                        <TableCell className="text-center text-sm text-gray-500 hidden xl:table-cell">
                                            {formatTaskDate(task.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            {task.client_feedback && (
                                                <TaskFeedbackDialog
                                                    feedback={task.client_feedback}
                                                    taskTitle={task.title}
                                                    variant="desktop"
                                                />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-4">
                    <div className="text-xs sm:text-sm text-muted-foreground">
                        {totalCount > 0 ? (
                            <>
                                <span className="hidden sm:inline">
                                    {t('showingRange', { from: ((currentPage - 1) * ROWS_PER_PAGE) + 1, to: Math.min(currentPage * ROWS_PER_PAGE, totalCount), total: totalCount })}
                                    {' '}{t('pageOf', { current: currentPage, total: totalPages })}
                                </span>
                                <span className="sm:hidden">
                                    {currentPage}/{totalPages}
                                </span>
                            </>
                        ) : (
                            t('noResults')
                        )}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || isFetching}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        {/* Page number buttons - reactive via useMediaQuery */}
                        {totalPages > 1 && (() => {
                            const maxButtons = isSmallScreen ? 3 : 5
                            const actualButtons = Math.min(maxButtons, totalPages)
                            const startPage = Math.max(1, Math.min(currentPage - Math.floor(actualButtons / 2), totalPages - actualButtons + 1))
                            return Array.from({ length: actualButtons }, (_, i) => {
                                const page = startPage + i
                                return (
                                    <Button
                                        key={page}
                                        variant={page === currentPage ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        disabled={isFetching}
                                        className="w-8 h-8 p-0 text-xs"
                                    >
                                        {page}
                                    </Button>
                                )
                            })
                        })()}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage >= totalPages || isFetching}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}

// ============================================
// Shared Sub-Components
// ============================================

/**
 * Reusable dialog for displaying client feedback
 */
const TaskFeedbackDialog = memo(function TaskFeedbackDialog({
    feedback,
    taskTitle,
    variant = 'desktop'
}: {
    feedback: string
    taskTitle: string
    variant?: 'desktop' | 'mobile'
}) {
    const t = useTranslations('tasksManager')
    return (
        <Dialog>
            <DialogTrigger asChild>
                {variant === 'desktop' ? (
                    <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600 hover:bg-orange-50">
                        <FileText className="w-4 h-4 ml-1" />
                        <span className="hidden lg:inline">{t('feedback')}</span>
                    </Button>
                ) : (
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-orange-500 hover:text-orange-600 hover:bg-orange-50 px-2">
                        <FileText className="w-3.5 h-3.5 ml-1" />
                        {t('feedback')}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className={variant === 'desktop' ? "max-w-[90vw] sm:max-w-lg" : "max-w-[92vw] sm:max-w-lg"}>
                <DialogHeader>
                    <DialogTitle className={variant === 'mobile' ? "text-base" : undefined}>
                        {t('feedbackTitle')}{variant === 'desktop' ? ` ${t('fromClient')}` : ''}
                    </DialogTitle>
                    <DialogDescription className={variant === 'mobile' ? "text-xs" : undefined}>
                        {variant === 'desktop' ? `${t('forTask')} ` : `${t('task')} `}{taskTitle}
                    </DialogDescription>
                </DialogHeader>
                <div className={cn(
                    "bg-orange-50 rounded-lg text-orange-900 border border-orange-100",
                    variant === 'desktop' ? "p-4 min-h-[100px]" : "p-3 min-h-[80px] text-sm"
                )}>
                    {feedback}
                </div>
            </DialogContent>
        </Dialog>
    )
})

/**
 * Reusable stat card for task metrics
 */
const TaskStatCard = memo(function TaskStatCard({
    value,
    label,
    colorClass
}: {
    value: number
    label: string
    colorClass: string
}) {
    return (
        <div className={cn("rounded-lg p-2.5 md:p-3 text-center", colorClass)}>
            <div className="text-xl md:text-2xl font-bold">{value}</div>
            <div className="text-[10px] md:text-xs text-muted-foreground">{label}</div>
        </div>
    )
})

// ============================================
// Mobile Task Card — React.memo to prevent unnecessary re-renders
// ============================================

const MobileTaskCard = memo(function MobileTaskCard({ task }: { task: TaskWithRelations }) {
    const t = useTranslations('tasksManager')
    return (
        <div className="border rounded-lg p-3 space-y-2.5 bg-card">
            {/* Header: Title + Status */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-1">{task.title}</h3>
                    {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{task.description}</p>
                    )}
                </div>
                <StatusBadge status={task.status} />
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                {/* Department */}
                <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">{t('departmentLabel')}</span>
                    <DepartmentBadge department={task.department} />
                </div>
                {/* Priority */}
                <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">{t('priorityLabel')}</span>
                    <PriorityBadge priority={task.priority} />
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                    <span className="text-muted-foreground shrink-0">{t('clientLabel')}</span>
                    <span className="truncate font-medium">{task.client?.name || task.project?.client?.name || task.company_name || '-'}</span>
                </div>
                {/* Assigned */}
                <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">{t('designerLabel')}</span>
                    <span className="truncate">{task.assigned_user?.name || t('unassigned')}</span>
                </div>
                {/* Date */}
                <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">{t('dateLabel')}</span>
                    <span>{formatTaskDate(task.created_at)}</span>
                </div>
            </div>

            {/* Footer: Creator + Feedback */}
            <div className="flex items-center justify-between pt-1.5 border-t">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {task.creator?.avatar_url && (
                        <img src={task.creator.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                    )}
                    <span>{task.creator?.name || 'System'}</span>
                </div>
                {task.client_feedback && (
                    <TaskFeedbackDialog
                        feedback={task.client_feedback}
                        taskTitle={task.title}
                        variant="mobile"
                    />
                )}
            </div>
        </div>
    )
})

// ============================================
// Sub-components — React.memo for render optimization
// ============================================

const StatusBadge = memo(function StatusBadge({ status }: { status: string }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['new']
    return (
        <Badge variant="outline" className={`${config.style} whitespace-nowrap text-[10px] sm:text-xs`}>
            {config.label}
        </Badge>
    )
})

const PriorityBadge = memo(function PriorityBadge({ priority }: { priority: string }) {
    const config = PRIORITY_STYLE_CONFIG[priority] || PRIORITY_STYLE_CONFIG['medium']
    return (
        <Badge variant="outline" className={`${config.style} whitespace-nowrap text-[10px] sm:text-xs`}>
            {config.label}
        </Badge>
    )
})

const DepartmentBadge = memo(function DepartmentBadge({ department }: { department: string | null }) {
    if (!department) {
        return <span className="text-[10px] sm:text-xs text-muted-foreground">—</span>
    }

    const config = DEPARTMENT_BADGE_CONFIG[department] || { label: department, className: 'bg-gray-100 text-gray-800 border-gray-200' }

    return (
        <Badge variant="outline" className={`${config.className} whitespace-nowrap text-[10px] sm:text-xs`}>
            {config.label}
        </Badge>
    )
})
