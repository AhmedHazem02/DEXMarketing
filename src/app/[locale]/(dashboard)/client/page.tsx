'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
    Briefcase,
    Calendar,
    CheckCircle2,
    Clock,
    ArrowRight,
    LayoutDashboard
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import { useClientProjects, useClientProfile } from '@/hooks/use-client-portal'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// ... existing imports

export default function ClientDashboard() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const [userId, setUserId] = useState<string | null>(null)
    const supabase = createClient()

    const router = useRouter()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                setUserId(user.id)

                // Double check role from DB to be safe
                const { data: userProfile } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                const role = (userProfile as any)?.role || user.user_metadata?.role

                if (role === 'admin') {
                    router.push('/admin')
                } else if (role === 'team_leader') {
                    router.push('/team-leader')
                } else if (role === 'creator') {
                    router.push('/creator')
                }
            }
        }
        getUser()
    }, [router])

    const { data: profile, isLoading: isProfileLoading } = useClientProfile(userId ?? '')
    // We assume the profile contains the 'id' which is the client_id needed for projects
    // If profile is not found (406), this user might not be a 'client' yet in the clients table.

    const { data: projects, isLoading: isProjectsLoading } = useClientProjects(profile?.id)

    const isLoading = isProfileLoading || isProjectsLoading || !userId

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-64 rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    // If profile load failed or returned null (e.g. 406 handled by returning undefined)
    if (!profile) {
        return (
            <div className="p-8 text-center border rounded-xl bg-orange-50">
                <h2 className="text-xl font-bold mb-2 text-orange-800">
                    {isAr ? 'حسابك غير مرتبط بملف عميل' : 'Account not linked to a Client Profile'}
                </h2>
                <p className="text-muted-foreground">
                    {isAr
                        ? 'يرجى التواصل مع الإدارة لربط وتفعيل حسابك كعميل.'
                        : 'Please contact administration to activate your client account.'}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <LayoutDashboard className="h-8 w-8 text-primary" />
                    {isAr ? 'لوحة العميل' : 'Client Portal'}
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    {isAr
                        ? `مرحباً بك، ${profile?.name || 'عميلنا العزيز'}. تابع تقدم مشاريعك هنا.`
                        : `Welcome back, ${profile?.name || 'Valued Client'}. Track your projects here.`
                    }
                </p>
            </div>

            {/* Pending Reviews Section */}
            {projects?.some(p => p.tasks.some(t => t.status === 'review')) && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-orange-600 dark:text-orange-400">
                        <Clock className="h-5 w-5" />
                        {isAr ? 'مهام بانتظار موافقتك' : 'Pending Approvals'}
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {projects.flatMap(p => p.tasks.filter(t => t.status === 'review').map(t => ({ ...t, project_name: p.name, project_id: p.id })))
                            .map((task, i) => (
                                <Link key={i} href={`/client/projects/${task.project_id}?tab=review`}>
                                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-l-4 border-l-orange-500">
                                        <CardHeader className="p-4 pb-2">
                                            <div className="flex justify-between items-start">
                                                <Badge variant="outline" className="text-xs">{task.project_name}</Badge>
                                                <Badge className="bg-orange-500 text-white hover:bg-orange-600">Review</Badge>
                                            </div>
                                            <CardTitle className="text-base mt-2">{task.title}</CardTitle>
                                        </CardHeader>
                                        <CardFooter className="p-4 pt-0 text-sm text-muted-foreground flex justify-between items-center">
                                            <span>
                                                {task.deadline ? format(new Date(task.deadline), 'MMM d') : 'No deadline'}
                                            </span>
                                            <div className="flex items-center text-primary text-xs font-bold">
                                                {isAr ? 'مراجعة' : 'Review'} <ArrowRight className="h-3 w-3 ms-1" />
                                            </div>
                                        </CardFooter>
                                    </Card>
                                </Link>
                            ))
                        }
                    </div>
                </div>
            )}

            {/* Projects Grid */}
            <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Briefcase className="h-6 w-6 text-primary" />
                    {isAr ? 'مشاريعي' : 'My Projects'}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects?.length === 0 ? (
                        <Card className="col-span-full py-16">
                            <CardContent className="flex flex-col items-center justify-center text-center">
                                <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold">
                                    {isAr ? 'لا توجد مشاريع حالياً' : 'No Active Projects'}
                                </h3>
                                <p className="text-muted-foreground mt-2">
                                    {isAr
                                        ? 'تواصل معنا لبدء مشروعك القادم!'
                                        : 'Contact us to start your next project!'
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        projects?.map((project, index) => {
                            const totalTasks = project.tasks.length
                            const approvedTasks = project.tasks.filter(t => t.status === 'approved').length
                            const progress = totalTasks === 0 ? 0 : Math.round((approvedTasks / totalTasks) * 100)
                            const pendingReviews = project.tasks.filter(t => t.status === 'review').length

                            return (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="h-full flex flex-col hover:border-primary/50 transition-colors relative overflow-hidden">
                                        {pendingReviews > 0 && (
                                            <div className="absolute top-0 end-0 bg-orange-500 text-white text-xs px-2 py-1 rounded-bl-xl font-bold z-10">
                                                {pendingReviews} {isAr ? 'مراجعة' : 'Reviews'}
                                            </div>
                                        )}
                                        <CardHeader>
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                                                    {project.status}
                                                </Badge>
                                                <Briefcase className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <CardTitle className="text-xl line-clamp-1">{project.name}</CardTitle>
                                            <CardDescription className="line-clamp-2 min-h-[40px]">
                                                {project.description || (isAr ? 'لا يوجد وصف' : 'No description')}
                                            </CardDescription>
                                        </CardHeader>

                                        <CardContent className="flex-1 space-y-4">
                                            {/* Progress */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">
                                                        {isAr ? 'نسبة الإنجاز' : 'Progress'}
                                                    </span>
                                                    <span className="font-medium">{progress}%</span>
                                                </div>
                                                <Progress value={progress} className="h-2" />
                                            </div>

                                            {/* Meta */}
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span>{approvedTasks}/{totalTasks} {isAr ? 'مكتمل' : 'Done'}</span>
                                                </div>
                                                {project.end_date && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>
                                                            {format(new Date(project.end_date), 'MMM d', { locale: isAr ? ar : enUS })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>

                                        <CardFooter>
                                            <Link href={`/client/projects/${project.id}`} className="w-full">
                                                <Button className="w-full group">
                                                    {isAr ? 'عرض التفاصيل' : 'View Details'}
                                                    <ArrowRight className={`h-4 w-4 ms-2 transition-transform ${isAr ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                                                </Button>
                                            </Link>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
