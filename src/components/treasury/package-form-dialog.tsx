'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLocale } from 'next-intl'
import { Loader2 } from 'lucide-react'

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

import { useCreatePackage, useUpdatePackage } from '@/hooks'
import type { Package } from '@/types/database'

// ============================================
// Schema
// ============================================

const packageSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    name_ar: z.string().optional().nullable(),
    price: z.number().min(0, 'Price cannot be negative'),
    duration_days: z.number().min(1, 'Duration must be at least 1 day'),
    description: z.string().optional().nullable(),
    description_ar: z.string().optional().nullable(),
})

type PackageFormValues = z.infer<typeof packageSchema>

// ============================================
// Component
// ============================================

interface PackageFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    package?: Package | null
}

export function PackageFormDialog({ open, onOpenChange, package: pkg }: PackageFormDialogProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const createPackage = useCreatePackage()
    const updatePackage = useUpdatePackage()

    const form = useForm<PackageFormValues>({
        resolver: zodResolver(packageSchema),
        defaultValues: {
            name: '',
            name_ar: '',
            price: 0,
            duration_days: 30,
            description: '',
            description_ar: '',
        },
    })

    // Reset form when package changes
    useEffect(() => {
        if (pkg) {
            form.reset({
                name: pkg.name,
                name_ar: pkg.name_ar || '',
                price: pkg.price,
                duration_days: pkg.duration_days,
                description: pkg.description || '',
                description_ar: pkg.description_ar || '',
            })
        } else {
            form.reset({
                name: '',
                name_ar: '',
                price: 0,
                duration_days: 30,
                description: '',
                description_ar: '',
            })
        }
    }, [pkg, form])

    const onSubmit = async (values: PackageFormValues) => {
        try {
            if (pkg) {
                // Update existing package
                await updatePackage.mutateAsync({
                    id: pkg.id,
                    updates: {
                        ...values,
                        name_ar: values.name_ar || null,
                        description: values.description || null,
                        description_ar: values.description_ar || null,
                    },
                })
            } else {
                // Create new package
                await createPackage.mutateAsync({
                    ...values,
                    name_ar: values.name_ar || null,
                    description: values.description || null,
                    description_ar: values.description_ar || null,
                    is_active: true,
                })
            }
            onOpenChange(false)
        } catch (error) {
            console.error('Form submission failed:', error)
        }
    }

    const isLoading = createPackage.isPending || updatePackage.isPending

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] flex flex-col max-h-[90vh]">
                <DialogHeader className="shrink-0">
                    <DialogTitle>
                        {pkg
                            ? (isAr ? 'تعديل الباقة' : 'Edit Package')
                            : (isAr ? 'إضافة باقة جديدة' : 'Add New Package')
                        }
                    </DialogTitle>
                    <DialogDescription>
                        {isAr
                            ? 'أدخل تفاصيل الباقة. جميع الحقول المطلوبة مميزة.'
                            : 'Enter package details. All required fields are marked.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col min-h-0 flex-1">
                        <div className="flex-1 overflow-y-auto space-y-4 px-1 py-1">
                        {/* Package Name (English) */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isAr ? 'اسم الباقة (EN)' : 'Package Name (EN)'} *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={isAr ? 'مثال: Gold Package' : 'e.g., Gold Package'}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Package Name (Arabic) */}
                        <FormField
                            control={form.control}
                            name="name_ar"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isAr ? 'اسم الباقة (AR)' : 'Package Name (AR)'}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={isAr ? 'مثال: الباقة الذهبية' : 'e.g., الباقة الذهبية'}
                                            {...field}
                                            value={field.value || ''}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {isAr ? 'اختياري - الاسم بالعربية' : 'Optional - Arabic name'}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Price & Duration Row */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Price */}
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{isAr ? 'السعر (ج.م)' : 'Price (EGP)'} *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="5000"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Duration */}
                            <FormField
                                control={form.control}
                                name="duration_days"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{isAr ? 'المدة (أيام)' : 'Duration (Days)'} *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                placeholder="30"
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Description (English) */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isAr ? 'الوصف (EN)' : 'Description (EN)'}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={isAr ? 'وصف الباقة بالإنجليزية...' : 'Package description...'}
                                            rows={3}
                                            {...field}
                                            value={field.value || ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Description (Arabic) */}
                        <FormField
                            control={form.control}
                            name="description_ar"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isAr ? 'الوصف (AR)' : 'Description (AR)'}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={isAr ? 'وصف الباقة بالعربية...' : 'Arabic description...'}
                                            rows={3}
                                            {...field}
                                            value={field.value || ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        </div>
                        <DialogFooter className="gap-2 shrink-0 pt-4 border-t mt-2">
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
                                {pkg
                                    ? (isAr ? 'تحديث' : 'Update')
                                    : (isAr ? 'إضافة' : 'Add')
                                }
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
