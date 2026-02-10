'use client'

import { useState, useMemo, useCallback, memo, useEffect, useRef } from 'react'
import { useAdminTasks, useAdminTasksStats, useAdminTasksExport } from '@/hooks/use-tasks'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
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
    Filter,
    FileText,
    ChevronLeft,
    ChevronRight,
    Eye,
    Calendar as CalendarIcon,
    X,
    SlidersHorizontal,
    Building2,
    ChevronDown,
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
import type { TaskFilters } from '@/types/task'

// ============================================
// Custom Hooks for Performance
// ============================================

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value)
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])
    return debouncedValue
}

function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false)
    useEffect(() => {
        const mql = window.matchMedia(query)
        setMatches(mql.matches)
        const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
        mql.addEventListener('change', handler)
        return () => mql.removeEventListener('change', handler)
    }, [query])
    return matches
}

const ROWS_PER_PAGE = 15

const DEPARTMENT_OPTIONS = [
    { value: 'all', label: 'كل الأقسام' },
    { value: 'content', label: 'قسم المحتوى' },
    { value: 'photography', label: 'قسم التصوير' },
] as const

const STATUS_OPTIONS = [
    { value: 'all', label: 'كل الحالات' },
    { value: 'new', label: 'جديدة' },
    { value: 'in_progress', label: 'قيد التنفيذ' },
    { value: 'review', label: 'مراجعة' },
    { value: 'revision', label: 'تعديل مطلوب' },
    { value: 'approved', label: 'معتمد' },
    { value: 'rejected', label: 'مرفوض' },
] as const

const PRIORITY_OPTIONS = [
    { value: 'all', label: 'كل الأولويات' },
    { value: 'urgent', label: 'عاجل' },
    { value: 'high', label: 'عالي' },
    { value: 'medium', label: 'متوسط' },
    { value: 'low', label: 'منخفض' },
] as const

const TASK_TYPE_OPTIONS = [
    { value: 'all', label: 'كل الأنواع' },
    { value: 'video', label: 'فيديو' },
    { value: 'photo', label: 'تصوير' },
    { value: 'editing', label: 'مونتاج' },
    { value: 'content', label: 'محتوى' },
    { value: 'general', label: 'عام' },
] as const

export function TasksManager() {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [departmentFilter, setDepartmentFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')
    const [taskTypeFilter, setTaskTypeFilter] = useState('all')
    const [date, setDate] = useState<DateRange | undefined>()
    const [currentPage, setCurrentPage] = useState(1)
    const [showFilters, setShowFilters] = useState(false)
    const [exportRequested, setExportRequested] = useState(false)
    const [exportingPDF, setExportingPDF] = useState(false)
    const isSmallScreen = useMediaQuery('(max-width: 639px)')

    // Debounce search to avoid excessive API calls
    const debouncedSearch = useDebounce(search, 400)

    // Build filters object — only include non-default values
    const filters = useMemo<TaskFilters>(() => ({
        search: debouncedSearch.length > 2 ? debouncedSearch : undefined,
        status: statusFilter === 'all' ? undefined : statusFilter as any,
        department: departmentFilter === 'all' ? undefined : departmentFilter as any,
        priority: priorityFilter === 'all' ? undefined : priorityFilter as any,
        task_type: taskTypeFilter === 'all' ? undefined : taskTypeFilter as any,
        dateFrom: date?.from?.toISOString(),
        dateTo: date?.to?.toISOString(),
    }), [debouncedSearch, statusFilter, departmentFilter, priorityFilter, taskTypeFilter, date])

    // Server-side paginated data
    const { data: paginatedResult, isLoading, error, isFetching } = useAdminTasks(filters, currentPage, ROWS_PER_PAGE)
    // Lightweight stats query (separate so stats don't flicker on page change)
    const { data: stats } = useAdminTasksStats(filters)
    // Export data (only fetched when requested)
    const { data: exportData } = useAdminTasksExport(filters, exportRequested)

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
    const handleFilterChange = useCallback((setter: (v: string) => void) => {
        return (value: string) => {
            setter(value)
            setCurrentPage(1)
        }
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

    // CSV export — triggers a full data fetch on demand, then downloads
    const handleExportCSV = useCallback(() => {
        if (exportData && exportData.length > 0) {
            exportTasksToCSV(exportData as TaskExportData[])
            setExportRequested(false)
        } else {
            setExportRequested(true)
        }
    }, [exportData])

    // PDF export — includes statistics
    const handleExportPDF = useCallback(async () => {
        if (exportData && exportData.length > 0) {
            setExportingPDF(true)
            try {
                await exportTasksToPDF(exportData as TaskExportData[], undefined, stats)
            } catch (error) {
                console.error('Error exporting PDF:', error)
            } finally {
                setExportingPDF(false)
                setExportRequested(false)
            }
        } else {
            setExportRequested(true)
        }
    }, [exportData, stats])

    // Perform download once data is available
    useEffect(() => {
        if (exportRequested && exportData && exportData.length > 0) {
            exportTasksToCSV(exportData as TaskExportData[])
            setExportRequested(false)
        }
    }, [exportRequested, exportData])

    if (isLoading) {
        return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    if (error) {
        return <div className="text-red-500 p-3 md:p-4 border border-red-200 rounded-lg bg-red-50 text-sm">حدث خطأ أثناء تحميل البيانات.</div>
    }

    return (
        <Card>
            <CardContent className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
                {/* Summary Stats — from lightweight stats query */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                    <div className="bg-blue-50 dark:bg-blue-500/10 rounded-lg p-2.5 md:p-3 text-center">
                        <div className="text-xl md:text-2xl font-bold text-blue-600">{stats?.total ?? 0}</div>
                        <div className="text-[10px] md:text-xs text-muted-foreground">إجمالي المهام</div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-500/10 rounded-lg p-2.5 md:p-3 text-center">
                        <div className="text-xl md:text-2xl font-bold text-yellow-600">
                            {stats?.in_progress ?? 0}
                        </div>
                        <div className="text-[10px] md:text-xs text-muted-foreground">قيد التنفيذ</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-500/10 rounded-lg p-2.5 md:p-3 text-center">
                        <div className="text-xl md:text-2xl font-bold text-purple-600">
                            {stats?.review ?? 0}
                        </div>
                        <div className="text-[10px] md:text-xs text-muted-foreground">مراجعة</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-500/10 rounded-lg p-2.5 md:p-3 text-center">
                        <div className="text-xl md:text-2xl font-bold text-green-600">
                            {stats?.approved ?? 0}
                        </div>
                        <div className="text-[10px] md:text-xs text-muted-foreground">معتمد</div>
                    </div>
                </div>

                {/* Search + Filter Toggle (Mobile) + Export */}
                <div className="flex flex-col gap-3">
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="بحث عن مهمة..."
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
                                    disabled={totalCount === 0 || exportRequested || exportingPDF}
                                    title="تصدير"
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
                                        disabled={exportRequested}
                                        className="justify-start"
                                    >
                                        {exportRequested ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 ml-2" />}
                                        CSV
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleExportPDF}
                                        disabled={exportingPDF}
                                        className="justify-start"
                                    >
                                        {exportingPDF ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <FileText className="w-4 h-4 ml-2" />}
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
                                disabled={totalCount === 0 || exportRequested}
                            >
                                {exportRequested ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 ml-2" />}
                                CSV
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleExportPDF}
                                disabled={totalCount === 0 || exportingPDF}
                            >
                                {exportingPDF ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <FileText className="w-4 h-4 ml-2" />}
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
                            <Select value={departmentFilter} onValueChange={handleFilterChange(setDepartmentFilter)}>
                                <SelectTrigger className="w-full">
                                    <Building2 className="w-4 h-4 ml-1 shrink-0 text-muted-foreground" />
                                    <SelectValue placeholder="القسم" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DEPARTMENT_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="الحالة" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={priorityFilter} onValueChange={handleFilterChange(setPriorityFilter)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="الأولوية" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRIORITY_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={taskTypeFilter} onValueChange={handleFilterChange(setTaskTypeFilter)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="النوع" />
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
                                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                        {date?.from ? (
                                            date.to ? (
                                                <span className="truncate">
                                                    {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                                                </span>
                                            ) : (
                                                format(date.from, "LLL dd, y")
                                            )
                                        ) : (
                                            <span>اختر التاريخ</span>
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
                                <Button variant="ghost" size="icon" onClick={() => handleDateChange(undefined)} title="حذف التاريخ">
                                    <X className="h-4 w-4" />
                                </Button>
                            )}

                            {activeFilterCount > 0 && (
                                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                    <X className="w-4 h-4 ml-1" />
                                    مسح الكل ({activeFilterCount})
                                </Button>
                            )}
                        </div>

                        {/* Active Filters Badges */}
                        {activeFilterCount > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                                {departmentFilter !== 'all' && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                        <Building2 className="w-3 h-3" />
                                        {DEPARTMENT_OPTIONS.find(d => d.value === departmentFilter)?.label}
                                        <button onClick={() => handleFilterChange(setDepartmentFilter)('all')} className="ml-0.5 hover:text-red-500">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                )}
                                {statusFilter !== 'all' && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                        {STATUS_OPTIONS.find(s => s.value === statusFilter)?.label}
                                        <button onClick={() => handleFilterChange(setStatusFilter)('all')} className="ml-0.5 hover:text-red-500">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                )}
                                {priorityFilter !== 'all' && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                        {PRIORITY_OPTIONS.find(p => p.value === priorityFilter)?.label}
                                        <button onClick={() => handleFilterChange(setPriorityFilter)('all')} className="ml-0.5 hover:text-red-500">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                )}
                                {taskTypeFilter !== 'all' && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                        {TASK_TYPE_OPTIONS.find(t => t.value === taskTypeFilter)?.label}
                                        <button onClick={() => handleFilterChange(setTaskTypeFilter)('all')} className="ml-0.5 hover:text-red-500">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                )}
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
                    {tasks.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground text-sm">
                            لا توجد مهام مطابقة
                        </div>
                    ) : (
                        tasks.map((task: any) => (
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
                            <TableRow>
                                <TableHead className="text-right">عنوان المهمة</TableHead>
                                <TableHead className="text-right hidden lg:table-cell">القسم</TableHead>
                                <TableHead className="text-right">المشروع / العميل</TableHead>
                                <TableHead className="text-right hidden lg:table-cell">التيم ليدر</TableHead>
                                <TableHead className="text-right hidden xl:table-cell">المصمم</TableHead>
                                <TableHead className="text-center">الحالة</TableHead>
                                <TableHead className="text-center hidden lg:table-cell">الأولوية</TableHead>
                                <TableHead className="text-center hidden xl:table-cell">التاريخ</TableHead>
                                <TableHead className="text-left">إجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                                        لا توجد مهام مطابقة
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tasks.map((task: any) => (
                                    <TableRow key={task.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span className="line-clamp-1">{task.title}</span>
                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{task.description}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <DepartmentBadge department={task.department} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium line-clamp-1">{task.project?.name || 'بدون مشروع'}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {task.project?.client?.name || task.project?.client?.company || '-'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="flex items-center gap-2">
                                                {task.creator?.avatar_url && (
                                                    <img src={task.creator.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                                                )}
                                                <span>{task.creator?.name || 'System'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden xl:table-cell">
                                            {task.assigned_user ? (
                                                <div className="flex items-center gap-2">
                                                    {task.assigned_user.avatar_url && (
                                                        <img src={task.assigned_user.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                                                    )}
                                                    <span>{task.assigned_user.name}</span>
                                                </div>
                                            ) : (
                                                <Badge variant="outline" className="opacity-50">غير معين</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <StatusBadge status={task.status} />
                                        </TableCell>
                                        <TableCell className="text-center hidden lg:table-cell">
                                            <PriorityBadge priority={task.priority} />
                                        </TableCell>
                                        <TableCell className="text-center text-sm text-gray-500 hidden xl:table-cell">
                                            {format(new Date(task.created_at), 'dd/MM/yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            {task.client_feedback && (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600 hover:bg-orange-50">
                                                            <FileText className="w-4 h-4 ml-1" />
                                                            <span className="hidden lg:inline">ملاحظات</span>
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-[90vw] sm:max-w-lg">
                                                        <DialogHeader>
                                                            <DialogTitle>ملاحظات التعديل من العميل</DialogTitle>
                                                            <DialogDescription>
                                                                الخاصة بمهمة: {task.title}
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="p-4 bg-orange-50 rounded-lg text-orange-900 border border-orange-100 min-h-[100px]">
                                                            {task.client_feedback}
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
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
                                    عرض {((currentPage - 1) * ROWS_PER_PAGE) + 1} - {Math.min(currentPage * ROWS_PER_PAGE, totalCount)} من {totalCount} مهمة
                                    {' '}(صفحة {currentPage} من {totalPages})
                                </span>
                                <span className="sm:hidden">
                                    {currentPage}/{totalPages}
                                </span>
                            </>
                        ) : (
                            'لا توجد نتائج'
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
                        {totalPages > 1 && Array.from({ length: Math.min(isSmallScreen ? 3 : 5, totalPages) }, (_, i) => {
                            const maxButtons = isSmallScreen ? 3 : 5
                            const startPage = Math.max(1, Math.min(currentPage - Math.floor(maxButtons / 2), totalPages - maxButtons + 1))
                            const page = startPage + i
                            if (page > totalPages) return null
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
                        })}
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
// Mobile Task Card — React.memo to prevent unnecessary re-renders
// ============================================

const MobileTaskCard = memo(function MobileTaskCard({ task }: { task: any }) {
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
                    <span className="text-muted-foreground">القسم:</span>
                    <DepartmentBadge department={task.department} />
                </div>
                {/* Priority */}
                <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">الأولوية:</span>
                    <PriorityBadge priority={task.priority} />
                </div>
                {/* Project */}
                <div className="flex items-center gap-1.5 col-span-2">
                    <span className="text-muted-foreground shrink-0">المشروع:</span>
                    <span className="truncate font-medium">{task.project?.name || 'بدون مشروع'}</span>
                </div>
                {/* Assigned */}
                <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">المصمم:</span>
                    <span className="truncate">{task.assigned_user?.name || 'غير معين'}</span>
                </div>
                {/* Date */}
                <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">التاريخ:</span>
                    <span>{format(new Date(task.created_at), 'dd/MM/yyyy')}</span>
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
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-orange-500 hover:text-orange-600 hover:bg-orange-50 px-2">
                                <FileText className="w-3.5 h-3.5 ml-1" />
                                ملاحظات
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[92vw] sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle className="text-base">ملاحظات التعديل</DialogTitle>
                                <DialogDescription className="text-xs">
                                    مهمة: {task.title}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="p-3 bg-orange-50 rounded-lg text-orange-900 border border-orange-100 min-h-[80px] text-sm">
                                {task.client_feedback}
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    )
})

// ============================================
// Sub-components — React.memo for render optimization
// ============================================

const StatusBadge = memo(function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        'new': 'bg-blue-100 text-blue-800 border-blue-200',
        'in_progress': 'bg-purple-100 text-purple-800 border-purple-200',
        'review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'revision': 'bg-red-100 text-red-800 border-red-200',
        'approved': 'bg-green-100 text-green-800 border-green-200',
        'rejected': 'bg-red-100 text-red-800 border-red-200',
        'completed': 'bg-gray-100 text-gray-800 border-gray-200',
    }

    const labels: Record<string, string> = {
        'new': 'جديدة',
        'in_progress': 'قيد التنفيذ',
        'review': 'مراجعة',
        'revision': 'تعديل مطلوب',
        'approved': 'معتمد',
        'rejected': 'مرفوض',
        'completed': 'مكتمل'
    }

    return (
        <Badge variant="outline" className={`${styles[status] || styles['new']} whitespace-nowrap text-[10px] sm:text-xs`}>
            {labels[status] || status}
        </Badge>
    )
})

const PriorityBadge = memo(function PriorityBadge({ priority }: { priority: string }) {
    const styles: Record<string, string> = {
        'urgent': 'bg-red-100 text-red-800 border-red-200',
        'high': 'bg-orange-100 text-orange-800 border-orange-200',
        'medium': 'bg-blue-100 text-blue-800 border-blue-200',
        'low': 'bg-slate-100 text-slate-600 border-slate-200',
    }

    const labels: Record<string, string> = {
        'urgent': 'عاجل',
        'high': 'عالي',
        'medium': 'متوسط',
        'low': 'منخفض',
    }

    return (
        <Badge variant="outline" className={`${styles[priority] || styles['medium']} whitespace-nowrap text-[10px] sm:text-xs`}>
            {labels[priority] || priority}
        </Badge>
    )
})

const DepartmentBadge = memo(function DepartmentBadge({ department }: { department: string | null }) {
    if (!department) {
        return <span className="text-[10px] sm:text-xs text-muted-foreground">—</span>
    }

    const config: Record<string, { label: string; className: string }> = {
        'content': { label: 'محتوى', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
        'photography': { label: 'تصوير', className: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
    }

    const c = config[department] || { label: department, className: 'bg-gray-100 text-gray-800 border-gray-200' }

    return (
        <Badge variant="outline" className={`${c.className} whitespace-nowrap text-[10px] sm:text-xs`}>
            {c.label}
        </Badge>
    )
})
