'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { CalendarIcon, Plus, Trash2, Banknote, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { PageHeader } from './page-header'
import { useAdvances, useCreateAdvance, useDeleteAdvance } from '@/hooks'
import type { Advance, AdvanceRecipientType } from '@/types/database'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar } from '@/components/ui/calendar'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'

// Form schema
const advanceFormSchema = z.object({
    recipient_type: z.enum(['employee', 'owner'] as const),
    recipient_name: z.string().min(2, 'Name is required'),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
    notes: z.string().optional(),
})

type AdvanceFormValues = z.infer<typeof advanceFormSchema>

export function AdvancesPageClient() {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const [dialogOpen, setDialogOpen] = useState(false)
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)

    // Filters
    const filters = {
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
    }

    const { data: advances, isLoading } = useAdvances(filters)
    const createAdvance = useCreateAdvance()
    const deleteAdvance = useDeleteAdvance()

    const form = useForm<AdvanceFormValues>({
        resolver: zodResolver(advanceFormSchema) as any,
        defaultValues: {
            recipient_type: 'employee',
            recipient_name: '',
            amount: 0,
            notes: '',
        },
    })

    const onSubmit = async (values: AdvanceFormValues) => {
        try {
            await createAdvance.mutateAsync({
                recipient_type: values.recipient_type,
                recipient_name: values.recipient_name,
                amount: values.amount,
                notes: values.notes,
            })
            toast.success(isAr ? 'تم إضافة السلفة بنجاح' : 'Advance added successfully')
            form.reset()
            setDialogOpen(false)
        } catch {
            toast.error(isAr ? 'حدث خطأ أثناء إضافة السلفة' : 'Failed to add advance')
        }
    }

    const handleDelete = async (advance: Advance) => {
        try {
            await deleteAdvance.mutateAsync(advance)
            toast.success(isAr ? 'تم حذف السلفة بنجاح' : 'Advance deleted successfully')
        } catch {
            toast.error(isAr ? 'حدث خطأ أثناء حذف السلفة' : 'Failed to delete advance')
        }
    }

    const clearFilters = () => {
        setStartDate(undefined)
        setEndDate(undefined)
    }

    // Calculate total
    const totalAmount = advances?.reduce((sum, a) => sum + Number(a.amount), 0) ?? 0

    return (
        <div className="space-y-6">
            <PageHeader
                title={isAr ? 'السلف' : 'Advances'}
                description={isAr ? 'إدارة سلف الموظفين والملاك - مرتبطة بالخزنة' : 'Manage employee & owner advances - linked to treasury'}
                actions={
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 me-2" />
                                {isAr ? 'إضافة سلفة' : 'Add Advance'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]" dir={isAr ? 'rtl' : 'ltr'}>
                            <DialogHeader>
                                <DialogTitle>{isAr ? 'إضافة سلفة جديدة' : 'Add New Advance'}</DialogTitle>
                                <DialogDescription>
                                    {isAr
                                        ? 'سيتم خصم المبلغ من الخزنة تلقائياً'
                                        : 'The amount will be automatically deducted from the treasury'}
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="recipient_type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{isAr ? 'النوع' : 'Type'}</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={isAr ? 'اختر النوع' : 'Select type'} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="employee">
                                                            {isAr ? 'موظف' : 'Employee'}
                                                        </SelectItem>
                                                        <SelectItem value="owner">
                                                            {isAr ? 'مالك' : 'Owner'}
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="recipient_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{isAr ? 'الاسم' : 'Name'}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={isAr ? 'أدخل الاسم' : 'Enter name'}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{isAr ? 'المبلغ' : 'Amount'}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        placeholder={isAr ? 'أدخل المبلغ' : 'Enter amount'}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="notes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{isAr ? 'ملاحظات' : 'Notes'}</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder={isAr ? 'ملاحظات إضافية (اختياري)' : 'Additional notes (optional)'}
                                                        className="resize-none"
                                                        rows={3}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <DialogFooter>
                                        <Button
                                            type="submit"
                                            disabled={createAdvance.isPending}
                                            className="w-full"
                                        >
                                            {createAdvance.isPending
                                                ? (isAr ? 'جاري الإضافة...' : 'Adding...')
                                                : (isAr ? 'إضافة السلفة' : 'Add Advance')}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                }
            />

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-start font-normal">
                            <CalendarIcon className="h-4 w-4 me-2" />
                            {startDate
                                ? format(startDate, 'dd/MM/yyyy')
                                : (isAr ? 'من تاريخ' : 'From date')}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            locale={isAr ? ar : undefined}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-start font-normal">
                            <CalendarIcon className="h-4 w-4 me-2" />
                            {endDate
                                ? format(endDate, 'dd/MM/yyyy')
                                : (isAr ? 'إلى تاريخ' : 'To date')}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            locale={isAr ? ar : undefined}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                {(startDate || endDate) && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                        {isAr ? 'مسح الفلتر' : 'Clear filters'}
                    </Button>
                )}

                {/* Total summary */}
                <div className="ms-auto flex items-center gap-2 text-sm font-medium">
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{isAr ? 'الإجمالي:' : 'Total:'}</span>
                    <span className="text-lg font-bold">
                        {totalAmount.toLocaleString(isAr ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-muted-foreground">{isAr ? 'ج.م' : 'EGP'}</span>
                </div>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded" />
                    ))}
                </div>
            ) : !advances || advances.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">
                        {isAr ? 'لا توجد سلف' : 'No advances'}
                    </h3>
                    <p className="text-muted-foreground mt-1">
                        {isAr ? 'لم يتم تسجيل أي سلف بعد' : 'No advances have been recorded yet'}
                    </p>
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{isAr ? 'التاريخ' : 'Date'}</TableHead>
                                <TableHead>{isAr ? 'النوع' : 'Type'}</TableHead>
                                <TableHead>{isAr ? 'الاسم' : 'Name'}</TableHead>
                                <TableHead>{isAr ? 'المبلغ' : 'Amount'}</TableHead>
                                <TableHead>{isAr ? 'ملاحظات' : 'Notes'}</TableHead>
                                <TableHead className="w-[60px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {advances.map((advance) => (
                                <TableRow key={advance.id}>
                                    <TableCell className="whitespace-nowrap">
                                        {format(new Date(advance.created_at), 'dd/MM/yyyy', {
                                            locale: isAr ? ar : undefined,
                                        })}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={advance.recipient_type === 'owner' ? 'default' : 'secondary'}
                                        >
                                            {advance.recipient_type === 'owner'
                                                ? (isAr ? 'مالك' : 'Owner')
                                                : (isAr ? 'موظف' : 'Employee')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {advance.recipient_name}
                                    </TableCell>
                                    <TableCell className="font-mono whitespace-nowrap">
                                        {Number(advance.amount).toLocaleString(isAr ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2 })}
                                        <span className="text-muted-foreground ms-1 text-xs">
                                            {isAr ? 'ج.م' : 'EGP'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                                        {advance.notes || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent dir={isAr ? 'rtl' : 'ltr'}>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                        {isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        {isAr
                                                            ? 'هل أنت متأكد من حذف هذه السلفة؟ سيتم إرجاع المبلغ إلى الخزنة.'
                                                            : 'Are you sure you want to delete this advance? The amount will be restored to the treasury.'}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>
                                                        {isAr ? 'إلغاء' : 'Cancel'}
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDelete(advance)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        {isAr ? 'حذف' : 'Delete'}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}
