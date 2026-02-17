'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLocale } from 'next-intl'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { Calendar as CalendarIcon, Loader2, Send } from 'lucide-react'

import { cn } from '@/lib/utils'
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
} from '@/components/ui/dialog'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
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
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

import { useCreateClientRequest, useClientProjects } from '@/hooks/use-client-portal'
import type { Department, RequestType } from '@/types/database'

// ============================================
// Validation Schema
// ============================================

const requestFormSchema = z.object({
    request_type: z.enum(['new_task', 'modification']),
    title: z.string().min(3, { message: 'العنوان يجب أن يكون 3 أحرف على الأقل' }).max(200),
    description: z.string().min(10, { message: 'الوصف يجب أن يكون 10 أحرف على الأقل' }),
    department: z.enum(['photography', 'content']),
    task_type: z.enum(['video', 'photo', 'editing', 'content', 'general']),
    project_id: z.string().optional(),
    original_task_id: z.string().optional(),
    deadline: z.date().optional(),
})

type RequestFormValues = z.infer<typeof requestFormSchema>

// ============================================
// Props
// ============================================

interface RequestFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    clientId: string
    clientUserId: string
    onSuccess?: () => void
}



// ============================================
// Component
// ============================================

export function RequestForm({
    open,
    onOpenChange,
    clientId,
    clientUserId,
    onSuccess,
}: RequestFormProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'

    // Hooks
    const createRequest = useCreateClientRequest()
    const { data: projects } = useClientProjects(clientId)


    // Selected department for dynamic task types
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)







    // Form setup
    const form = useForm<RequestFormValues>({
        resolver: zodResolver(requestFormSchema),
        defaultValues: {
            request_type: 'new_task',
            title: '',
            description: '',
            department: undefined,
            task_type: 'general',
            project_id: undefined,
            original_task_id: undefined,
            deadline: undefined,
        },
    })

    const projectId = form.watch('project_id')



    // Reset form on close
    useEffect(() => {
        if (!open) {
            form.reset()
            setSelectedDepartment(null)
        }
    }, [open, form])



    // Submit handler
    const onSubmit = async (values: RequestFormValues) => {
        try {
            // 1. Create the task request
            const task = await createRequest.mutateAsync({
                title: values.title,
                description: values.description,
                department: values.department,
                task_type: values.task_type,
                request_type: values.request_type,
                project_id: values.project_id || undefined,
                original_task_id: values.original_task_id || undefined,
                deadline: values.deadline?.toISOString(),
                created_by: clientUserId,
            })

            onSuccess?.()
            onOpenChange(false)
            form.reset()
        } catch (error) {
            console.error('Failed to create request:', error)
        }
    }

    const isSubmitting = createRequest.isPending

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isAr ? 'إرسال طلب جديد' : 'Submit New Request'}
                    </DialogTitle>
                    <DialogDescription>
                        {isAr
                            ? 'املأ تفاصيل طلبك الجديد. سيتم إرساله لتيم ليدر القسم المختار.'
                            : 'Fill in the details for your new request. It will be sent to the selected department team leader.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">



                        {/* Department */}
                        <FormField
                            control={form.control}
                            name="department"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isAr ? 'القسم' : 'Department'} *</FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={(val) => {
                                            field.onChange(val)
                                            setSelectedDepartment(val as Department)
                                        }}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={isAr ? 'اختر القسم...' : 'Select department...'} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="photography">
                                                {isAr ? 'التصوير' : 'Photography'}
                                            </SelectItem>
                                            <SelectItem value="content">
                                                {isAr ? 'المحتوى' : 'Content'}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />



                        {/* Project (Optional) */}
                        {projects && projects.length > 0 && (
                            <FormField
                                control={form.control}
                                name="project_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{isAr ? 'المشروع (اختياري)' : 'Project (Optional)'}</FormLabel>
                                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={isAr ? 'اختر المشروع...' : 'Select project...'} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {projects.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}



                        {/* Title */}
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isAr ? 'عنوان الطلب' : 'Request Title'} *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={isAr ? 'أدخل عنوان الطلب...' : 'Enter request title...'}
                                            {...field}
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
                                    <FormLabel>{isAr ? 'وصف الطلب' : 'Request Description'} *</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={isAr
                                                ? 'اشرح تفاصيل الطلب بالكامل...'
                                                : 'Describe your request in detail...'
                                            }
                                            rows={4}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Deadline */}
                        <FormField
                            control={form.control}
                            name="deadline"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>{isAr ? 'الموعد النهائي (اختياري)' : 'Deadline (Optional)'}</FormLabel>
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
                                                        ? format(field.value, 'PPP', { locale: isAr ? ar : enUS })
                                                        : (isAr ? 'اختر تاريخ...' : 'Pick a date...')
                                                    }
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) => date < new Date()}
                                                locale={isAr ? ar : enUS}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />



                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                {isAr ? 'إلغاء' : 'Cancel'}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                                ) : (
                                    <Send className="h-4 w-4 me-2" />
                                )}
                                {isAr ? 'إرسال الطلب' : 'Submit Request'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
