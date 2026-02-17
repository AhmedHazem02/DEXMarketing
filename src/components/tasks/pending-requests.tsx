'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Clock, CheckCircle, XCircle, ChevronDown,
    FileText, Image, Paperclip, Inbox, User,
    Loader2, AlertTriangle, Briefcase
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { usePendingRequests, useApproveClientRequest, useRejectClientRequest } from '@/hooks/use-tasks'
import { useTasksRealtime } from '@/hooks/use-realtime'
import { getRequestStatusConfig } from '@/types/task'
import type { RequestStatus } from '@/types/database'
import type { ClientRequestWithDetails } from '@/types/task'

// ============================================
// Props
// ============================================

interface PendingRequestsProps {
    teamLeaderId: string
    className?: string
}

// ============================================
// Single Request Card
// ============================================

function RequestCard({
    request,
    isAr,
    onApprove,
    onReject,
    isApproving,
}: {
    request: ClientRequestWithDetails
    isAr: boolean
    onApprove: (id: string) => void
    onReject: (id: string) => void
    isApproving: boolean
}) {
    const [expanded, setExpanded] = useState(false)
    const config = getRequestStatusConfig(request.request_status)

    const requestTypeLabel = request.request_type === 'new_task'
        ? (isAr ? 'مهمة جديدة' : 'New Task')
        : (isAr ? 'طلب تعديل' : 'Modification')

    const taskTypeLabels: Record<string, { en: string; ar: string }> = {
        video: { en: 'Video', ar: 'فيديو' },
        photo: { en: 'Photography', ar: 'تصوير' },
        editing: { en: 'Editing', ar: 'مونتاج' },
        content: { en: 'Content', ar: 'محتوى' },
        general: { en: 'General', ar: 'عام' },
    }

    const taskTypeLabel = taskTypeLabels[request.task_type]
    const attachmentCount = request.attachments?.length ?? 0
    const clientName = request.creator?.name ?? (isAr ? 'عميل' : 'Client')
    const isPending = request.request_status === 'pending_approval'

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <Card className={cn(
                'transition-all hover:shadow-md',
                isPending && 'border-yellow-500/30',
                request.request_status === 'approved' && 'border-green-500/20 opacity-75',
                request.request_status === 'rejected' && 'border-red-500/20 opacity-75',
            )}>
                <CardContent className="p-4">
                    {/* Main Row */}
                    <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {/* Client Avatar */}
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-primary" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-sm truncate">{request.title}</h4>
                                {attachmentCount > 0 && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                        <Paperclip className="h-3 w-3" /> {attachmentCount}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <User className="h-3 w-3" /> {clientName}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                    {requestTypeLabel}
                                </Badge>
                                {taskTypeLabel && (
                                    <Badge variant="secondary" className="text-xs">
                                        {isAr ? taskTypeLabel.ar : taskTypeLabel.en}
                                    </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                    {format(new Date(request.created_at), 'MMM d, HH:mm', {
                                        locale: isAr ? ar : enUS
                                    })}
                                </span>
                            </div>
                        </div>

                        {/* Status */}
                        <Badge className={cn('flex-shrink-0', config.bgColor, config.color, 'border')}>
                            {isAr ? config.labelAr : config.label}
                        </Badge>

                        <ChevronDown className={cn(
                            'h-4 w-4 text-muted-foreground transition-transform flex-shrink-0',
                            expanded && 'rotate-180'
                        )} />
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                        {expanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-4 pt-4 border-t space-y-3">
                                    {/* Description */}
                                    {request.description && (
                                        <div className="p-3 rounded-lg bg-muted/50">
                                            <p className="text-sm">{request.description}</p>
                                        </div>
                                    )}

                                    {/* Project info */}
                                    {request.project && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Briefcase className="h-3.5 w-3.5" />
                                            {isAr ? 'المشروع: ' : 'Project: '}
                                            <span className="font-medium">{request.project.name}</span>
                                        </div>
                                    )}

                                    {/* Deadline */}
                                    {request.deadline && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Clock className="h-3.5 w-3.5" />
                                            {isAr ? 'الموعد النهائي: ' : 'Deadline: '}
                                            {format(new Date(request.deadline), 'PPP', {
                                                locale: isAr ? ar : enUS
                                            })}
                                        </div>
                                    )}

                                    {/* Client info */}
                                    {request.creator?.email && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <User className="h-3.5 w-3.5" />
                                            {request.creator.email}
                                        </div>
                                    )}

                                    {/* Attachments */}
                                    {attachmentCount > 0 && (
                                        <div className="space-y-2">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {isAr ? 'المرفقات' : 'Attachments'} ({attachmentCount})
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {request.attachments?.map(att => {
                                                    const isPdf = att.file_type?.includes('pdf')
                                                    const isImage = att.file_type?.startsWith('image/')
                                                    const Icon = isPdf ? FileText : isImage ? Image : Paperclip

                                                    return (
                                                        <a
                                                            key={att.id}
                                                            href={att.file_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted/50 hover:bg-muted text-xs transition-colors border"
                                                        >
                                                            <Icon className="h-3.5 w-3.5" />
                                                            <span className="truncate max-w-[140px]">
                                                                {att.file_name || (isAr ? 'ملف' : 'File')}
                                                            </span>
                                                        </a>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Rejection reason (if already rejected) */}
                                    {request.request_status === 'rejected' && request.rejection_reason && (
                                        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                                            <div className="flex items-center gap-2 mb-1">
                                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                                <span className="text-sm font-medium text-red-600">
                                                    {isAr ? 'سبب الرفض' : 'Rejection Reason'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-red-600/80">{request.rejection_reason}</p>
                                        </div>
                                    )}

                                    {/* Action Buttons - Only for pending */}
                                    {isPending && (
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => onApprove(request.id)}
                                                disabled={isApproving}
                                            >
                                                {isApproving ? (
                                                    <Loader2 className="h-4 w-4 animate-spin me-1" />
                                                ) : (
                                                    <CheckCircle className="h-4 w-4 me-1" />
                                                )}
                                                {isAr ? 'قبول' : 'Approve'}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => onReject(request.id)}
                                                disabled={isApproving}
                                            >
                                                <XCircle className="h-4 w-4 me-1" />
                                                {isAr ? 'رفض' : 'Reject'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
    )
}

// ============================================
// Main Component
// ============================================

export function PendingRequests({ teamLeaderId, className }: PendingRequestsProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'

    // Real-time subscription for live request updates
    useTasksRealtime()

    const { data: requests, isLoading } = usePendingRequests(teamLeaderId)
    const approveRequest = useApproveClientRequest()
    const rejectRequest = useRejectClientRequest()

    // Reject dialog state
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [rejectingId, setRejectingId] = useState<string | null>(null)
    const [rejectionReason, setRejectionReason] = useState('')

    const pendingRequests = requests?.filter(r => r.request_status === 'pending_approval') ?? []
    const processedRequests = requests?.filter(r => r.request_status !== 'pending_approval') ?? []

    const handleApprove = async (requestId: string) => {
        try {
            await approveRequest.mutateAsync(requestId)
        } catch (error) {
            console.error('Failed to approve:', error)
        }
    }

    const handleRejectClick = (requestId: string) => {
        setRejectingId(requestId)
        setRejectionReason('')
        setRejectDialogOpen(true)
    }

    const handleRejectConfirm = async () => {
        if (!rejectingId) return
        try {
            await rejectRequest.mutateAsync({
                requestId: rejectingId,
                reason: rejectionReason || undefined,
            })
            setRejectDialogOpen(false)
            setRejectingId(null)
        } catch (error) {
            console.error('Failed to reject:', error)
        }
    }

    if (isLoading) {
        return (
            <div className={cn('space-y-3', className)}>
                <Skeleton className="h-6 w-48" />
                {[1, 2].map(i => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
            </div>
        )
    }

    if (!requests || requests.length === 0) {
        return null // Don't show section if no requests at all
    }

    return (
        <div className={cn('space-y-4', className)}>
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Inbox className="h-5 w-5 text-primary" />
                    {isAr ? 'طلبات العملاء' : 'Client Requests'}
                    {pendingRequests.length > 0 && (
                        <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
                            {pendingRequests.length}
                        </Badge>
                    )}
                </h2>
            </div>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-yellow-600 flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {isAr ? 'قيد الانتظار' : 'Pending Approval'}
                    </h3>
                    {pendingRequests.map(request => (
                        <RequestCard
                            key={request.id}
                            request={request}
                            isAr={isAr}
                            onApprove={handleApprove}
                            onReject={handleRejectClick}
                            isApproving={approveRequest.isPending}
                        />
                    ))}
                </div>
            )}

            {/* Recently Processed */}
            {processedRequests.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                        {isAr ? 'تمت المعالجة' : 'Processed'}
                    </h3>
                    {processedRequests.slice(0, 5).map(request => (
                        <RequestCard
                            key={request.id}
                            request={request}
                            isAr={isAr}
                            onApprove={handleApprove}
                            onReject={handleRejectClick}
                            isApproving={false}
                        />
                    ))}
                </div>
            )}

            {/* Reject Dialog */}
            <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {isAr ? 'رفض الطلب' : 'Reject Request'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {isAr
                                ? 'هل أنت متأكد من رفض هذا الطلب؟ يمكنك إضافة سبب (اختياري).'
                                : 'Are you sure you want to reject this request? You can add a reason (optional).'
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                        placeholder={isAr ? 'سبب الرفض (اختياري)...' : 'Rejection reason (optional)...'}
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        rows={3}
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            {isAr ? 'إلغاء' : 'Cancel'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRejectConfirm}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={rejectRequest.isPending}
                        >
                            {rejectRequest.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin me-1" />
                            ) : (
                                <XCircle className="h-4 w-4 me-1" />
                            )}
                            {isAr ? 'تأكيد الرفض' : 'Confirm Reject'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
