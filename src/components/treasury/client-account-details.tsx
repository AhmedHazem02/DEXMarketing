'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { format } from 'date-fns'
import {
    Package as PackageIcon,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    User,
    Building2,
    Pencil,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

import { getCategoryLabel } from '@/lib/constants/treasury'
import { cn } from '@/lib/utils'
import { EditTransactionDialog } from './edit-transaction-dialog'
import type { ClientAccountWithRelations, Transaction } from '@/types/database'

// ============================================
// Component
// ============================================

interface ClientAccountDetailsProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    account: ClientAccountWithRelations | null
}

export function ClientAccountDetails({
    open,
    onOpenChange,
    account
}: ClientAccountDetailsProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const [editTransaction, setEditTransaction] = useState<Transaction | null>(null)

    if (!account) return null

    // Get client name
    const clientName = (account.client as any)?.user?.name ||
        account.client?.name ||
        'N/A'

    const packageName = isAr
        ? (account.package_name_ar || account.package_name)
        : account.package_name

    const packagePrice = account.package_price || 0
    const remainingBalance = account.remaining_balance || 0

    // Calculate total spent
    const totalSpent = packagePrice - remainingBalance

    // Sort transactions by date (newest first)
    const transactions = [...(account.transactions || [])].sort((a, b) => {
        const dateA = new Date(a.transaction_date || a.created_at)
        const dateB = new Date(b.transaction_date || b.created_at)
        return dateB.getTime() - dateA.getTime()
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {clientName}
                    </DialogTitle>
                    <DialogDescription>
                        {isAr ? 'تفاصيل حساب العميل والمعاملات' : 'Client account details and transactions'}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-150px)]">
                    <div className="space-y-6 pe-4">
                        {/* Client Info */}
                        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Building2 className="h-4 w-4" />
                                    {account.client?.name || '-'}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    {isAr ? 'تاريخ البدء:' : 'Started:'}{' '}
                                    {account.start_date
                                        ? format(new Date(account.start_date), 'PP')
                                        : '-'
                                    }
                                </div>
                            </div>
                            <Badge variant={account.is_active ? 'default' : 'secondary'}>
                                {account.is_active
                                    ? (isAr ? 'نشط' : 'Active')
                                    : (isAr ? 'غير نشط' : 'Inactive')
                                }
                            </Badge>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-3 gap-4">
                            {/* Package */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-medium text-muted-foreground">
                                        {isAr ? 'الباقة' : 'Package'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        <PackageIcon className="h-4 w-4 text-primary" />
                                        <span className="font-semibold text-sm">{packageName}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {packagePrice.toLocaleString()} ج.م
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Spent */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-medium text-muted-foreground">
                                        {isAr ? 'المستخدم' : 'Used'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                                        <span className="font-semibold text-red-600">
                                            {totalSpent.toLocaleString()} ج.م
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {packagePrice > 0 ? ((totalSpent / packagePrice) * 100).toFixed(0) : 0}%
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Remaining */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-medium text-muted-foreground">
                                        {isAr ? 'المتبقي' : 'Remaining'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-green-500 select-none">ج.م</span>
                                        <span className={cn(
                                            'font-semibold',
                                            remainingBalance < 0 && 'text-red-600',
                                            remainingBalance >= 0 && 'text-green-600'
                                        )}>
                                            {remainingBalance.toLocaleString()} ج.م
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {remainingBalance < 0
                                            ? (isAr ? 'دين' : 'Debt')
                                            : (isAr ? 'رصيد متاح' : 'Available')
                                        }
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <Separator />

                        {/* Transactions Table */}
                        <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {isAr ? 'سجل المعاملات' : 'Transaction History'}
                                <Badge variant="outline" className="ms-2">
                                    {transactions.length}
                                </Badge>
                            </h3>

                            {transactions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    {isAr ? 'لا توجد معاملات' : 'No transactions'}
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>{isAr ? 'النوع' : 'Type'}</TableHead>
                                            <TableHead>{isAr ? 'التصنيف' : 'Category'}</TableHead>
                                            <TableHead>{isAr ? 'الوصف' : 'Description'}</TableHead>
                                            <TableHead>{isAr ? 'التاريخ' : 'Date'}</TableHead>
                                            <TableHead className="text-end">{isAr ? 'المبلغ' : 'Amount'}</TableHead>
                                            <TableHead>{isAr ? 'الحالة' : 'Status'}</TableHead>
                                            <TableHead className="w-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map((tx) => (
                                            <TableRow key={tx.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        {tx.type === 'income' ? (
                                                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                                                        )}
                                                        <span className="text-xs">
                                                            {tx.type === 'income'
                                                                ? (isAr ? 'إيراد' : 'Income')
                                                                : (isAr ? 'مصروف' : 'Expense')
                                                            }
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs">
                                                        {getCategoryLabel(tx.category, isAr)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs text-muted-foreground line-clamp-1">
                                                        {tx.description || '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs text-muted-foreground">
                                                        {tx.transaction_date
                                                            ? format(new Date(tx.transaction_date), 'PP')
                                                            : format(new Date(tx.created_at), 'PP')
                                                        }
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-end">
                                                    <span className={cn(
                                                        'font-semibold text-sm',
                                                        tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                                                    )}>
                                                        {tx.type === 'income' ? '+' : '-'}
                                                        {tx.amount.toLocaleString()}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <Badge
                                                            variant={tx.is_approved ? 'default' : 'secondary'}
                                                            className="text-[10px] h-5"
                                                        >
                                                            {tx.is_approved
                                                                ? (isAr ? 'معتمد' : 'Approved')
                                                                : (isAr ? 'معلق' : 'Pending')
                                                            }
                                                        </Badge>
                                                        {tx.visible_to_client && (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[10px] h-5"
                                                            >
                                                                {isAr ? 'مرئي' : 'Visible'}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => setEditTransaction(tx)}
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>

            {/* Edit Transaction Dialog */}
            <EditTransactionDialog
                open={!!editTransaction}
                onOpenChange={(open) => !open && setEditTransaction(null)}
                transaction={editTransaction}
            />
        </Dialog>
    )
}
