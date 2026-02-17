'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
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
    FormDescription,
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

import { useClientAccounts } from '@/hooks/use-client-accounts'
import { useCreateTransaction } from '@/hooks/use-treasury'
import { useCurrentRole } from '@/hooks/use-current-role'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryLabel,type CategoryOption } from '@/lib/constants/treasury'
import { cn } from '@/lib/utils'

// ============================================
// Schema
// ============================================

const clientTransactionSchema = z.object({
    client_account_id: z.string().min(1, 'Client account is required'),
    type: z.enum(['income', 'expense']),
    category: z.string().min(1, 'Category is required'),
    sub_category: z.string().optional(),
    amount: z.number().positive('Amount must be positive'),
    description: z.string().optional(),
    date: z.date().optional(),
    visible_to_client: z.boolean(),
})

type ClientTransactionFormValues = z.infer<typeof clientTransactionSchema>

// ============================================
// Component
// ============================================

interface AddClientTransactionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultClientAccountId?: string
}

export function AddClientTransactionDialog({
    open,
    onOpenChange,
    defaultClientAccountId,
}: AddClientTransactionDialogProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    
    const { isAdmin } = useCurrentRole()
    const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>(INCOME_CATEGORIES)

    const { data: clientAccounts, isLoading: isLoadingAccounts } = useClientAccounts()
    const createTransaction = useCreateTransaction()

    const form = useForm<ClientTransactionFormValues>({
        resolver: zodResolver(clientTransactionSchema),
        defaultValues: {
            client_account_id: defaultClientAccountId || '',
            type: 'income',
            category: '',
            sub_category: '',
            amount: 0,
            description: '',
            visible_to_client: true,
        },
    })

    const selectedType = form.watch('type')

    // Update categories when type changes
    useEffect(() => {
        if (selectedType === 'income') {
            setAvailableCategories(INCOME_CATEGORIES)
        } else {
            setAvailableCategories(EXPENSE_CATEGORIES)
        }
        // Reset category when type changes
        form.setValue('category', '')
        form.setValue('sub_category', '')
    }, [selectedType, form])

    // Set default client account if provided
    useEffect(() => {
        if (defaultClientAccountId) {
            form.setValue('client_account_id', defaultClientAccountId)
        }
    }, [defaultClientAccountId, form])

    const onSubmit = async (values: ClientTransactionFormValues) => {
        try {
            // Find the selected account to get the client_id
            const selectedAccount = clientAccounts?.find(a => a.id === values.client_account_id)

            const payload: any = {
                client_account_id: values.client_account_id,
                client_id: selectedAccount?.client_id || null,
                type: values.type,
                category: values.category,
                sub_category: values.sub_category || null,
                amount: values.amount,
                description: values.description || null,
                visible_to_client: values.visible_to_client,
                is_approved: true, // Auto-approve when admin/accountant creates directly
            }

            // Only include date if admin and date is provided
            if (isAdmin && values.date) {
                payload.transaction_date = values.date.toISOString().split('T')[0]
            }

            await createTransaction.mutateAsync(payload)
            onOpenChange(false)
            form.reset()
        } catch (error) {
            console.error('Form submission failed:', error)
        }
    }

    const isLoading = createTransaction.isPending

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            onOpenChange(isOpen)
            if (!isOpen) {
                form.reset()
            }
        }}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isAr ? 'إضافة معاملة للعميل' : 'Add Client Transaction'}
                    </DialogTitle>
                    <DialogDescription>
                        {isAr
                            ? 'أضف معاملة مالية (دخل أو صرف) مرتبطة بحساب العميل'
                            : 'Add a financial transaction (income or expense) linked to client account'
                        }
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Client Account Selection */}
                        <FormField
                            control={form.control}
                            name="client_account_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isAr ? 'حساب العميل' : 'Client Account'} *</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={!!defaultClientAccountId}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={isAr ? 'اختر حساب العميل' : 'Select client account'} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent position="popper" className="max-h-[200px]">
                                            {isLoadingAccounts ? (
                                                <div className="py-6 text-center text-sm text-muted-foreground">
                                                    {isAr ? 'جاري التحميل...' : 'Loading...'}
                                                </div>
                                            ) : !clientAccounts || clientAccounts.length === 0 ? (
                                                <div className="py-6 text-center text-sm text-muted-foreground">
                                                    {isAr ? 'لا توجد حسابات عملاء. أضف حساب عميل أولاً.' : 'No client accounts. Add a client account first.'}
                                                </div>
                                            ) : (
                                                clientAccounts.map((account) => {
                                                    const userName = (account.client as any)?.user?.name
                                                    const clientName = userName || account.client?.company || account.client?.name || account.client?.email || (isAr ? 'عميل بدون اسم' : 'Unnamed client')
                                                    const pkgName = isAr ? (account.package_name_ar || account.package_name) : account.package_name
                                                    return (
                                                        <SelectItem key={account.id} value={account.id}>
                                                            <div className="flex items-center gap-2">
                                                                <span>{clientName}</span>
                                                                {pkgName && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        ({pkgName})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </SelectItem>
                                                    )
                                                })
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Transaction Type */}
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{isAr ? 'نوع المعاملة' : 'Transaction Type'} *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent position="popper">
                                                <SelectItem value="income">
                                                    {isAr ? 'دخل' : 'Income'}
                                                </SelectItem>
                                                <SelectItem value="expense">
                                                    {isAr ? 'صرف' : 'Expense'}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Category */}
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{isAr ? 'التصنيف' : 'Category'} *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={isAr ? 'اختر التصنيف' : 'Select category'} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent position="popper">
                                                {availableCategories.map((category) => (
                                                    <SelectItem key={category.value} value={category.value}>
                                                        {getCategoryLabel(category.value, isAr)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            {/* Sub Category (Optional) */}
                            <FormField
                                control={form.control}
                                name="sub_category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{isAr ? 'التصنيف الفرعي' : 'Sub Category'}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={isAr ? 'اختياري' : 'Optional'}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Date Field - Only visible for Admin */}
                        {isAdmin && (
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>{isAr ? 'التاريخ' : 'Date'}</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            'w-full ps-3 text-start font-normal',
                                                            !field.value && 'text-muted-foreground'
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, 'PPP')
                                                        ) : (
                                                            <span>{isAr ? 'اختر التاريخ (أو اترك فارغاً للتاريخ الحالي)' : 'Pick date (or leave empty for now)'}</span>
                                                        )}
                                                        <CalendarIcon className="ms-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date > new Date() || date < new Date('1900-01-01')
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormDescription>
                                            {isAr ? 'الأدمن فقط يمكنه تحديد تاريخ محدد' : 'Only admin can specify a custom date'}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isAr ? 'الوصف' : 'Description'}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            rows={3}
                                            placeholder={isAr ? 'وصف المعاملة (اختياري)' : 'Transaction description (optional)'}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Visible to Client */}
                        <FormField
                            control={form.control}
                            name="visible_to_client"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel className="cursor-pointer">
                                            {isAr ? 'مرئي للعميل' : 'Visible to Client'}
                                        </FormLabel>
                                        <FormDescription>
                                            {isAr
                                                ? 'إذا كان مفعّل، سيتمكن العميل من رؤية هذه المعاملة في حسابه'
                                                : 'If checked, client will be able to see this transaction in their account'
                                            }
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-2">
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
                                {isAr ? 'إضافة المعاملة' : 'Add Transaction'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
