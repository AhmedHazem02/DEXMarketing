'use client'

import { useState, useMemo } from 'react'
import { useAdminTasks } from '@/hooks/use-tasks'
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
    X
} from 'lucide-react'
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

const ROWS_PER_PAGE = 10

export function TasksManager() {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [date, setDate] = useState<DateRange | undefined>()
    const [currentPage, setCurrentPage] = useState(1)

    const { data: tasks, isLoading, error } = useAdminTasks({
        search: search.length > 2 ? search : undefined,
        status: statusFilter === 'all' ? undefined : statusFilter as any,
        dateFrom: date?.from?.toISOString(),
        dateTo: date?.to?.toISOString()
    })

    // Client-side filtering & Pagination (since API filters apply on fetch)
    // We rely on API for heavy filtering, but pagination is client-side for now

    const paginatedTasks = useMemo(() => {
        if (!tasks) return []
        const startIndex = (currentPage - 1) * ROWS_PER_PAGE
        return (tasks as any[]).slice(startIndex, startIndex + ROWS_PER_PAGE)
    }, [tasks, currentPage])

    const totalPages = tasks ? Math.ceil(tasks.length / ROWS_PER_PAGE) : 0

    const handleExportCSV = () => {
        if (!tasks) return

        const headers = ['Task Title', 'Project', 'Client', 'Team Leader', 'Designer', 'Status', 'Date', 'Feedback/Notes']
        const csvContent = [
            headers.join(','),
            ...(tasks as any[]).map(t => {
                const row = [
                    `"${t.title.replace(/"/g, '""')}"`,
                    `"${(t as any).project?.name || '-'}"`,
                    `"${(t as any).project?.client?.name || (t as any).project?.client?.company || '-'}"`,
                    `"${(t as any).creator?.name || '-'}"`, // Team Leader (Creator)
                    `"${(t as any).assigned_user?.name || 'Unassigned'}"`, // Designer
                    t.status,
                    format(new Date(t.created_at), 'yyyy-MM-dd'),
                    `"${(t.client_feedback || '').replace(/"/g, '""')}"`
                ]
                return row.join(',')
            })
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `tasks_export_${format(new Date(), 'yyyyMMdd')}.csv`)
        link.click()
    }

    if (isLoading) {
        return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    if (error) {
        return <div className="text-red-500 p-4 border border-red-200 rounded-lg bg-red-50">حدث خطأ أثناء تحميل البيانات.</div>
    }

    return (
        <Card>
            <CardContent className="p-6 space-y-6">
                {/* Header Controls */}
                <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full xl:w-auto flex-wrap">
                        {/* Search */}
                        <div className="relative w-full md:w-64">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="بحث عن مهمة..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pr-9"
                            />
                        </div>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="الحالة" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل الحالات</SelectItem>
                                <SelectItem value="new">جديدة</SelectItem>
                                <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                                <SelectItem value="review">مراجعة</SelectItem>
                                <SelectItem value="revision">تعديل مطلوب</SelectItem>
                                <SelectItem value="approved">معتمد</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Date Filter */}
                        <div className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-[240px] justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (
                                            date.to ? (
                                                <>
                                                    {format(date.from, "LLL dd, y")} -{" "}
                                                    {format(date.to, "LLL dd, y")}
                                                </>
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
                                        onSelect={setDate}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                            {date && (
                                <Button variant="ghost" size="icon" onClick={() => setDate(undefined)} title="حذف التاريخ">
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <Button variant="outline" onClick={handleExportCSV} disabled={!tasks || tasks.length === 0}>
                        <Download className="w-4 h-4 ml-2" />
                        تصدير (CSV)
                    </Button>
                </div>

                {/* Data Table */}
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">عنوان المهمة</TableHead>
                                <TableHead className="text-right">المشروع / العميل</TableHead>
                                <TableHead className="text-right">التيم ليدر</TableHead>
                                <TableHead className="text-right">المصمم (Designers)</TableHead>
                                <TableHead className="text-center">الحالة</TableHead>
                                <TableHead className="text-center">التاريخ</TableHead>
                                <TableHead className="text-left">إجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedTasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        لا توجد مهام مطابقة
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedTasks.map((task: any) => (
                                    <TableRow key={task.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{task.title}</span>
                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{task.description}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{task.project?.name || 'بدون مشروع'}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {task.project?.client?.name || task.project?.client?.company || 'عميل غير معروف'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {task.creator?.avatar_url && (
                                                    <img src={task.creator.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                                                )}
                                                <span>{task.creator?.name || 'System'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
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
                                        <TableCell className="text-center text-sm text-gray-500">
                                            {format(new Date(task.created_at), 'dd/MM/yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            {/* Show Revision Note if exists/needed */}
                                            {task.client_feedback && (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600 hover:bg-orange-50">
                                                            <FileText className="w-4 h-4 ml-1" />
                                                            ملاحظات التعديل
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
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
                    <div className="text-sm text-muted-foreground">
                        صفحة {currentPage} من {totalPages || 1}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage >= totalPages}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        'new': 'bg-blue-100 text-blue-800 border-blue-200',
        'in_progress': 'bg-purple-100 text-purple-800 border-purple-200',
        'review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'revision': 'bg-red-100 text-red-800 border-red-200',
        'approved': 'bg-green-100 text-green-800 border-green-200',
        'completed': 'bg-gray-100 text-gray-800 border-gray-200',
    }

    const labels: Record<string, string> = {
        'new': 'جديدة',
        'in_progress': 'قيد التنفيذ',
        'review': 'مراجعة',
        'revision': 'تعديل مطلوب',
        'approved': 'معتمد',
        'completed': 'مكتمل'
    }

    return (
        <Badge variant="outline" className={`${styles[status] || styles['new']} whitespace-nowrap`}>
            {labels[status] || status}
        </Badge>
    )
}
