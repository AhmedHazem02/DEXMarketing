'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Switch } from '@/components/ui/switch'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
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

import { useUpdateTransaction } from '@/hooks/use-treasury'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type CategoryOption } from '@/lib/constants/treasury'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/types/database'

// ============================================
// Schema
// ============================================

const editTransactionSchema = z.object({
    type: z.enum(['income', 'expense']),
    category: z.string().min(1, 'Category is required'),
    sub_category: z.string().optional(),
    amount: z.number().min(0, 'Amount cannot be negative'),
    description: z.string().optional(),
    transaction_date: z.date().optional(),
    visible_to_client: z.boolean(),
    is_approved: z.boolean(),
})

type EditTransactionFormValues = z.infer<typeof editTransactionSchema>

// ============================================
// Component
// ============================================

interface EditTransactionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    transaction: Transaction | null
}

export function EditTransactionDialog({
    open,
    onOpenChange,
    transaction,
}: EditTransactionDialogProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    
    const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>(INCOME_CATEGORIES)

    const updateTransaction = useUpdateTransaction()

    const form = useForm<EditTransactionFormValues>({
        resolver: zodResolver(editTransactionSchema),
        defaultValues: {
            type: 'income',
            category: '',
            sub_category: '',
            amount: 0,
            description: '',
            transaction_date: undefined,
            visible_to_client: true,
            is_approved: true,
        },
    })

    const watchedType = form.watch('type')

    // Update categories when type changes
    useEffect(() => {
        if (watchedType === 'expense') {
            setAvailableCategories(EXPENSE_CATEGORIES)
        } else {
            setAvailableCategories(INCOME_CATEGORIES)
        }
    }, [watchedType])

    // Populate form when transaction changes
    useEffect(() => {
        if (transaction) {
            const txDate = transaction.transaction_date 
                ? new Date(transaction.transaction_date) 
                : transaction.created_at 
                    ? new Date(transaction.created_at)
                    : undefined

            form.reset({
                type: transaction.type,
                category: transaction.category || '',
                sub_category: transaction.sub_category || '',
                amount: transaction.amount,
                description: transaction.description || '',
                transaction_date: txDate,
                visible_to_client: transaction.visible_to_client ?? true,
                is_approved: transaction.is_approved ?? true,
            })

            // Set correct categories based on type
            if (transaction.type === 'expense') {
                setAvailableCategories(EXPENSE_CATEGORIES)
            } else {
                setAvailableCategories(INCOME_CATEGORIES)
            }
        }
    }, [transaction, form])

    const onSubmit = async (values: EditTransactionFormValues) => {
        if (!transaction) return

        try {
            await updateTransaction.mutateAsync({
                id: transaction.id,
                updates: {
                    type: values.type,
                    category: values.category,
                    sub_category: values.sub_category || null,
                    amount: values.amount,
                    description: values.description || null,
                    transaction_date: values.transaction_date 
                        ? values.transaction_date.toISOString().split('T')[0] 
                        : null,
                    visible_to_client: values.visible_to_client,
                    is_approved: values.is_approved,
                },
            })
            onOpenChange(false)
        } catch (error) {
            console.error('Form submission failed:', error)
        }
    }

    const isLoading = updateTransaction.isPending

    if (!transaction) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isAr ? 'تعديل المعاملة' : 'Edit Transaction'}
                    </DialogTitle>
                    <DialogDescription>
                        {isAr
                            ? 'تعديل بيانات المعاملة المالية'
                            : 'Edit financial transaction details'
                        }
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Type Selection */}
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isAr ? 'النوع' : 'Type'} *</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            field.onChange(value)
                                            form.setValue('category', '')
                                        }}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent position="popper">
                                            <SelectItem value="income">
                                                {isAr ? 'إيراد' : 'Income'}
                                            </SelectItem>
                                            <SelectItem value="expense">
                                                {isAr ? 'مصروف' : 'Expense'}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Category Selection */}
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isAr ? 'التصنيف' : 'Category'} *</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={isAr ? 'اختر التصنيف' : 'Select category'} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent position="popper">
                                            {availableCategories.map((cat) => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {isAr ? cat.label_ar : cat.label_en}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Amount */}
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isAr ? 'المبلغ' : 'Amount'} *</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder={isAr ? 'أدخل المبلغ' : 'Enter amount'}
                                            {...field}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isAr ? 'الوصف' : 'Description'}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={isAr ? 'أدخل وصف المعاملة' : 'Enter description'}
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Transaction Date */}
                        <FormField
                            control={form.control}
                            name="transaction_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>{isAr ? 'التاريخ' : 'Date'}</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        'w-full justify-start text-start font-normal',
                                                        !field.value && 'text-muted-foreground'
                                                    )}
                                                >
                                                    <CalendarIcon className="me-2 h-4 w-4" />
                                                    {field.value
                                                        ? format(field.value, 'PP')
                                                        : (isAr ? 'اختر التاريخ' : 'Select date')
                                                    }
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 z-[200]" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Is Approved */}
                        <FormField
                            control={form.control}
                            name="is_approved"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <FormLabel>{isAr ? 'معتمدة' : 'Approved'}</FormLabel>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {/* Visible to Client */}
                        <FormField
                            control={form.control}
                            name="visible_to_client"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <FormLabel>{isAr ? 'مرئي للعميل' : 'Visible to Client'}</FormLabel>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                {isAr ? 'إلغاء' : 'Cancel'}
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                                {isAr ? 'حفظ التغييرات' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
