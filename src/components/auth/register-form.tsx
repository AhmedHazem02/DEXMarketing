'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'

export function RegisterForm() {
    const t = useTranslations('auth')
    const common = useTranslations('common')
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const formSchema = z.object({
        name: z.string().min(2, { message: t('nameMin') }),
        email: z.string().email({ message: t('emailInvalid') }),
        password: z.string().min(6, { message: t('passwordMin') }),
        confirmPassword: z.string().min(6),
    }).refine((data) => data.password === data.confirmPassword, {
        message: t('passwordsDontMatch'),
        path: ["confirmPassword"],
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        const supabase = createClient()

        try {
            const { error } = await supabase.auth.signUp({
                email: values.email,
                password: values.password,
                options: {
                    data: {
                        name: values.name,
                        role: 'client',
                    },
                },
            })

            if (error) {
                toast.error(error.message)
                return
            }

            toast.success(t('success'))
            router.push('/login')

        } catch (error) {
            toast.error(t('error'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{t('createAccount')}</CardTitle>
                <CardDescription>{t('createAccountDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('name')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('name')} {...field} />
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
                                    <FormLabel>{t('email')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="name@example.com" dir="ltr" {...field} />
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
                                    <FormLabel>{t('password')}</FormLabel>
                                    <FormControl>
                                        <Input type="password" dir="ltr" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('confirmPassword')}</FormLabel>
                                    <FormControl>
                                        <Input type="password" dir="ltr" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? common('loading') : t('register')}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Link href="/login" className="text-sm text-muted-foreground hover:underline">
                    {t('alreadyHaveAccount')}
                </Link>
            </CardFooter>
        </Card>
    )
}
