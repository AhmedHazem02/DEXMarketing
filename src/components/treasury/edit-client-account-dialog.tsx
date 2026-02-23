'use client'

import { useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

import { useUpdateClientAccount } from '@/hooks/use-client-accounts'
import type { ClientAccountWithRelations } from '@/types/database'

// ============================================
// Schema
// ============================================

const editClientAccountSchema = z.object({
    package_name: z.string().min(1, 'Package name is required'),
    package_name_ar: z.string().optional(),
    package_price: z.number().min(0, 'Price must be positive'),
    remaining_balance: z.number(),
    is_active: z.boolean(),
})

type EditClientAccountFormValues = z.infer<typeof editClientAccountSchema>

// ============================================
// Component
// ============================================

interface EditClientAccountDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    account: ClientAccountWithRelations | null
}

export function EditClientAccountDialog({ open, onOpenChange, account }: EditClientAccountDialogProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const updateClientAccount = useUpdateClientAccount()

    const form = useForm<EditClientAccountFormValues>({
        resolver: zodResolver(editClientAccountSchema),
        defaultValues: {
            package_name: '',
            package_name_ar: '',
            package_price: 0,
            remaining_balance: 0,
            is_active: true,
        },
    })

    // Populate form when account changes
    useEffect(() => {
        if (account) {
            form.reset({
                package_name: account.package_name || '',
                package_name_ar: account.package_name_ar || '',
                package_price: account.package_price || 0,
                remaining_balance: account.remaining_balance || 0,
                is_active: account.is_active,
            })
        }
    }, [account, form])

    const onSubmit = async (values: EditClientAccountFormValues) => {
        if (!account) return

        try {
            await updateClientAccount.mutateAsync({
                id: account.id,
                updates: {
                    package_name: values.package_name,
                    package_name_ar: values.package_name_ar || null,
                    package_price: values.package_price,
                    remaining_balance: values.remaining_balance,
                    is_active: values.is_active,
                },
            })
            onOpenChange(false)
        } catch (error) {
            console.error('Form submission failed:', error)
        }
    }

    const isLoading = updateClientAccount.isPending

    // Get client name for display
    const clientName = (account?.client as any)?.user?.name || 
                       account?.client?.name || 
                       'N/A'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isAr ? 'تعديل حساب العميل' : 'Edit Client Account'}
                    </DialogTitle>
                    <DialogDescription>
                        {isAr
                            ? `تعديل حساب ${clientName}`
                            : `Edit account for ${clientName}`
                        }
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Package Name */}
                        <FormField
                            control={form.control}
                            name="package_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isAr ? 'اسم الباقة (EN)' : 'Package Name (EN)'} *</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Package Name AR */}
                        <FormField
                            control={form.control}
                            name="package_name_ar"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isAr ? 'اسم الباقة (AR)' : 'Package Name (AR)'}</FormLabel>
                                    <FormControl>
                                        <Input {...field} dir="rtl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Package Price */}
                        <FormField
                            control={form.control}
                            name="package_price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isAr ? 'سعر الباقة (ج.م)' : 'Package Price (EGP)'} *</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="0" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Remaining Balance */}
                        <FormField
                            control={form.control}
                            name="remaining_balance"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isAr ? 'الرصيد المتبقي (ج.م)' : 'Remaining Balance (EGP)'}</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Is Active */}
                        <FormField
                            control={form.control}
                            name="is_active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <FormLabel>{isAr ? 'نشط' : 'Active'}</FormLabel>
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
