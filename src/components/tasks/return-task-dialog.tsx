'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useReturnTask } from '@/hooks/use-tasks'
import type { WorkflowStage } from '@/types/database'

interface ReturnTaskDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    taskId: string | null
    taskTitle?: string
    workflowStage?: WorkflowStage
}

export function ReturnTaskDialog({ open, onOpenChange, taskId, taskTitle, workflowStage }: ReturnTaskDialogProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const [reason, setReason] = useState('')
    const returnTask = useReturnTask()

    const handleReturn = async () => {
        if (!taskId) return

        if (!reason.trim()) {
            toast.error(isAr ? 'يرجى كتابة سبب الإرجاع' : 'Please provide a reason for returning')
            return
        }

        try {
            await returnTask.mutateAsync({ taskId, reason: reason.trim(), workflowStage })
            toast.success(
                isAr 
                    ? 'تم إرجاع المهمة للتعديل بنجاح' 
                    : 'Task returned for revision successfully'
            )
            setReason('')
            onOpenChange(false)
        } catch (error) {
            toast.error(
                isAr 
                    ? 'حدث خطأ أثناء إرجاع المهمة' 
                    : 'Failed to return task'
            )
        }
    }

    const handleClose = () => {
        if (!returnTask.isPending) {
            setReason('')
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 text-orange-600" />
                        {isAr ? 'إرجاع المهمة للتعديل' : 'Return Task for Revision'}
                    </DialogTitle>
                    <DialogDescription>
                        {isAr
                            ? 'سيتم إرجاع المهمة إلى المنشئ مع ملاحظاتك للتعديل.'
                            : 'The task will be returned to the creator with your feedback for revision.'
                        }
                        {taskTitle && (
                            <span className="block mt-2 font-medium text-foreground">
                                {taskTitle}
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">
                            {isAr ? 'سبب الإرجاع' : 'Reason for Return'}
                            <span className="text-destructive ms-1">*</span>
                        </Label>
                        <Textarea
                            id="reason"
                            placeholder={
                                isAr
                                    ? 'اكتب السبب أو الملاحظات التي تحتاج إلى تعديل...'
                                    : 'Describe what needs to be revised...'
                            }
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={5}
                            disabled={returnTask.isPending}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            {isAr
                                ? 'كن واضحاً ومحدداً في ملاحظاتك لمساعدة المنشئ على فهم التعديلات المطلوبة.'
                                : 'Be clear and specific to help the creator understand what needs to be fixed.'
                            }
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={returnTask.isPending}
                    >
                        {isAr ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button
                        onClick={handleReturn}
                        disabled={returnTask.isPending || !reason.trim()}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {returnTask.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                                {isAr ? 'جاري الإرجاع...' : 'Returning...'}
                            </>
                        ) : (
                            <>
                                <RotateCcw className="h-4 w-4 me-2" />
                                {isAr ? 'إرجاع للتعديل' : 'Return for Revision'}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
