'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLocale } from 'next-intl'
import { Loader2, Plus, Upload, DollarSign, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'

import { useCreateTransaction } from '@/hooks/use-treasury'
import type { TransactionType } from '@/types/database'

// ============================================
// Schema
// ============================================

const transactionSchema = z.object({
    type: z.enum(['income', 'expense']),
    amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
    description: z.string().min(3, 'Description is required'),
    category: z.string().optional(),
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
    const createTransaction = useCreateTransaction()

    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema) as any,
        defaultValues: {
            type: 'expense',
            amount: 0,
            description: '',
            category: '',
        },
    })

    const onSubmit = async (values: TransactionFormValues) => {
        try {
            await createTransaction.mutateAsync({
                ...values,
                category: values.category || 'General',
                created_by: '00000000-0000-0000-0000-000000000000' // Mock ID
            })
            setOpen(false)
            form.reset()
        } catch (error) {
            console.error('Create transaction failed', error)
        }
    }

    const type = form.watch('type')

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
                                    <FormLabel>{isAr ? 'الموعد' : 'Amount'}</FormLabel>
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
                                    <FormLabel>{isAr ? 'الفئة' : 'Category'}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={isAr ? 'اختر الفئة' : 'Select Category'} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="General">General</SelectItem>
                                            <SelectItem value="Project">Project</SelectItem>
                                            <SelectItem value="Salary">Salary</SelectItem>
                                            <SelectItem value="Equipment">Equipment</SelectItem>
                                            <SelectItem value="Marketing">Marketing</SelectItem>
                                            <SelectItem value="Software">Software</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                            <Button type="submit" disabled={createTransaction.isPending}>
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
