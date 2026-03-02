'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Loader2, Forward, UserCircle2 } from 'lucide-react'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

import { useForwardTask } from '@/hooks/use-tasks'
import { useTeamMembers } from '@/hooks/use-users'
import type { TaskWithRelations } from '@/types/task'

// ============================================
// Props
// ============================================

interface ForwardToDesignerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    task: TaskWithRelations
    accountManagerId: string
    onSuccess?: () => void
}

// ============================================
// Component
// ============================================

export function ForwardToDesignerDialog({
    open,
    onOpenChange,
    task,
    accountManagerId,
    onSuccess,
}: ForwardToDesignerDialogProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const [selectedDesignerId, setSelectedDesignerId] = useState<string | null>(null)
    const [notes, setNotes] = useState('')

    const forwardTask = useForwardTask()
    const { data: teamMembers, isLoading: membersLoading } = useTeamMembers(accountManagerId)

    // Filter designers only
    const designers = teamMembers?.filter((m) => m.role === 'designer') ?? []

    const handleForward = async () => {
        if (!selectedDesignerId) return

        try {
            await forwardTask.mutateAsync({
                task,
                designerId: selectedDesignerId,
                notes: notes.trim() || undefined,
                accountManagerId,
            })
            toast.success(
                isAr
                    ? 'تم تحويل المهمة للمصمم بنجاح'
                    : 'Task forwarded to designer successfully'
            )
            // Reset state & close
            setSelectedDesignerId(null)
            setNotes('')
            onOpenChange(false)
            onSuccess?.()
        } catch {
            toast.error(
                isAr
                    ? 'حدث خطأ أثناء تحويل المهمة'
                    : 'Failed to forward task'
            )
        }
    }

    const handleClose = () => {
        if (forwardTask.isPending) return
        setSelectedDesignerId(null)
        setNotes('')
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Forward className="h-5 w-5 text-primary" />
                        {isAr ? 'تحويل للمصمم' : 'Forward to Designer'}
                    </DialogTitle>
                    <DialogDescription>
                        {isAr
                            ? 'سيتم إنشاء نسخة مستقلة من المهمة وتعيينها للمصمم المختار.'
                            : 'A standalone copy of the task will be created and assigned to the selected designer.'}
                        <span className="block mt-2 font-medium text-foreground">
                            {task.title}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Designer Selection */}
                    <div className="space-y-2">
                        <Label>
                            {isAr ? 'اختر المصمم' : 'Select Designer'}
                            <span className="text-destructive ms-1">*</span>
                        </Label>

                        {membersLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : designers.length === 0 ? (
                            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                                <UserCircle2 className="h-5 w-5 me-2" />
                                {isAr ? 'لا يوجد مصممين في الفريق' : 'No designers in the team'}
                            </div>
                        ) : (
                            <ScrollArea className="max-h-[200px]">
                                <div className="space-y-1">
                                    {designers.map((designer) => (
                                        <button
                                            key={designer.id}
                                            type="button"
                                            onClick={() => setSelectedDesignerId(designer.id)}
                                            disabled={forwardTask.isPending}
                                            className={cn(
                                                'flex w-full items-center gap-3 rounded-lg border p-3 text-start transition-colors',
                                                'hover:bg-accent/50',
                                                selectedDesignerId === designer.id
                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                    : 'border-border'
                                            )}
                                        >
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={designer.avatar_url ?? undefined} />
                                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                    {(designer.name ?? 'D').charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm font-medium truncate block">
                                                    {designer.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground truncate block">
                                                    {designer.email}
                                                </span>
                                            </div>
                                            {selectedDesignerId === designer.id && (
                                                <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>

                    {/* Optional Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="forward-notes">
                            {isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
                        </Label>
                        <Textarea
                            id="forward-notes"
                            placeholder={
                                isAr
                                    ? 'أضف ملاحظات للمصمم...'
                                    : 'Add notes for the designer...'
                            }
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            disabled={forwardTask.isPending}
                            className="resize-none"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={forwardTask.isPending}
                    >
                        {isAr ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button
                        onClick={handleForward}
                        disabled={forwardTask.isPending || !selectedDesignerId || designers.length === 0}
                    >
                        {forwardTask.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                                {isAr ? 'جاري التحويل...' : 'Forwarding...'}
                            </>
                        ) : (
                            <>
                                <Forward className="h-4 w-4 me-2" />
                                {isAr ? 'تحويل' : 'Forward'}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
