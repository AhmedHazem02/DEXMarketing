'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createUser } from '@/lib/actions/users'
import { useQueryClient } from '@tanstack/react-query'

const DEPARTMENT_REQUIRED_ROLES = ['team_leader', 'account_manager', 'videographer', 'editor', 'photographer', 'creator', 'designer'] as const

const formSchema = z.object({
    name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    email: z.string().email('بريد إلكتروني غير صالح'),
    password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
    role: z.enum(['admin', 'accountant', 'team_leader', 'account_manager', 'creator', 'designer', 'client', 'videographer', 'editor', 'photographer']),
    department: z.enum(['photography', 'content']).nullable().optional(),
})

export function AddUserDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const queryClient = useQueryClient()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            role: 'client',
            department: null,
        }
    })

    const selectedRole = form.watch('role')
    const needsDepartment = DEPARTMENT_REQUIRED_ROLES.includes(selectedRole as any)

    // Auto-set department for photography-only roles
    const autoDepartmentRoles: Record<string, 'photography' | 'content'> = {
        videographer: 'photography',
        editor: 'photography',
        photographer: 'photography',
        creator: 'content',
        designer: 'content',
        account_manager: 'content',
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        // Auto-resolve department if role has a fixed department
        const department = autoDepartmentRoles[values.role] || values.department || null
        setIsLoading(true)
        try {
            const res = await createUser({ ...values, department })
            if (res.success) {
                toast.success('تم إنشاء المستخدم بنجاح')
                setOpen(false)
                form.reset()
                queryClient.invalidateQueries({ queryKey: ['users'] })
            } else {
                toast.error(res.error || 'فشل إنشاء المستخدم')
            }
        } catch (err) {
            toast.error('حدث خطأ غير متوقع')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="h-4 w-4 me-2" />
                    إضافة عضو
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                    <DialogDescription>
                        سيتم إنشاء حساب جديد وتفعيله فوراً.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الاسم</FormLabel>
                                    <FormControl>
                                        <Input placeholder="الاسم الكامل" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>البريد الإلكتروني</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="example@dex.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>كلمة المرور</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="8 أحرف على الأقل" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الدور</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر الدور" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="admin">مدير (Admin)</SelectItem>
                                            <SelectItem value="account_manager">مدير حسابات (Account Manager)</SelectItem>
                                            <SelectItem value="team_leader">قائد فريق (تصوير)</SelectItem>
                                            <SelectItem value="accountant">محاسب</SelectItem>
                                            <SelectItem value="creator">صانع محتوى</SelectItem>
                                            <SelectItem value="designer">مصمم</SelectItem>
                                            <SelectItem value="videographer">مصور فيديو</SelectItem>
                                            <SelectItem value="editor">مونتير</SelectItem>
                                            <SelectItem value="photographer">مصور فوتوغرافي</SelectItem>
                                            <SelectItem value="client">عميل</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* Department selector for team_leader role */}
                        {selectedRole === 'team_leader' && (
                            <FormField
                                control={form.control}
                                name="department"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>القسم</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اختر القسم" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="photography">قسم التصوير</SelectItem>
                                                <SelectItem value="content">قسم المحتوى</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                إنشاء الحساب
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
