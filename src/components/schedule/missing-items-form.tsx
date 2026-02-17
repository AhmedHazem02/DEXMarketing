'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
    Calendar as CalendarIcon, Building2, Loader2,
    AlertTriangle, X, ClipboardList
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { EmojiTextarea } from '@/components/ui/emoji-textarea'

import { useCurrentUser } from '@/hooks/use-users'
import { useMyTasks } from '@/hooks/use-tasks'
import { MISSING_ITEMS_STATUS_CONFIG } from '@/types/schedule'
import type { ScheduleStatus, ScheduleType } from '@/types/schedule'
import type { MissingItemsStatus } from '@/types/database'

export interface MissingItemsFormProps {
    teamLeaderId: string
    initialDate?: string
    isLoading: boolean
    onSubmit: (data: any) => void
    defaultClientId?: string
}

export function MissingItemsForm({ teamLeaderId, initialDate, isLoading, onSubmit }: MissingItemsFormProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const { data: currentUser } = useCurrentUser()
    const { data: myTasks } = useMyTasks(currentUser?.id || '')

    const [selectedTaskId, setSelectedTaskId] = useState<string>('no-task')
    const [missingItems, setMissingItems] = useState('')
    const [missingItemsStatus, setMissingItemsStatus] = useState<MissingItemsStatus>('pending')
    const [notes, setNotes] = useState('')

    const selectedTask = myTasks?.find(t => t.id === selectedTaskId)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!missingItems.trim()) return

        const taskLabel = selectedTask?.title || ''
        const clientLabel = selectedTask?.project?.client
            ? (selectedTask.project.client.name || selectedTask.project.client.company)
            : ''
        const autoTitle = isAr
            ? `نواقص${taskLabel ? ' - ' + taskLabel : ''}${clientLabel ? ' (' + clientLabel + ')' : ''}`
            : `Missing Items${taskLabel ? ' - ' + taskLabel : ''}${clientLabel ? ' (' + clientLabel + ')' : ''}`

        onSubmit({
            title: autoTitle,
            company_name: clientLabel || autoTitle,
            scheduled_date: initialDate || format(new Date(), 'yyyy-MM-dd'),
            start_time: format(new Date(), 'HH:mm'),
            end_time: null,
            location: null,
            description: null,
            notes: notes || null,
            status: 'scheduled' as ScheduleStatus,
            client_id: selectedTask?.project?.client?.id || null,
            department: currentUser?.department || 'content',
            assigned_members: [],
            team_leader_id: teamLeaderId,
            task_id: selectedTaskId !== 'no-task' ? selectedTaskId : undefined,
            schedule_type: 'post' as ScheduleType,
            missing_items: missingItems,
            missing_items_status: missingItemsStatus,
            links: [],
            images: [],
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            {/* Date (read-only) */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? 'التاريخ' : 'Date'}
                </Label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-muted/30 text-sm">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>
                        {initialDate
                            ? format(new Date(initialDate + 'T00:00:00'), 'dd MMM yyyy', { locale: isAr ? ar : enUS })
                            : format(new Date(), 'dd MMM yyyy', { locale: isAr ? ar : enUS })}
                    </span>
                </div>
            </div>

            {/* Task Selector */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ClipboardList className="h-3.5 w-3.5" />
                    {isAr ? 'التاسك' : 'Task'}
                </Label>
                <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                    <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder={isAr ? 'اختر التاسك' : 'Select task'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        <SelectItem value="no-task">
                            <div className="flex items-center gap-2">
                                <X className="h-4 w-4 text-muted-foreground" />
                                <span>{isAr ? 'بدون تاسك' : 'No Task'}</span>
                            </div>
                        </SelectItem>
                        {myTasks && myTasks.length > 0 ? (
                            <>
                                <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-t mt-1 pt-2">
                                    {isAr ? 'التاسكات الخاصة بك' : 'Your Tasks'}
                                </div>
                                {myTasks.map(task => {
                                    const clientName = task.project?.client
                                        ? (task.project.client.name || task.project.client.company)
                                        : null
                                    return (
                                        <SelectItem key={task.id} value={task.id}>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-medium truncate max-w-[300px]">
                                                    {task.title}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground truncate">
                                                    {task.project?.name || ''}
                                                    {clientName ? ` • ${clientName}` : ''}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    )
                                })}
                            </>
                        ) : (
                            <div className="px-3 py-4 text-center">
                                <p className="text-xs text-muted-foreground">
                                    {isAr ? 'لا يوجد تاسكات' : 'No tasks found'}
                                </p>
                            </div>
                        )}
                    </SelectContent>
                </Select>
                {selectedTask?.project?.client && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-1">
                        <Building2 className="h-3 w-3" />
                        <span>{selectedTask.project.client.name || selectedTask.project.client.company}</span>
                    </div>
                )}
            </div>

            {/* Missing Items */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {isAr ? 'النواقص' : 'Missing Items'} *
                </Label>
                <EmojiTextarea
                    value={missingItems}
                    onChange={setMissingItems}
                    rows={4}
                    className="rounded-xl resize-none"
                    placeholder={isAr ? 'اكتب النواقص المطلوبة...\nمثال: المنيو، الشعار، صور المنتجات...' : 'Describe missing items...\ne.g. Menu, Logo, Product photos...'}
                />
            </div>

            {/* Missing Items Status */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? 'حالة النواقص' : 'Status'}
                </Label>
                <Select value={missingItemsStatus} onValueChange={(v) => setMissingItemsStatus(v as MissingItemsStatus)}>
                    <SelectTrigger className="rounded-xl">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {MISSING_ITEMS_STATUS_CONFIG.map(cfg => (
                            <SelectItem key={cfg.id} value={cfg.id}>
                                <span className={cn('flex items-center gap-2', cfg.color)}>
                                    {isAr ? cfg.labelAr : cfg.label}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? 'ملاحظات' : 'Notes'}
                </Label>
                <EmojiTextarea
                    value={notes}
                    onChange={setNotes}
                    rows={2}
                    className="rounded-xl resize-none"
                    placeholder={isAr ? 'ملاحظات إضافية...' : 'Additional notes...'}
                />
            </div>

            {/* Submit */}
            <Button
                type="submit"
                disabled={isLoading || !missingItems.trim()}
                className="w-full rounded-xl h-11 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <>
                        <AlertTriangle className="h-4 w-4 me-2" />
                        {isAr ? 'إرسال النواقص' : 'Submit Missing Items'}
                    </>
                )}
            </Button>
        </form>
    )
}
