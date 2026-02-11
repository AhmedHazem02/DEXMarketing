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
    LayoutDashboard,
    Plus,
    FileText,
    Send,
    UserCheck,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

import { useClientProjects, useClientProfile, useClientRequestCounts } from '@/hooks/use-client-portal'
import { useCurrentUser } from '@/hooks/use-users'
import { useTasksForClientReview } from '@/hooks/use-tasks'
import { RequestForm } from '@/components/client/request-form'
import { RequestsList } from '@/components/client/requests-list'
import { TaskReviewCard } from '@/components/client/task-review-card'

import { useState } from 'react'

// ... existing imports

export default function ClientDashboard() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const router = useRouter()

    // Auth via shared hook (no manual supabase.auth.getUser)
    const { data: currentUser, isLoading: isUserLoading } = useCurrentUser()
    const userId = currentUser?.id ?? null

    // Redirect non-client roles
    if (currentUser && currentUser.role !== 'client') {
        const roleRoutes: Record<string, string> = {
            admin: '/admin',
            team_leader: '/team-leader',
            creator: '/creator',
        }
        const route = roleRoutes[currentUser.role]
        if (route) router.push(route)
    }

    // Request form dialog state
    const [isRequestFormOpen, setIsRequestFormOpen] = useState(false)

    const { data: profile, isLoading: isProfileLoading } = useClientProfile(userId ?? '')
    // We assume the profile contains the 'id' which is the client_id needed for projects
    // If profile is not found (406), this user might not be a 'client' yet in the clients table.

    const { data: projects, isLoading: isProjectsLoading } = useClientProjects(profile?.id)

    // Tasks pending client review
    const { data: reviewTasks, isLoading: isReviewTasksLoading } = useTasksForClientReview(profile?.id ?? '')

    // Request counts
    const requestCounts = useClientRequestCounts(userId ?? '')

    const isLoading = isUserLoading || isProfileLoading || isProjectsLoading || !userId

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
            <div className="flex items-start justify-between gap-4 flex-wrap">
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
                <Button onClick={() => setIsRequestFormOpen(true)} size="lg">
                    <Send className="h-4 w-4 me-2" />
                    {isAr ? 'إرسال طلب' : 'Submit Request'}
                </Button>
            </div>

            {/* Request Stats Cards */}
            {requestCounts.total > 0 && (
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                    <Card className="bg-card/50">
                        <CardContent className="p-4 flex items-center gap-3">
                            <FileText className="h-8 w-8 text-primary" />
                            <div>
                                <p className="text-2xl font-bold">{requestCounts.total}</p>
                                <p className="text-xs text-muted-foreground">{isAr ? 'إجمالي الطلبات' : 'Total Requests'}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-yellow-500/5 border-yellow-500/20">
                        <CardContent className="p-4 flex items-center gap-3">
                            <Clock className="h-8 w-8 text-yellow-500" />
                            <div>
                                <p className="text-2xl font-bold">{requestCounts.pending}</p>
                                <p className="text-xs text-muted-foreground">{isAr ? 'قيد الانتظار' : 'Pending'}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-500/5 border-green-500/20">
                        <CardContent className="p-4 flex items-center gap-3">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-2xl font-bold">{requestCounts.approved}</p>
                                <p className="text-xs text-muted-foreground">{isAr ? 'تمت الموافقة' : 'Approved'}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-500/5 border-red-500/20">
                        <CardContent className="p-4 flex items-center gap-3">
                            <Plus className="h-8 w-8 text-red-500 rotate-45" />
                            <div>
                                <p className="text-2xl font-bold">{requestCounts.rejected}</p>
                                <p className="text-xs text-muted-foreground">{isAr ? 'مرفوضة' : 'Rejected'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Client Review Section - Tasks Pending Your Review */}
            {reviewTasks && reviewTasks.length > 0 && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-indigo-600 dark:text-indigo-400">
                        <UserCheck className="h-5 w-5" />
                        {isAr ? 'مهام تحتاج مراجعتك' : 'Tasks Pending Your Review'}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        {isAr
                            ? 'المهام التالية جاهزة للمراجعة. يرجى الموافقة أو طلب تعديلات.'
                            : 'The following tasks are ready for your review. Please approve or request modifications.'
                        }
                    </p>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {reviewTasks.map((task) => (
                            <TaskReviewCard key={task.id} task={task} />
                        ))}
                    </div>
                </div>
            )}

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

            {/* My Requests Section */}
            <div>
                <Separator className="mb-6" />
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        {isAr ? 'طلباتي' : 'My Requests'}
                    </h2>
                    <Button variant="outline" onClick={() => setIsRequestFormOpen(true)}>
                        <Plus className="h-4 w-4 me-2" />
                        {isAr ? 'طلب جديد' : 'New Request'}
                    </Button>
                </div>
                <RequestsList clientUserId={userId!} />
            </div>

            {/* Request Form Dialog */}
            {profile && userId && (
                <RequestForm
                    open={isRequestFormOpen}
                    onOpenChange={setIsRequestFormOpen}
                    clientId={profile.id}
                    clientUserId={userId}
                />
            )}
        </div>
    )
}
