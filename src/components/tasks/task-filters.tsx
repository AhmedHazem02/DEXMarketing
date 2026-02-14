'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { KANBAN_COLUMNS, PRIORITY_CONFIG } from '@/types/task'
import type { TaskFilters } from '@/types/task'
import type { TaskStatus, TaskPriority, Department, TaskType } from '@/types/database'

interface TaskFiltersProps {
    filters: TaskFilters
    onFiltersChange: (filters: TaskFilters) => void
    showDepartment?: boolean
    showTaskType?: boolean
    compact?: boolean
}

export function TaskFiltersComponent({
    filters,
    onFiltersChange,
    showDepartment = false,
    showTaskType = false,
    compact = false,
}: TaskFiltersProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const [searchValue, setSearchValue] = useState(filters.search || '')

    // Count active filters
    const activeFiltersCount = [
        filters.status && filters.status !== 'all',
        filters.priority && filters.priority !== 'all',
        filters.department && filters.department !== 'all',
        filters.task_type && filters.task_type !== 'all',
    ].filter(Boolean).length

    const handleSearchChange = (value: string) => {
        setSearchValue(value)
        onFiltersChange({ ...filters, search: value })
    }

    const handleFilterChange = (key: keyof TaskFilters, value: string) => {
        onFiltersChange({ ...filters, [key]: value === 'all' ? undefined : value })
    }

    const clearAllFilters = () => {
        setSearchValue('')
        onFiltersChange({})
    }

    if (compact) {
        return (
            <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={isAr ? 'بحث في المهام...' : 'Search tasks...'}
                            value={searchValue}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="ps-9"
                        />
                    </div>
                </div>

                {/* Filters Popover */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Filter className="h-4 w-4" />
                            {isAr ? 'فلتر' : 'Filters'}
                            {activeFiltersCount > 0 && (
                                <Badge variant="secondary" className="ms-1 px-1.5 h-5 min-w-5">
                                    {activeFiltersCount}
                                </Badge>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align={isAr ? 'start' : 'end'}>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">
                                    {isAr ? 'تصفية المهام' : 'Filter Tasks'}
                                </h4>
                                {activeFiltersCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearAllFilters}
                                        className="h-auto p-1 text-xs"
                                    >
                                        {isAr ? 'مسح الكل' : 'Clear all'}
                                    </Button>
                                )}
                            </div>

                            {/* Status Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {isAr ? 'الحالة' : 'Status'}
                                </label>
                                <Select
                                    value={filters.status || 'all'}
                                    onValueChange={(value) => handleFilterChange('status', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            {isAr ? 'كل الحالات' : 'All Statuses'}
                                        </SelectItem>
                                        {KANBAN_COLUMNS.map((col) => (
                                            <SelectItem key={col.id} value={col.id}>
                                                {isAr ? col.titleAr : col.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Priority Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {isAr ? 'الأولوية' : 'Priority'}
                                </label>
                                <Select
                                    value={filters.priority || 'all'}
                                    onValueChange={(value) => handleFilterChange('priority', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            {isAr ? 'كل الأولويات' : 'All Priorities'}
                                        </SelectItem>
                                        {PRIORITY_CONFIG.map((priority) => (
                                            <SelectItem key={priority.id} value={priority.id}>
                                                {isAr ? priority.labelAr : priority.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Department Filter */}
                            {showDepartment && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {isAr ? 'القسم' : 'Department'}
                                    </label>
                                    <Select
                                        value={filters.department || 'all'}
                                        onValueChange={(value) => handleFilterChange('department', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                {isAr ? 'كل الأقسام' : 'All Departments'}
                                            </SelectItem>
                                            <SelectItem value="photography">
                                                {isAr ? 'التصوير' : 'Photography'}
                                            </SelectItem>
                                            <SelectItem value="content">
                                                {isAr ? 'المحتوى' : 'Content'}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Task Type Filter */}
                            {showTaskType && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {isAr ? 'نوع المهمة' : 'Task Type'}
                                    </label>
                                    <Select
                                        value={filters.task_type || 'all'}
                                        onValueChange={(value) => handleFilterChange('task_type', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                {isAr ? 'كل الأنواع' : 'All Types'}
                                            </SelectItem>
                                            <SelectItem value="video">
                                                {isAr ? 'فيديو' : 'Video'}
                                            </SelectItem>
                                            <SelectItem value="photo">
                                                {isAr ? 'تصوير' : 'Photo'}
                                            </SelectItem>
                                            <SelectItem value="editing">
                                                {isAr ? 'مونتاج' : 'Editing'}
                                            </SelectItem>
                                            <SelectItem value="content">
                                                {isAr ? 'محتوى' : 'Content'}
                                            </SelectItem>
                                            <SelectItem value="general">
                                                {isAr ? 'عام' : 'General'}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="gap-2"
                    >
                        <X className="h-4 w-4" />
                        {isAr ? 'مسح' : 'Clear'}
                    </Button>
                )}
            </div>
        )
    }

    // Full layout (non-compact)
    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={isAr ? 'بحث في المهام...' : 'Search tasks...'}
                    value={searchValue}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="ps-9"
                />
            </div>

            {/* Filters Row */}
            <div className="flex items-center gap-3 flex-wrap">
                {/* Status */}
                <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => handleFilterChange('status', value)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={isAr ? 'الحالة' : 'Status'} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{isAr ? 'كل الحالات' : 'All Statuses'}</SelectItem>
                        {KANBAN_COLUMNS.map((col) => (
                            <SelectItem key={col.id} value={col.id}>
                                {isAr ? col.titleAr : col.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Priority */}
                <Select
                    value={filters.priority || 'all'}
                    onValueChange={(value) => handleFilterChange('priority', value)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={isAr ? 'الأولوية' : 'Priority'} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{isAr ? 'كل الأولويات' : 'All Priorities'}</SelectItem>
                        {PRIORITY_CONFIG.map((priority) => (
                            <SelectItem key={priority.id} value={priority.id}>
                                {isAr ? priority.labelAr : priority.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {showDepartment && (
                    <Select
                        value={filters.department || 'all'}
                        onValueChange={(value) => handleFilterChange('department', value)}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={isAr ? 'القسم' : 'Department'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{isAr ? 'كل الأقسام' : 'All Departments'}</SelectItem>
                            <SelectItem value="photography">{isAr ? 'التصوير' : 'Photography'}</SelectItem>
                            <SelectItem value="content">{isAr ? 'المحتوى' : 'Content'}</SelectItem>
                        </SelectContent>
                    </Select>
                )}

                {showTaskType && (
                    <Select
                        value={filters.task_type || 'all'}
                        onValueChange={(value) => handleFilterChange('task_type', value)}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={isAr ? 'نوع المهمة' : 'Task Type'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{isAr ? 'كل الأنواع' : 'All Types'}</SelectItem>
                            <SelectItem value="video">{isAr ? 'فيديو' : 'Video'}</SelectItem>
                            <SelectItem value="photo">{isAr ? 'تصوير' : 'Photo'}</SelectItem>
                            <SelectItem value="editing">{isAr ? 'مونتاج' : 'Editing'}</SelectItem>
                            <SelectItem value="content">{isAr ? 'محتوى' : 'Content'}</SelectItem>
                            <SelectItem value="general">{isAr ? 'عام' : 'General'}</SelectItem>
                        </SelectContent>
                    </Select>
                )}

                {activeFiltersCount > 0 && (
                    <Button variant="outline" onClick={clearAllFilters} className="gap-2">
                        <X className="h-4 w-4" />
                        {isAr ? 'مسح الفلاتر' : 'Clear Filters'}
                    </Button>
                )}
            </div>
        </div>
    )
}
