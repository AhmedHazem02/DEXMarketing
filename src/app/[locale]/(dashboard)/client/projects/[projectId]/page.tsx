'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
    ChevronLeft,
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    Download,
    Eye,
    MessageSquare
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

import { useClientProjectDetails, useApproveTask, useRejectTask } from '@/hooks/use-client-portal'
import type { TaskWithRelations, TaskDetails } from '@/types/task'

// ============================================
// Approval Card Component
// ============================================

function TaskApprovalCard({
    task,
    onApprove,
    onReject,
    isProcessing
}: {
    task: TaskDetails
    onApprove: (id: string) => void
    onReject: (id: string, reason: string) => void
    isProcessing: boolean
}) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const [rejectReason, setRejectReason] = useState('')
    const [isRejectOpen, setIsRejectOpen] = useState(false)

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <CardDescription>{isAr ? 'تنتظر موافقتك' : 'Pending your approval'}</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                        {isAr ? 'للمراجعة' : 'Review'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    {task.description || (isAr ? 'لا يوجد وصف' : 'No description')}
                </p>

                {/* Attachments Preview */}
                {task.attachments && task.attachments.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                            {isAr ? 'المرفقات:' : 'Attachments:'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {task.attachments.map((file) => (
                                <a
                                    key={file.id}
                                    href={file.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50 hover:bg-muted text-sm transition-colors"
                                >
                                    <FileText className="h-4 w-4" />
                                    <span className="truncate max-w-[150px]">{file.file_name}</span>
                                    <Download className="h-3 w-3 ms-1 opacity-50" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex gap-3 pt-6 border-t">
                {/* Approve Button */}
                <Button
                    onClick={() => onApprove(task.id)}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                >
                    <CheckCircle className="h-4 w-4 me-2" />
                    {isAr ? 'موافقة' : 'Approve'}
                </Button>

                {/* Reject Dialog */}
                <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1 text-destructive hover:bg-destructive/10">
                            <XCircle className="h-4 w-4 me-2" />
                            {isAr ? 'طلب تعديل' : 'Request Revision'}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{isAr ? 'طلب تعديل' : 'Request Revision'}</DialogTitle>
                            <DialogDescription>
                                {isAr
                                    ? 'يرجى توضيح التعديلات المطلوبة بوضوح للفريق.'
                                    : 'Please specify the required revisions clearly for the team.'
                                }
                            </DialogDescription>
                        </DialogHeader>
                        <Textarea
                            placeholder={isAr ? 'اكتب ملاحظاتك هنا...' : 'Write your feedback here...'}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                        <DialogFooter>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    onReject(task.id, rejectReason)
                                    setIsRejectOpen(false)
                                    setRejectReason('')
                                }}
                                disabled={!rejectReason.trim()}
                            >
                                {isAr ? 'إرسال الملاحظات' : 'Send Feedback'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardFooter>
        </Card>
    )
}

// ============================================
// Main Page Component
// ============================================

export default function ProjectDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const locale = useLocale()
    const isAr = locale === 'ar'
    const projectId = params.projectId as string

    const { data, isLoading } = useClientProjectDetails(projectId)
    const approveTask = useApproveTask()
    const rejectTask = useRejectTask()

    if (isLoading) {
        return <div className="p-10 text-center"><Skeleton className="h-96 w-full" /></div>
    }

    if (!data) return null

    const { project, tasks } = data

    const reviewTasks = tasks.filter(t => t.status === 'review')
    const completedTasks = tasks.filter(t => t.status === 'approved')
    const inProgressTasks = tasks.filter(t => !['review', 'approved'].includes(t.status))

    const handleApprove = async (taskId: string) => {
        await approveTask.mutateAsync({ taskId })
    }

    const handleReject = async (taskId: string, reason: string) => {
        await rejectTask.mutateAsync({ taskId, feedback: reason })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className={isAr ? 'rotate-180' : ''} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                    <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                        <Clock className="h-3.5 w-3.5" />
                        {isAr ? 'تاريخ التسليم: ' : 'Deadline: '}
                        {project.end_date ? format(new Date(project.end_date), 'PPP', { locale: isAr ? ar : enUS }) : 'N/A'}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="review">
                <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3">
                    <TabsTrigger value="review" className="relative">
                        {isAr ? 'للمراجعة' : 'Review'}
                        {reviewTasks.length > 0 && (
                            <span className="absolute -top-1 -end-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                                {reviewTasks.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="in_progress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</TabsTrigger>
                    <TabsTrigger value="approved">{isAr ? 'تمت الموافقة' : 'Approved'}</TabsTrigger>
                </TabsList>

                {/* Review Tab */}
                <TabsContent value="review" className="mt-6 space-y-4">
                    {reviewTasks.length === 0 ? (
                        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                            <CheckCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <h3 className="font-medium">{isAr ? 'لا توجد مهام للمراجعة' : 'No tasks for review'}</h3>
                            <p className="text-sm text-muted-foreground">
                                {isAr ? 'سنخطرك عند انتهاء المهام.' : 'We will notify you when tasks are ready.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                            {reviewTasks.map(task => (
                                <TaskApprovalCard
                                    key={task.id}
                                    task={task}
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                    isProcessing={approveTask.isPending || rejectTask.isPending}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* In Progress Tab */}
                <TabsContent value="in_progress" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{isAr ? 'مهام قيد العمل' : 'Tasks in Progress'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {inProgressTasks.map(task => (
                                    <div key={task.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                            <span className="font-medium">{task.title}</span>
                                        </div>
                                        <Badge variant="secondary">{task.status}</Badge>
                                    </div>
                                ))}
                                {inProgressTasks.length === 0 && (
                                    <p className="text-muted-foreground text-center py-4">
                                        {isAr ? 'لا توجد مهام نشطة حالياً' : 'No active tasks currently'}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Approved Tab */}
                <TabsContent value="approved" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{isAr ? 'الأرشيف المكتمل' : 'Completed Archive'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {completedTasks.map(task => (
                                    <div key={task.id} className="flex items-center justify-between p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                            <div>
                                                <span className="font-medium line-through opacity-75">{task.title}</span>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(task.updated_at), 'PPP', { locale: isAr ? ar : enUS })}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            <Eye className="h-4 w-4 me-2" />
                                            {isAr ? 'عرض' : 'View'}
                                        </Button>
                                    </div>
                                ))}
                                {completedTasks.length === 0 && (
                                    <p className="text-muted-foreground text-center py-4">
                                        {isAr ? 'لم تتم الموافقة على مهام بعد' : 'No approved tasks yet'}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
