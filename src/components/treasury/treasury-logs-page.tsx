'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Filter, Activity } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'

import { useTreasuryLogs, useTreasuryActivityStats } from '@/hooks/use-treasury-logs'
import { useClients } from '@/hooks/use-clients'
import { useUsers } from '@/hooks/use-users'
import { cn } from '@/lib/utils'

// Define action types based on schema
const ACTION_TYPES = [
    'create',
    'update',
    'delete',
    'approve',
    'reject',
] as const

// ============================================
// Component
// ============================================

export function TreasuryLogsPage() {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const [actionFilter, setActionFilter] = useState<string>('')
    const [clientFilter, setClientFilter] = useState<string>('')
    const [userFilter, setUserFilter] = useState<string>('')
    const [dateFrom, setDateFrom] = useState<Date | undefined>()
    const [dateTo, setDateTo] = useState<Date | undefined>()

    const { data: logs, isLoading } = useTreasuryLogs({
        action: actionFilter || undefined,
        clientId: clientFilter || undefined,
        performedBy: userFilter || undefined,
        startDate: dateFrom?.toISOString(),
        endDate: dateTo?.toISOString(),
    })

    const { data: stats } = useTreasuryActivityStats(dateFrom?.toISOString(), dateTo?.toISOString())
    const { data: clients } = useClients()
    const { data: users } = useUsers()

    const clearFilters = () => {
        setActionFilter('')
        setClientFilter('')
        setUserFilter('')
        setDateFrom(undefined)
        setDateTo(undefined)
    }

    const getActionLabel = (action: string) => {
        const labels: Record<string, { ar: string; en: string }> = {
            create: { ar: 'إنشاء', en: 'Created' },
            update: { ar: 'تعديل', en: 'Updated' },
            delete: { ar: 'حذف', en: 'Deleted' },
            approve: { ar: 'موافقة', en: 'Approved' },
            reject: { ar: 'رفض', en: 'Rejected' },
        }
        return isAr ? labels[action]?.ar || action : labels[action]?.en || action
    }

    const getActionVariant = (action: string): 'default' | 'secondary' | 'destructive' => {
        if (action === 'delete' || action === 'reject') return 'destructive'
        if (action === 'create' || action === 'approve') return 'default'
        return 'secondary'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    {isAr ? 'سجل العمليات' : 'Treasury Logs'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {isAr
                        ? 'عرض جميع عمليات الخزينة والمعاملات المالية'
                        : 'View all treasury operations and financial transactions'
                    }
                </p>
            </div>

            {/* Activity Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">
                                {isAr ? 'إجمالي العمليات' : 'Total Operations'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {isAr ? 'جميع الأوقات' : 'All time'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">
                                {isAr ? 'عمليات الإنشاء' : 'Created'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-cyan-500">
                                {stats.creates || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {isAr ? 'عمليات جديدة' : 'New operations'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">
                                {isAr ? 'الموافقات' : 'Approvals'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">
                                {stats.approvals || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {isAr ? 'معاملات معتمدة' : 'Approved transactions'}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            <CardTitle className="text-base">
                                {isAr ? 'فلاتر البحث' : 'Search Filters'}
                            </CardTitle>
                        </div>
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            {isAr ? 'مسح الفلاتر' : 'Clear Filters'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Action Filter */}
                        <Select value={actionFilter || '__all__'} onValueChange={(v) => setActionFilter(v === '__all__' ? '' : v)}>
                            <SelectTrigger>
                                <SelectValue placeholder={isAr ? 'نوع العملية' : 'Action Type'} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">{isAr ? 'الكل' : 'All'}</SelectItem>
                                {ACTION_TYPES.map((action) => (
                                    <SelectItem key={action} value={action}>
                                        {getActionLabel(action)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Client Filter */}
                        <Select value={clientFilter || '__all__'} onValueChange={(v) => setClientFilter(v === '__all__' ? '' : v)}>
                            <SelectTrigger>
                                <SelectValue placeholder={isAr ? 'العميل' : 'Client'} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">{isAr ? 'الكل' : 'All'}</SelectItem>
                                {clients?.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {(client as any).user?.name || client.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* User Filter (Admin/Accountant only) */}
                        <Select value={userFilter || '__all__'} onValueChange={(v) => setUserFilter(v === '__all__' ? '' : v)}>
                            <SelectTrigger>
                                <SelectValue placeholder={isAr ? 'المستخدم (محاسب/مدير)' : 'User (Accountant/Admin)'} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">{isAr ? 'الكل' : 'All'}</SelectItem>
                                {users?.filter(u => u.role === 'admin' || u.role === 'accountant').map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name || user.email} ({user.role})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Date Range */}
                        <div className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'justify-start text-left font-normal flex-1 px-2',
                                            !dateFrom && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="me-2 h-4 w-4" />
                                        {dateFrom ? format(dateFrom, 'PP') : (isAr ? 'من' : 'From')}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dateFrom}
                                        onSelect={setDateFrom}
                                        initialFocus
                                        disabled={(date) => dateTo ? date > dateTo : false}
                                    />
                                </PopoverContent>
                            </Popover>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'justify-start text-left font-normal flex-1 px-2',
                                            !dateTo && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="me-2 h-4 w-4" />
                                        {dateTo ? format(dateTo, 'PP') : (isAr ? 'إلى' : 'To')}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dateTo}
                                        onSelect={setDateTo}
                                        initialFocus
                                        disabled={(date) => dateFrom ? date < dateFrom : false}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>{isAr ? 'العملية' : 'Action'}</TableHead>
                            <TableHead>{isAr ? 'المستخدم' : 'User'}</TableHead>
                            <TableHead>{isAr ? 'العميل' : 'Client'}</TableHead>
                            <TableHead>{isAr ? 'المعاملة' : 'Transaction'}</TableHead>
                            <TableHead>{isAr ? 'التاريخ' : 'Date'}</TableHead>
                            <TableHead className="text-center">{isAr ? 'التفاصيل' : 'Details'}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    {isAr ? 'جاري التحميل...' : 'Loading...'}
                                </TableCell>
                            </TableRow>
                        ) : !logs || logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    {isAr ? 'لا توجد سجلات' : 'No logs found'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        <Badge variant={getActionVariant(log.action)}>
                                            {getActionLabel(log.action)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {log.performer?.name || log.performer?.email || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {log.client?.user?.name || log.client?.name || '-'}
                                    </TableCell>
                                    <TableCell>
                                        {log.transaction_id ? (
                                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                                {log.transaction_id.slice(0, 8)}...
                                            </code>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {log.created_at ? format(new Date(log.created_at), 'PPp') : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {log.changes && (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                                                        <Activity className="h-4 w-4" />
                                                        <span className="sr-only">{isAr ? 'عرض التفاصيل' : 'View Details'}</span>
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[600px]">
                                                    <DialogHeader>
                                                        <DialogTitle className="flex items-center gap-2">
                                                            <Activity className="h-5 w-5 text-primary" />
                                                            {isAr ? 'تفاصيل العملية' : 'Operation Details'}
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            {isAr
                                                                ? 'التفاصيل الكاملة والتغييرات التي تمت في هذه العملية'
                                                                : 'Full details and changes made in this operation'
                                                            }
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div className="space-y-1">
                                                                <span className="text-muted-foreground">{isAr ? 'نوع العملية' : 'Action Type'}</span>
                                                                <div className="font-medium">
                                                                    <Badge variant={getActionVariant(log.action)}>
                                                                        {getActionLabel(log.action)}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-muted-foreground">{isAr ? 'بواسطة' : 'Performed By'}</span>
                                                                <div className="font-medium">{log.performer?.name || log.performer?.email || 'N/A'}</div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-muted-foreground">{isAr ? 'العميل' : 'Client'}</span>
                                                                <div className="font-medium">{log.client?.user?.name || log.client?.name || '-'}</div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-muted-foreground">{isAr ? 'التاريخ' : 'Date'}</span>
                                                                <div className="font-medium">{log.created_at ? format(new Date(log.created_at), 'PPp') : 'N/A'}</div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <span className="text-sm font-medium text-muted-foreground">
                                                                {isAr ? 'بيانات التغييرات (JSON)' : 'Changes Data (JSON)'}
                                                            </span>
                                                            <div className="relative rounded-md border bg-muted/50 p-4 font-mono text-xs">
                                                                <div className="absolute right-2 top-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6"
                                                                        onClick={() => navigator.clipboard.writeText(JSON.stringify(log.changes, null, 2))}
                                                                    >
                                                                        <span className="sr-only">Copy</span>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                                                    </Button>
                                                                </div>
                                                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                                                    <pre className="whitespace-pre-wrap break-all">
                                                                        {JSON.stringify(log.changes, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                        </div>
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
        </div>
    )
}
