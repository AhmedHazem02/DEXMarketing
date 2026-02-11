'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLocale } from 'next-intl'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { Calendar as CalendarIcon, Loader2, Send, FileUp } from 'lucide-react'

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

import { FileUploadZone } from '@/components/tasks/file-upload-zone'
import { useCreateClientRequest, useClientProjects } from '@/hooks/use-client-portal'
import { useAddAttachment } from '@/hooks/use-tasks'
import { DEPARTMENT_TASK_TYPES } from '@/types/task'
import type { Department, TaskType, RequestType } from '@/types/database'

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

// Uploaded file reference for linking after task creation
interface UploadedFileRef {
    file_url: string
    file_name: string
    file_type: string
    file_size: number
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
    const addAttachment = useAddAttachment()
    const { data: projects } = useClientProjects(clientId)

    // State for uploaded files (before task is created)
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFileRef[]>([])

    // Selected department for dynamic task types
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)

    // Available task types based on selected department
    const availableTaskTypes = selectedDepartment
        ? DEPARTMENT_TASK_TYPES[selectedDepartment]
        : []

    // Tasks for modification mode (from selected project)
    const [selectedProjectTasks, setSelectedProjectTasks] = useState<
        { id: string; title: string; status: string }[]
    >([])

    // Check if client has any projects with tasks
    const hasProjectsWithTasks = projects && projects.length > 0 && projects.some(p => p.tasks && p.tasks.length > 0)

    // Form setup
    const form = useForm<RequestFormValues>({
        resolver: zodResolver(requestFormSchema),
        defaultValues: {
            request_type: 'new_task',
            title: '',
            description: '',
            department: undefined,
            task_type: undefined,
            project_id: undefined,
            original_task_id: undefined,
            deadline: undefined,
        },
    })

    const requestType = form.watch('request_type')
    const projectId = form.watch('project_id')

    // Load tasks when project changes (for modification mode)
    useEffect(() => {
        if (projectId && projects) {
            const project = projects.find(p => p.id === projectId)
            setSelectedProjectTasks(project?.tasks ?? [])
        } else {
            setSelectedProjectTasks([])
        }
    }, [projectId, projects])

    // Reset task_type when department changes
    useEffect(() => {
        if (selectedDepartment) {
            form.setValue('task_type', '' as TaskType)
        }
    }, [selectedDepartment, form])

    // Reset form on close
    useEffect(() => {
        if (!open) {
            form.reset()
            setUploadedFiles([])
            setSelectedDepartment(null)
        }
    }, [open, form])

    // Handle file upload completion
    const handleFileUploaded = (file: UploadedFileRef) => {
        setUploadedFiles(prev => [...prev, file])
    }

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

            // 2. Link uploaded files to the created task
            if (uploadedFiles.length > 0 && task?.id) {
                await Promise.all(
                    uploadedFiles.map(file =>
                        addAttachment.mutateAsync({
                            task_id: task.id,
                            file_url: file.file_url,
                            file_name: file.file_name,
                            file_type: file.file_type,
                            file_size: file.file_size,
                            uploaded_by: clientUserId,
                            is_final: false,
                        })
                    )
                )
            }

            onSuccess?.()
            onOpenChange(false)
            form.reset()
            setUploadedFiles([])
        } catch (error) {
            console.error('Failed to create request:', error)
        }
    }

    const isSubmitting = createRequest.isPending || addAttachment.isPending

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isAr ? 'إرسال طلب جديد' : 'Submit New Request'}
                    </DialogTitle>
                    <DialogDescription>
                        {isAr
                            ? 'اختر نوع الطلب واملأ التفاصيل. سيتم إرسال الطلب لتيم ليدر القسم المختار.'
                            : 'Choose request type and fill in details. The request will be sent to the selected department team leader.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                        {/* Request Type */}
                        <FormField
                            control={form.control}
                            name="request_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isAr ? 'نوع الطلب' : 'Request Type'} *</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            className="flex gap-4"
                                        >
                                            <div className={cn(
                                                'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors flex-1',
                                                field.value === 'new_task' ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                                            )}>
                                                <RadioGroupItem value="new_task" id="new_task" />
                                                <Label htmlFor="new_task" className="cursor-pointer font-medium">
                                                    {isAr ? 'مهمة جديدة' : 'New Task'}
                                                </Label>
                                            </div>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className={cn(
                                                            'flex items-center gap-2 p-3 rounded-lg border transition-colors flex-1',
                                                            !hasProjectsWithTasks && 'opacity-50 cursor-not-allowed',
                                                            hasProjectsWithTasks && 'cursor-pointer hover:bg-accent',
                                                            field.value === 'modification' && hasProjectsWithTasks && 'border-primary bg-primary/5'
                                                        )}>
                                                            <RadioGroupItem 
                                                                value="modification" 
                                                                id="modification" 
                                                                disabled={!hasProjectsWithTasks}
                                                            />
                                                            <Label 
                                                                htmlFor="modification" 
                                                                className={cn(
                                                                    'font-medium',
                                                                    hasProjectsWithTasks ? 'cursor-pointer' : 'cursor-not-allowed'
                                                                )}
                                                            >
                                                                {isAr ? 'طلب تعديل' : 'Modification'}
                                                            </Label>
                                                        </div>
                                                    </TooltipTrigger>
                                                    {!hasProjectsWithTasks && (
                                                        <TooltipContent>
                                                            <p className="text-xs">
                                                                {isAr 
                                                                    ? 'يجب أن يكون لديك مشروع ومهام موجودة أولاً'
                                                                    : 'You need to have a project with existing tasks first'}
                                                            </p>
                                                        </TooltipContent>
                                                    )}
                                                </Tooltip>
                                            </TooltipProvider>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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

                        {/* Task Type - Dynamic based on department */}
                        {selectedDepartment && (
                            <FormField
                                control={form.control}
                                name="task_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{isAr ? 'نوع المهمة' : 'Task Type'} *</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={isAr ? 'اختر نوع المهمة...' : 'Select task type...'} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {availableTaskTypes.map(tt => (
                                                    <SelectItem key={tt.id} value={tt.id}>
                                                        {isAr ? tt.labelAr : tt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

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

                        {/* Original Task - Only for modification requests */}
                        {requestType === 'modification' && (
                            <FormField
                                control={form.control}
                                name="original_task_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{isAr ? 'المهمة المراد تعديلها' : 'Task to Modify'} *</FormLabel>
                                        {selectedProjectTasks.length > 0 ? (
                                            <Select value={field.value ?? ''} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={isAr ? 'اختر المهمة...' : 'Select task...'} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {selectedProjectTasks.map(t => (
                                                        <SelectItem key={t.id} value={t.id}>
                                                            {t.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                                                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                                    {isAr 
                                                        ? projectId 
                                                            ? 'هذا المشروع ليس به مهام بعد. اختر مشروع آخر أو قم بإنشاء مهمة جديدة بدلاً من ذلك.'
                                                            : 'يرجى اختيار مشروع أولاً لعرض المهام المتاحة للتعديل.'
                                                        : projectId
                                                            ? 'This project has no tasks yet. Choose another project or create a new task instead.'
                                                            : 'Please select a project first to see available tasks for modification.'}
                                                </p>
                                            </div>
                                        )}
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

                        {/* File Upload */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                <FileUp className="inline h-4 w-4 me-1" />
                                {isAr ? 'المرفقات (اختياري)' : 'Attachments (Optional)'}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                {isAr
                                    ? 'يمكنك رفع صور أو ملفات PDF'
                                    : 'You can upload images or PDF files'
                                }
                            </p>
                            <FileUploadZone
                                userId={clientUserId}
                                acceptedTypes={['image/*', 'application/pdf']}
                                onUploadComplete={handleFileUploaded}
                                maxFileSize={15}
                                folder={`dex-erp/client-requests/${clientId}`}
                            />
                            {uploadedFiles.length > 0 && (
                                <p className="text-xs text-green-600">
                                    {isAr
                                        ? `تم رفع ${uploadedFiles.length} ملف بنجاح`
                                        : `${uploadedFiles.length} file(s) uploaded successfully`
                                    }
                                </p>
                            )}
                        </div>

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
