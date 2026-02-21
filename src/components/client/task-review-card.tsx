'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
    CheckCircle2,
    FileText,
    Calendar,
    User,
    Paperclip,
    MessageSquare,
    Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

import { useApproveTask, useRejectTask } from '@/hooks/use-client-portal'
import { getPriorityConfig } from '@/types/task'
import type { TaskWithRelations } from '@/types/task'
import { cn } from '@/lib/utils'

interface TaskReviewCardProps {
    task: TaskWithRelations
}

export function TaskReviewCard({ task }: TaskReviewCardProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    
    const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
    const [isApproving, setIsApproving] = useState(false)
    const [modificationNotes, setModificationNotes] = useState('')
    
    const approveTask = useApproveTask()
    const rejectTask = useRejectTask()
    
    const priorityConfig = getPriorityConfig(task.priority)

    const handleApprove = async () => {
        setIsApproving(true)
        try {
            await approveTask.mutateAsync({
                taskId: task.id,
                feedback: isAr ? 'تمت الموافقة من العميل' : 'Approved by client',
            })
            setIsReviewDialogOpen(false)
        } catch (error) {
            console.error('Failed to approve task:', error)
        } finally {
            setIsApproving(false)
        }
    }

    const handleRequestModification = async () => {
        if (!modificationNotes.trim()) {
            return
        }
        
        setIsApproving(true)
        try {
            await rejectTask.mutateAsync({
                taskId: task.id,
                feedback: modificationNotes,
            })
            setIsReviewDialogOpen(false)
            setModificationNotes('')
        } catch (error) {
            console.error('Failed to request modification:', error)
        } finally {
            setIsApproving(false)
        }
    }

    return (
        <>
            <Card
                className="hover:border-primary/40 hover:shadow-[0_0_24px_rgba(251,191,36,0.08)] hover:translate-y-[-2px] transition-all duration-300 cursor-pointer group"
                onClick={() => setIsReviewDialogOpen(true)}
            >
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge className={cn('text-xs', priorityConfig.bgColor, priorityConfig.color)}>
                            {isAr ? priorityConfig.labelAr : priorityConfig.label}
                        </Badge>
                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
                            {isAr ? 'مراجعة العميل' : 'Client Review'}
                        </Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {task.title}
                    </CardTitle>
                    {task.description && (
                        <CardDescription className="line-clamp-2 mt-2">
                            {task.description}
                        </CardDescription>
                    )}
                </CardHeader>

                <CardContent className="pb-3 space-y-2">
                    {task.creator && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{task.creator.name || task.creator.email}</span>
                        </div>
                    )}
                    
                    {task.deadline && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                                {format(new Date(task.deadline), 'PPP', { locale: isAr ? ar : enUS })}
                            </span>
                        </div>
                    )}
                    
                    {((task.attachments_count ?? 0) > 0 || (task.comments_count ?? 0) > 0) && (
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {(task.attachments_count ?? 0) > 0 && (
                                <div className="flex items-center gap-1">
                                    <Paperclip className="h-4 w-4" />
                                    <span>{task.attachments_count ?? 0}</span>
                                </div>
                            )}
                            {(task.comments_count ?? 0) > 0 && (
                                <div className="flex items-center gap-1">
                                    <MessageSquare className="h-4 w-4" />
                                    <span>{task.comments_count ?? 0}</span>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>

                <CardFooter className="pt-3 border-t">
                    <div className="flex items-center justify-between w-full text-sm">
                        <span className="text-muted-foreground">
                            {isAr ? 'اضغط للمراجعة' : 'Click to review'}
                        </span>
                        <FileText className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                </CardFooter>
            </Card>

            {/* Review Dialog */}
            <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {isAr ? 'مراجعة المهمة' : 'Review Task'}
                        </DialogTitle>
                        <DialogDescription>
                            {isAr
                                ? 'قم بمراجعة تفاصيل المهمة ثم اختر الموافقة أو طلب تعديلات'
                                : 'Review the task details and choose to approve or request modifications'
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Task Info */}
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">
                                    {isAr ? 'عنوان المهمة' : 'Task Title'}
                                </Label>
                                <p className="text-lg font-semibold mt-1">{task.title}</p>
                            </div>

                            {task.description && (
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        {isAr ? 'الوصف' : 'Description'}
                                    </Label>
                                    <p className="mt-1 text-sm whitespace-pre-wrap">{task.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        {isAr ? 'الأولوية' : 'Priority'}
                                    </Label>
                                    <Badge className={cn('mt-1', priorityConfig.bgColor, priorityConfig.color)}>
                                        {isAr ? priorityConfig.labelAr : priorityConfig.label}
                                    </Badge>
                                </div>
                                
                                {task.deadline && (
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">
                                            {isAr ? 'الموعد النهائي' : 'Deadline'}
                                        </Label>
                                        <p className="mt-1 text-sm">
                                            {format(new Date(task.deadline), 'PPP', { locale: isAr ? ar : enUS })}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {task.creator && (
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        {isAr ? 'تم التنفيذ بواسطة' : 'Created By'}
                                    </Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                            {(task.creator.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm">{task.creator.name || task.creator.email}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Modification Notes */}
                        <div className="space-y-3">
                            <Label htmlFor="modification-notes">
                                {isAr ? 'ملاحظات التعديل (اختياري)' : 'Modification Notes (Optional)'}
                            </Label>
                            <Textarea
                                id="modification-notes"
                                placeholder={isAr ? 'اكتب التعديلات المطلوبة هنا...' : 'Write requested modifications here...'}
                                value={modificationNotes}
                                onChange={(e) => setModificationNotes(e.target.value)}
                                rows={4}
                                className="resize-none"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleRequestModification}
                            disabled={isApproving || !modificationNotes.trim()}
                        >
                            {isApproving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                            {isAr ? 'طلب تعديل' : 'Request Modifications'}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleApprove}
                            disabled={isApproving}
                        >
                            {isApproving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                            <CheckCircle2 className="me-2 h-4 w-4" />
                            {isAr ? 'موافقة' : 'Approve'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
