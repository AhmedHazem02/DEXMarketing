'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { format } from 'date-fns'
import { Loader2, Check, Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

import { useApproveTransaction } from '@/hooks/use-treasury'
import { getCategoryLabel } from '@/lib/constants/treasury'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/types/database'

// ============================================
// Component
// ============================================

interface ApproveTransactionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    transaction: Transaction | null
}

export function ApproveTransactionDialog({ 
    open, 
    onOpenChange, 
    transaction 
}: ApproveTransactionDialogProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const [visibleToClient, setVisibleToClient] = useState(true)

    const approveTransaction = useApproveTransaction()

    const handleApprove = async () => {
        if (!transaction) return

        try {
            await approveTransaction.mutateAsync({
                transactionId: transaction.id,
                visibleToClient,
            })
            onOpenChange(false)
        } catch (error) {
            console.error('Failed to approve transaction:', error)
        }
    }

    const isLoading = approveTransaction.isPending

    if (!transaction) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>
                        {isAr ? 'الموافقة على المعاملة' : 'Approve Transaction'}
                    </DialogTitle>
                    <DialogDescription>
                        {isAr
                            ? 'راجع تفاصيل المعاملة ووافق عليها لتظهر للعميل'
                            : 'Review transaction details and approve to make it visible'
                        }
                    </DialogDescription>
                </DialogHeader>

                {/* Transaction Details */}
                <div className="space-y-4 py-4">
                    {/* Type & Category */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            {isAr ? 'النوع' : 'Type'}
                        </span>
                        <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                            {transaction.type === 'income'
                                ? (isAr ? 'إيراد' : 'Income')
                                : (isAr ? 'مصروف' : 'Expense')
                            }
                        </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            {isAr ? 'التصنيف' : 'Category'}
                        </span>
                        <span className="text-sm font-medium">
                            {getCategoryLabel(transaction.category, isAr)}
                        </span>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            {isAr ? 'المبلغ' : 'Amount'}
                        </span>
                        <span className={cn(
                            'text-lg font-bold',
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        )}>
                            {transaction.type === 'income' ? '+' : '-'}
                            {transaction.amount.toLocaleString()} ج.م
                        </span>
                    </div>

                    {/* Description */}
                    {transaction.description && (
                        <div className="flex items-start justify-between gap-4">
                            <span className="text-sm text-muted-foreground">
                                {isAr ? 'الوصف' : 'Description'}
                            </span>
                            <span className="text-sm text-end">
                                {transaction.description}
                            </span>
                        </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            {isAr ? 'التاريخ' : 'Date'}
                        </span>
                        <span className="text-sm">
                            {transaction.transaction_date 
                                ? format(new Date(transaction.transaction_date), 'PP')
                                : format(new Date(transaction.created_at), 'PP')
                            }
                        </span>
                    </div>

                    {/* Visibility Toggle */}
                    <div className="flex items-center justify-between rounded-lg border p-3 mt-4">
                        <div className="flex items-center gap-2">
                            {visibleToClient ? (
                                <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                            )}
                            <Label htmlFor="visible-toggle" className="cursor-pointer">
                                {isAr ? 'مرئي للعميل' : 'Visible to Client'}
                            </Label>
                        </div>
                        <Switch
                            id="visible-toggle"
                            checked={visibleToClient}
                            onCheckedChange={setVisibleToClient}
                        />
                    </div>

                    {!visibleToClient && (
                        <p className="text-xs text-muted-foreground">
                            {isAr
                                ? 'المعاملة ستكون معتمدة لكن لن تظهر للعميل في حسابه'
                                : 'Transaction will be approved but won\'t appear in client\'s account'
                            }
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        {isAr ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button 
                        onClick={handleApprove} 
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isLoading ? (
                            <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Check className="me-2 h-4 w-4" />
                        )}
                        {isAr ? 'موافقة' : 'Approve'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
