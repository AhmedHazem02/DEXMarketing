'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLocale } from 'next-intl'
import { format } from 'date-fns'
import { Loader2, Plus, Upload, DollarSign, CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
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
    Tabs,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'

import { useCreateTransaction } from '@/hooks/use-treasury'
import { useCurrentUser } from '@/hooks/use-users'
import { useCurrentRole } from '@/hooks/use-current-role'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryLabel, type CategoryOption } from '@/lib/constants/treasury'
import type { TransactionType, Transaction } from '@/types/database'
import { cn } from '@/lib/utils'

// ============================================
// Schema
// ============================================

const transactionSchema = z.object({
    type: z.enum(['income', 'expense']),
    amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
    description: z.string().optional(),
    category: z.string().min(1, 'Category is required'),
    sub_category: z.string().optional(),
    date: z.date().optional(),
    receipt_url: z.string().optional(),
    client_id: z.string().optional(),
    project_id: z.string().optional(),
})

type TransactionFormValues = z.infer<typeof transactionSchema>

// ============================================
// Component
// ============================================

export function TransactionForm() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const [open, setOpen] = useState(false)
    const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>(EXPENSE_CATEGORIES)
    
    const createTransaction = useCreateTransaction()
    const { data: currentUser } = useCurrentUser()
    const { role, isAdmin } = useCurrentRole()

    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema) as any,
        defaultValues: {
            type: 'expense',
            amount: 0,
            description: '',
            category: '',
            sub_category: '',
        },
    })

    const selectedType = form.watch('type')

    // Update available categories when type changes
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

    const onSubmit = async (values: TransactionFormValues) => {
        if (!currentUser) {
            console.error('No authenticated user found')
            return
        }

        try {
            const payload: any = {
                ...values,
                created_by: currentUser.id,
                sub_category: values.sub_category || null,
            }

            // Only include date if admin and date is provided
            if (isAdmin && values.date) {
                payload.transaction_date = values.date.toISOString().split('T')[0]
            }

            await createTransaction.mutateAsync(payload)
            setOpen(false)
            form.reset()
        } catch (error) {
            console.error('Create transaction failed', error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    {isAr ? 'معاملة جديدة' : 'New Transaction'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isAr ? 'إضافة معاملة مالية' : 'Add Financial Transaction'}
                    </DialogTitle>
                    <DialogDescription>
                        {isAr
                            ? 'سجل إيراد جديد أو مصروف للخزينة'
                            : 'Record a new income or expense to the treasury'
                        }
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Type Toggle */}
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <Tabs
                                    value={field.value}
                                    onValueChange={(v) => field.onChange(v as TransactionType)}
                                    className="w-full"
                                >
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="income" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                                            {isAr ? 'إيراد (+)' : 'Income (+)'}
                                        </TabsTrigger>
                                        <TabsTrigger value="expense" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                                            {isAr ? 'مصروف (-)' : 'Expense (-)'}
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            )}
                        />

                        {/* Amount */}
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isAr ? 'المبلغ' : 'Amount'}</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <DollarSign className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                step="0.01"
                                                className="ps-10 text-lg font-semibold"
                                                {...field}
                                            />
                                        </div>
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
                                            placeholder={isAr ? 'شرح المعاملة...' : 'Transaction details...'}
                                            {...field}
                                        />
                                    </FormControl>
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
                                    <FormLabel>{isAr ? 'الفئة' : 'Category'} *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={isAr ? 'اختر الفئة' : 'Select Category'} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
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

                        {/* Sub Category */}
                        <FormField
                            control={form.control}
                            name="sub_category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isAr ? 'التصنيف الفرعي' : 'Sub Category'}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={isAr ? 'تصنيف فرعي (اختياري)' : 'Sub category (optional)'}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Date - Only for Admin */}
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
                                                            'w-full pl-3 text-left font-normal',
                                                            !field.value && 'text-muted-foreground'
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, 'PPP')
                                                        ) : (
                                                            <span>{isAr ? 'اختر التاريخ (أو اتركه للتاريخ الحالي)' : 'Pick date (or leave for current time)'}</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                                            {isAr ? 'الأدمن فقط يمكنه تحديد التاريخ' : 'Only admin can set custom date'}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Receipt Upload (Placeholder) */}
                        <div className="flex items-center justify-center p-6 border-2 border-dashed rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Upload className="h-8 w-8" />
                                <span className="text-sm">
                                    {isAr ? 'رفق الإيصال (اختياري)' : 'Upload Receipt (Optional)'}
                                </span>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={createTransaction.isPending || !currentUser}>
                                {createTransaction.isPending && (
                                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                                )}
                                {isAr ? 'حفظ المعاملة' : 'Save Transaction'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
