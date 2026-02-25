'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Plus, Trash2, Banknote, AlertCircle, UserPlus, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { PageHeader } from './page-header'
import {
    useAdvanceRecipients,
    useCreateAdvanceRecipient,
    useDeleteAdvanceRecipient,
    useCreateAdvance,
    useDeleteAdvance,
} from '@/hooks'
import type { AdvanceRecipientWithAdvances } from '@/types/database'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'

// ── Schemas ──────────────────────────────────────────────────────────────────

const personSchema = z.object({
    name: z.string().min(2, 'Name required'),
    recipient_type: z.enum(['employee', 'owner'] as const),
})
type PersonFormValues = z.infer<typeof personSchema>

const advanceSchema = z.object({
    amount: z.coerce.number().positive('Amount must be > 0'),
    notes: z.string().optional(),
})
type AdvanceFormValues = z.infer<typeof advanceSchema>

// ── Details Dialog ─────────────────────────────────────────────────────────────────

function DetailsDialog({
    recipient,
    isAr,
}: {
    recipient: AdvanceRecipientWithAdvances
    isAr: boolean
}) {
    const [open, setOpen] = useState(false)
    const deleteAdvance = useDeleteAdvance()

    const total = recipient.advances.reduce((s, a) => s + Number(a.amount), 0)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title={isAr ? 'التفاصيل' : 'Details'}>
                    <Eye className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]" dir={isAr ? 'rtl' : 'ltr'}>
                <DialogHeader>
                    <DialogTitle>{recipient.name}</DialogTitle>
                    <DialogDescription>
                        {isAr
                            ? `إجمالي السلف: ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م`
                            : `Total advances: ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })} EGP`}
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[400px] overflow-y-auto">
                    {recipient.advances.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            {isAr ? 'لا يوجد سلف بعد' : 'No advances yet'}
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {recipient.advances.map((advance, i) => (
                                <div key={advance.id} className="flex items-start justify-between rounded-lg border p-3 gap-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <span className="text-xs text-muted-foreground mt-0.5 shrink-0">{i + 1}</span>
                                        <div className="min-w-0">
                                            <p className="font-mono font-semibold text-sm">
                                                {Number(advance.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                <span className="text-muted-foreground text-xs ms-1">{isAr ? 'ج.م' : 'EGP'}</span>
                                            </p>
                                            {advance.notes && (
                                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{advance.notes}</p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {format(new Date(advance.created_at), 'dd/MM/yyyy - HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive hover:text-destructive">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent dir={isAr ? 'rtl' : 'ltr'}>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>{isAr ? 'حذف السلفة' : 'Delete Advance'}</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {isAr
                                                        ? `سيتم حذف سلفة ${Number(advance.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م وإرجاعها للخزنة.`
                                                        : `This will delete the ${Number(advance.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} EGP advance and restore it to treasury.`}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => deleteAdvance.mutate(advance as any)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    {isAr ? 'حذف' : 'Delete'}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ── Add Advance Dialog (inline per row) ──────────────────────────────────────

function AddAdvanceDialog({
    recipient,
    isAr,
}: {
    recipient: AdvanceRecipientWithAdvances
    isAr: boolean
}) {
    const [open, setOpen] = useState(false)
    const createAdvance = useCreateAdvance()

    const form = useForm<AdvanceFormValues>({
        resolver: zodResolver(advanceSchema) as any,
        defaultValues: { amount: 0, notes: '' },
    })

    const onSubmit = async (values: AdvanceFormValues) => {
        try {
            await createAdvance.mutateAsync({
                recipient_id: recipient.id,
                recipient_name: recipient.name,
                recipient_type: recipient.recipient_type,
                amount: values.amount,
                notes: values.notes,
            })
            toast.success(isAr ? 'تم إضافة السلفة بنجاح' : 'Advance added successfully')
            form.reset({ amount: 0, notes: '' })
            setOpen(false)
        } catch {
            toast.error(isAr ? 'حدث خطأ أثناء إضافة السلفة' : 'Failed to add advance')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" title={isAr ? 'إضافة سلفة' : 'Add advance'}>
                    <Plus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[380px]" dir={isAr ? 'rtl' : 'ltr'}>
                <DialogHeader>
                    <DialogTitle>
                        {isAr ? `إضافة سلفة – ${recipient.name}` : `Add Advance – ${recipient.name}`}
                    </DialogTitle>
                    <DialogDescription>
                        {isAr
                            ? 'سيتم خصم المبلغ من الخزنة تلقائياً'
                            : 'Amount will be deducted from treasury automatically'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control as any} name="amount" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{isAr ? 'المبلغ' : 'Amount'}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number" step="0.01" min="0"
                                        placeholder={isAr ? 'أدخل المبلغ' : 'Enter amount'}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control as any} name="notes" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{isAr ? 'ملاحظات' : 'Notes'}</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder={isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
                                        className="resize-none" rows={3} {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="submit" disabled={createAdvance.isPending} className="w-full">
                                {createAdvance.isPending
                                    ? (isAr ? 'جاري الإضافة...' : 'Adding...')
                                    : (isAr ? 'إضافة السلفة' : 'Add Advance')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AdvancesPageClient() {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const [addPersonOpen, setAddPersonOpen] = useState(false)

    const { data: recipients, isLoading } = useAdvanceRecipients()
    const createRecipient = useCreateAdvanceRecipient()
    const deleteRecipient = useDeleteAdvanceRecipient()

    const personForm = useForm<PersonFormValues>({
        resolver: zodResolver(personSchema) as any,
        defaultValues: { name: '', recipient_type: 'employee' },
    })

    const onAddPerson = async (values: PersonFormValues) => {
        try {
            await createRecipient.mutateAsync(values)
            toast.success(isAr ? 'تم إضافة الشخص بنجاح' : 'Person added successfully')
            personForm.reset()
            setAddPersonOpen(false)
        } catch {
            toast.error(isAr ? 'حدث خطأ' : 'Something went wrong')
        }
    }

    const handleDeleteRecipient = async (recipient: AdvanceRecipientWithAdvances) => {
        try {
            await deleteRecipient.mutateAsync(recipient)
            toast.success(isAr ? 'تم الحذف بنجاح' : 'Deleted successfully')
        } catch {
            toast.error(isAr ? 'حدث خطأ أثناء الحذف' : 'Failed to delete')
        }
    }

    const totalAll = recipients?.reduce(
        (sum, r) => sum + r.advances.reduce((s, a) => s + Number(a.amount), 0), 0
    ) ?? 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title={isAr ? 'السلف' : 'Advances'}
                description={isAr
                    ? 'إدارة سلف الموظفين والملاك – مرتبطة بالخزنة'
                    : 'Manage employee & owner advances – linked to treasury'}
                actions={
                    <Dialog open={addPersonOpen} onOpenChange={setAddPersonOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <UserPlus className="h-4 w-4 me-2" />
                                {isAr ? 'إضافة شخص' : 'Add Person'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[380px]" dir={isAr ? 'rtl' : 'ltr'}>
                            <DialogHeader>
                                <DialogTitle>{isAr ? 'إضافة شخص جديد' : 'Add New Person'}</DialogTitle>
                                <DialogDescription>
                                    {isAr
                                        ? 'أضف شخصاً لتتمكن من تسجيل سلفه لاحقاً'
                                        : 'Add a person to record advances for them later'}
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...personForm}>
                                <form onSubmit={personForm.handleSubmit(onAddPerson)} className="space-y-4">
                                    <FormField control={personForm.control as any} name="recipient_type" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{isAr ? 'النوع' : 'Type'}</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={isAr ? 'اختر النوع' : 'Select type'} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="employee">{isAr ? 'موظف' : 'Employee'}</SelectItem>
                                                    <SelectItem value="owner">{isAr ? 'مالك' : 'Owner'}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={personForm.control as any} name="name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{isAr ? 'الاسم' : 'Name'}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={isAr ? 'أدخل الاسم' : 'Enter name'} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <DialogFooter>
                                        <Button type="submit" disabled={createRecipient.isPending} className="w-full">
                                            {createRecipient.isPending
                                                ? (isAr ? 'جاري الإضافة...' : 'Adding...')
                                                : (isAr ? 'إضافة' : 'Add')}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                }
            />

            {/* Grand total */}
            {(recipients && recipients.length > 0) && (
                <div className="flex items-center gap-2 text-sm">
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                        {isAr ? 'إجمالي جميع السلف:' : 'Total all advances:'}
                    </span>
                    <span className="text-lg font-bold">
                        {totalAll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-muted-foreground text-xs">{isAr ? 'ج.م' : 'EGP'}</span>
                </div>
            )}

            {/* Table */}
            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded" />
                    ))}
                </div>
            ) : !recipients || recipients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">
                        {isAr ? 'لا يوجد أشخاص مضافون' : 'No people added yet'}
                    </h3>
                    <p className="text-muted-foreground mt-1">
                        {isAr
                            ? 'أضف شخصاً أولاً ثم سجل سلفه باستخدام زرار +'
                            : 'Add a person first, then record advances using the + button'}
                    </p>
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{isAr ? 'الاسم' : 'Name'}</TableHead>
                                <TableHead>{isAr ? 'النوع' : 'Type'}</TableHead>
                                <TableHead>{isAr ? 'عدد السلف' : 'Advances'}</TableHead>
                                <TableHead>{isAr ? 'إجمالي المبلغ' : 'Total Amount'}</TableHead>
                                <TableHead>{isAr ? 'آخر سلفة' : 'Last Advance'}</TableHead>
                                <TableHead className="w-[100px] text-center">
                                    {isAr ? 'إجراءات' : 'Actions'}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recipients.map((recipient) => {
                                const total = recipient.advances.reduce(
                                    (s, a) => s + Number(a.amount), 0
                                )
                                const lastAdvance = recipient.advances[0]
                                return (
                                    <TableRow key={recipient.id}>
                                        <TableCell className="font-medium">{recipient.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={recipient.recipient_type === 'owner' ? 'default' : 'secondary'}>
                                                {recipient.recipient_type === 'owner'
                                                    ? (isAr ? 'مالك' : 'Owner')
                                                    : (isAr ? 'موظف' : 'Employee')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {recipient.advances.length}
                                        </TableCell>
                                        <TableCell className="font-mono font-semibold">
                                            {total > 0 ? (
                                                <>
                                                    {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    <span className="text-muted-foreground ms-1 text-xs">
                                                        {isAr ? 'ج.م' : 'EGP'}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-muted-foreground">–</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {lastAdvance
                                                ? format(new Date(lastAdvance.created_at), 'dd/MM/yyyy', {
                                                    locale: isAr ? ar : undefined,
                                                })
                                                : '–'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-1">
                                                {/* details button */}
                                                <DetailsDialog recipient={recipient} isAr={isAr} />
                                                {/* + button: add advance for this person */}
                                                <AddAdvanceDialog recipient={recipient} isAr={isAr} />

                                                {/* Delete person (and all their advances) */}
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost" size="icon"
                                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                                            title={isAr ? 'حذف' : 'Delete'}
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
                                                                    ? `سيتم حذف "${recipient.name}" وجميع سلفه (${recipient.advances.length}) وإرجاع المبالغ للخزنة.`
                                                                    : `This will delete "${recipient.name}" and all their ${recipient.advances.length} advance(s), restoring amounts to treasury.`}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                {isAr ? 'إلغاء' : 'Cancel'}
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDeleteRecipient(recipient)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                {isAr ? 'حذف' : 'Delete'}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}
