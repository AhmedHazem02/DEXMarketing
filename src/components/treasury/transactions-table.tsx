'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useTransactions } from '@/hooks/use-treasury'
import { ArrowUpRight, ArrowDownLeft, MoreHorizontal, FileText, Search, Filter } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export function TransactionsTable() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const [search, setSearch] = useState('')

    const { data: transactions, isLoading } = useTransactions({ limit: 50 })

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
            </div>
        )
    }

    const filteredTransactions = transactions?.filter(t =>
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.category?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={isAr ? 'بحث في المعاملات...' : 'Search transactions...'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="ps-10"
                    />
                </div>
                <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{isAr ? 'المعاملة' : 'Transaction'}</TableHead>
                            <TableHead>{isAr ? 'الفئة' : 'Category'}</TableHead>
                            <TableHead>{isAr ? 'التاريخ' : 'Date'}</TableHead>
                            <TableHead className="text-end">{isAr ? 'المبلغ' : 'Amount'}</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTransactions?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                    {isAr ? 'لا توجد معاملات' : 'No transactions found'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTransactions?.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className={`
                                                w-9 h-9 rounded-full flex items-center justify-center
                                                ${tx.type === 'income' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}
                                            `}>
                                                {tx.type === 'income' ? (
                                                    <ArrowDownLeft className="h-5 w-5" />
                                                ) : (
                                                    <ArrowUpRight className="h-5 w-5" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{tx.description}</p>
                                                {tx.receipt_url && (
                                                    <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                                                        <FileText className="h-3 w-3 me-1" />
                                                        {isAr ? 'مرفق إيصال' : 'Receipt attached'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-normal">
                                            {tx.category || 'General'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-muted-foreground text-sm">
                                            {format(new Date(tx.created_at), 'PPP', { locale: isAr ? ar : enUS })}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-end font-semibold">
                                        <span className={tx.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                                            {tx.type === 'income' ? '+' : '-'}
                                            ${tx.amount.toLocaleString()}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>
                                                    {isAr ? 'عرض الإيصال' : 'View Receipt'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">
                                                    {isAr ? 'حذف' : 'Delete'}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
