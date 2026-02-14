'use client'

import { useState, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
} from '@tanstack/react-table'
import {
    ArrowUpDown,
    ChevronDown,
    Eye,
    MoreHorizontal,
    Plus,
    Search,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { useTasksKanban } from '@/hooks/use-tasks'
import { KANBAN_COLUMNS, PRIORITY_CONFIG, type TaskWithRelations } from '@/types/task'
import type { TaskStatus } from '@/types/database'
import { cn } from '@/lib/utils'

interface TasksTableProps {
    projectId?: string
    onTaskClick?: (task: TaskWithRelations) => void
    onCreateTask?: () => void
}

export function TasksTable({ projectId, onTaskClick, onCreateTask }: TasksTableProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [globalFilter, setGlobalFilter] = useState('')

    // Fetch tasks
    const { data: tasksByStatus, isLoading } = useTasksKanban(projectId)

    // Flatten tasks from all statuses
    const tasks = useMemo(() => {
        if (!tasksByStatus) return []
        return Object.values(tasksByStatus).flat()
    }, [tasksByStatus])

    // Columns definition
    const columns: ColumnDef<TaskWithRelations>[] = useMemo(
        () => [
            {
                accessorKey: 'title',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                            className="h-full px-4"
                        >
                            {isAr ? 'العنوان' : 'Title'}
                            <ArrowUpDown className="ms-2 h-4 w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => {
                    const task = row.original
                    return (
                        <div className="max-w-[300px] px-4">
                            <div className="font-medium truncate">{task.title}</div>
                            {task.description && (
                                <div className="text-sm text-muted-foreground truncate">
                                    {task.description}
                                </div>
                            )}
                        </div>
                    )
                },
            },
            {
                accessorKey: 'status',
                header: () => (
                    <div className="flex items-center">
                        {isAr ? 'الحالة' : 'Status'}
                    </div>
                ),
                cell: ({ row }) => {
                    const status = row.getValue('status') as TaskStatus
                    const config = KANBAN_COLUMNS.find((col) => col.id === status)
                    return (
                        <div className="flex items-center">
                            <Badge className={cn('whitespace-nowrap', config?.bgColor, config?.color)}>
                                {isAr ? config?.titleAr : config?.title}
                            </Badge>
                        </div>
                    )
                },
                filterFn: (row, id, value) => {
                    return value.includes(row.getValue(id))
                },
            },
            {
                accessorKey: 'priority',
                header: () => (
                    <div className="flex items-center">
                        {isAr ? 'الأولوية' : 'Priority'}
                    </div>
                ),
                cell: ({ row }) => {
                    const priority = row.getValue('priority') as string
                    const config = PRIORITY_CONFIG.find((p) => p.id === priority)
                    return (
                        <div className="flex items-center">
                            <Badge variant="outline" className={cn('whitespace-nowrap', config?.bgColor, config?.color)}>
                                {isAr ? config?.labelAr : config?.label}
                            </Badge>
                        </div>
                    )
                },
                filterFn: (row, id, value) => {
                    return value.includes(row.getValue(id))
                },
            },
            {
                accessorKey: 'assigned_user',
                header: () => (
                    <div className="flex items-center">
                        {isAr ? 'معين إلى' : 'Assigned To'}
                    </div>
                ),
                cell: ({ row }) => {
                    const user = row.original.assigned_user
                    if (!user) {
                        return (
                            <div className="flex items-center">
                                <span className="text-muted-foreground text-sm">{isAr ? 'غير معين' : 'Unassigned'}</span>
                            </div>
                        )
                    }
                    return (
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar_url ?? undefined} />
                                <AvatarFallback className="text-xs">
                                    {(user.name ?? 'U').charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate max-w-[120px]">{user.name}</span>
                        </div>
                    )
                },
            },
            {
                accessorKey: 'client',
                header: () => (
                    <div className="flex items-center">
                        {isAr ? 'العميل' : 'Client'}
                    </div>
                ),
                cell: ({ row }) => {
                    const client = row.original.client
                    if (!client) {
                        return (
                            <div className="flex items-center">
                                <span className="text-muted-foreground text-sm">-</span>
                            </div>
                        )
                    }
                    return (
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-xs text-indigo-500">
                                {(client.company || client.name).charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm truncate max-w-[120px]">
                                {client.company || client.name}
                            </span>
                        </div>
                    )
                },
            },
            {
                accessorKey: 'deadline',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                            className="h-full px-4"
                        >
                            {isAr ? 'الموعد النهائي' : 'Deadline'}
                            <ArrowUpDown className="ms-2 h-4 w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => {
                    const deadline = row.getValue('deadline') as string | null
                    if (!deadline) {
                        return (
                            <div className="flex items-center px-4">
                                <span className="text-muted-foreground text-sm">-</span>
                            </div>
                        )
                    }
                    const date = new Date(deadline)
                    const isOverdue = date < new Date()
                    return (
                        <div className="flex items-center px-4">
                            <span className={cn('text-sm', isOverdue && 'text-red-500 font-medium')}>
                                {format(date, 'MMM d, yyyy', { locale: isAr ? ar : enUS })}
                            </span>
                        </div>
                    )
                },
            },
            {
                accessorKey: 'created_at',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                            className="h-full px-4"
                        >
                            {isAr ? 'تاريخ الإنشاء' : 'Created'}
                            <ArrowUpDown className="ms-2 h-4 w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => {
                    const date = new Date(row.getValue('created_at'))
                    return (
                        <div className="flex items-center px-4">
                            <span className="text-sm text-muted-foreground">
                                {format(date, 'MMM d', { locale: isAr ? ar : enUS })}
                            </span>
                        </div>
                    )
                },
            },
            {
                id: 'actions',
                header: () => <div className="w-[70px] text-center"></div>,
                cell: ({ row }) => {
                    const task = row.original
                    return (
                        <div className="flex items-center justify-center">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">القائمة</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>{isAr ? 'الإجراءات' : 'Actions'}</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => onTaskClick?.(task)}>
                                        <Eye className="me-2 h-4 w-4" />
                                        {isAr ? 'عرض التفاصيل' : 'View Details'}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )
                },
            },
        ],
        [isAr, onTaskClick]
    )

    const table = useReactTable({
        data: tasks,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize: 20,
            },
        },
    })

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-1">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={isAr ? 'ابحث في المهام...' : 'Search tasks...'}
                            value={globalFilter ?? ''}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="ps-9"
                        />
                    </div>

                    {/* Status Filter */}
                    <Select
                        value={(table.getColumn('status')?.getFilterValue() as string) ?? 'all'}
                        onValueChange={(value) =>
                            table.getColumn('status')?.setFilterValue(value === 'all' ? undefined : [value])
                        }
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder={isAr ? 'الحالة' : 'Status'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
                            {KANBAN_COLUMNS.map((col) => (
                                <SelectItem key={col.id} value={col.id}>
                                    {isAr ? col.titleAr : col.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Priority Filter */}
                    <Select
                        value={(table.getColumn('priority')?.getFilterValue() as string) ?? 'all'}
                        onValueChange={(value) =>
                            table.getColumn('priority')?.setFilterValue(value === 'all' ? undefined : [value])
                        }
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder={isAr ? 'الأولوية' : 'Priority'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
                            {PRIORITY_CONFIG.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                    {isAr ? p.labelAr : p.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    {/* Column Visibility */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                {isAr ? 'الأعمدة' : 'Columns'}
                                <ChevronDown className="ms-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Create Task Button */}
                    <Button onClick={onCreateTask}>
                        <Plus className="h-4 w-4 me-2" />
                        {isAr ? 'مهمة جديدة' : 'New Task'}
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="h-12">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => onTaskClick?.(row.original)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="h-16">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    {isAr ? 'لا توجد مهام' : 'No tasks found'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    {isAr
                        ? `عرض ${table.getFilteredRowModel().rows.length} من ${tasks.length} مهمة`
                        : `Showing ${table.getFilteredRowModel().rows.length} of ${tasks.length} tasks`}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        {isAr ? 'السابق' : 'Previous'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        {isAr ? 'التالي' : 'Next'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
