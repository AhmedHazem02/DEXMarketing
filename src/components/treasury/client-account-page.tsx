'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { format } from 'date-fns'
import { Package as PackageIcon, Calendar } from 'lucide-react'

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useMyClientAccounts } from '@/hooks/use-client-accounts'
import { useCurrentUser } from '@/hooks/use-users'
import { getCategoryLabel } from '@/lib/constants/treasury'
import { cn } from '@/lib/utils'

// ============================================
// Component
// ============================================

export function ClientAccountPage() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const { data: currentUser } = useCurrentUser()

    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)

    // Fetch client accounts for current user (resolves user_id -> client_id internally)
    const { data: clientAccounts, isLoading } = useMyClientAccounts()

    // Auto-select account when data loads
    useEffect(() => {
        if (clientAccounts && clientAccounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(clientAccounts[0].id)
        }
    }, [clientAccounts, selectedAccountId])

    const selectedAccount = clientAccounts?.find(acc => acc.id === selectedAccountId)

    // Filter transactions: only approved and visible to client
    const visibleTransactions = selectedAccount?.transactions?.filter(
        tx => tx.is_approved && tx.visible_to_client
    ) || []

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">
                    {isAr ? 'جاري التحميل...' : 'Loading...'}
                </p>
            </div>
        )
    }

    if (!clientAccounts || clientAccounts.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <PackageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">
                        {isAr ? 'لا توجد باقات مشتركة' : 'No Active Packages'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isAr
                            ? 'لم تشترك في أي باقة بعد، تواصل مع الإدارة للاشتراك'
                            : 'You haven\'t subscribed to any package yet, contact admin'
                        }
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    {isAr ? 'حسابي' : 'My Account'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {isAr
                        ? 'عرض تفاصيل الباقات والمعاملات المالية الخاصة بك'
                        : 'View your package details and financial transactions'
                    }
                </p>
            </div>

            {/* Package Selector (if multiple packages) */}
            {clientAccounts.length > 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            {isAr ? 'اختر الباقة' : 'Select Package'}
                        </CardTitle>
                        <CardDescription>
                            {isAr
                                ? 'لديك عدة باقات مشتركة، اختر باقة لعرض تفاصيلها'
                                : 'You have multiple active packages, select one to view details'
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Select
                            value={selectedAccountId || undefined}
                            onValueChange={setSelectedAccountId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={isAr ? 'اختر باقة' : 'Select package'} />
                            </SelectTrigger>
                            <SelectContent>
                                {clientAccounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                        <div className="flex items-center gap-2">
                                            <span>
                                                {isAr
                                                    ? (account.package_name_ar || account.package_name)
                                                    : account.package_name
                                                }
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                ({account.package_price?.toLocaleString()} ج.م)
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            )}

            {/* Package Details */}
            {selectedAccount && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {isAr ? 'الباقة المشتركة' : 'Subscribed Package'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <PackageIcon className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-semibold">
                                        {isAr
                                            ? (selectedAccount.package_name_ar || selectedAccount.package_name)
                                            : selectedAccount.package_name
                                        }
                                    </p>
                                    {selectedAccount.package_description && (
                                        <p className="text-xs text-muted-foreground">
                                            {isAr
                                                ? (selectedAccount.package_description_ar || selectedAccount.package_description)
                                                : selectedAccount.package_description
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {isAr ? 'سعر الباقة' : 'Package Price'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-primary select-none">ج.م</span>
                                <div>
                                    <p className="text-2xl font-bold text-primary">
                                        {selectedAccount.package_price?.toLocaleString()} ج.م
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {selectedAccount.package_duration_days} {isAr ? 'يوم' : 'days'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {isAr ? 'الرصيد المتبقي' : 'Remaining Balance'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-primary select-none">ج.م</span>
                                <div>
                                    <p
                                        className={cn(
                                            'text-2xl font-bold',
                                            selectedAccount.remaining_balance < 0 && 'text-destructive',
                                            selectedAccount.remaining_balance === 0 && 'text-muted-foreground',
                                            selectedAccount.remaining_balance > 0 && 'text-primary'
                                        )}
                                    >
                                        {selectedAccount.remaining_balance?.toLocaleString()} ج.م
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {isAr
                                            ? (selectedAccount.remaining_balance < 0 ? 'دين' : 'رصيد متاح')
                                            : (selectedAccount.remaining_balance < 0 ? 'Debt' : 'Available')
                                        }
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Transactions Table */}
            {selectedAccount && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {isAr ? 'المعاملات المالية' : 'Financial Transactions'}
                        </CardTitle>
                        <CardDescription>
                            {isAr
                                ? 'جميع المعاملات المعتمدة المرتبطة بحسابك'
                                : 'All approved transactions related to your account'
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {visibleTransactions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {isAr ? 'لا توجد معاملات معتمدة' : 'No approved transactions'}
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
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visibleTransactions.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell>
                                                <Badge variant={tx.type === 'income' ? 'default' : 'destructive'}>
                                                    {tx.type === 'income'
                                                        ? (isAr ? 'دخل' : 'Income')
                                                        : (isAr ? 'صرف' : 'Expense')
                                                    }
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">
                                                    {getCategoryLabel(tx.category, isAr)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {tx.description || '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs text-muted-foreground">
                                                    {tx.transaction_date ? format(new Date(tx.transaction_date), 'PP') : 'N/A'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-end">
                                                <span
                                                    className={cn(
                                                        'font-semibold',
                                                        tx.type === 'income' ? 'text-primary' : 'text-red-600'
                                                    )}
                                                >
                                                    {tx.type === 'income' ? '+' : '-'}
                                                    {tx.amount.toLocaleString()} ج.م
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
