'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Clock, CheckCircle, XCircle, ChevronDown,
    FileText, Image, Paperclip, AlertTriangle,
    Inbox
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import { useClientRequests } from '@/hooks/use-client-portal'
import { getRequestStatusConfig } from '@/types/task'
import type { RequestStatus, Department, RequestType } from '@/types/database'
import type { ClientRequestWithDetails } from '@/types/task'

// ============================================
// Props
// ============================================

interface RequestsListProps {
    clientUserId: string
    className?: string
}

// ============================================
// Status Icon Mapping
// ============================================

const STATUS_ICONS: Record<RequestStatus, typeof Clock> = {
    pending_approval: Clock,
    approved: CheckCircle,
    rejected: XCircle,
}

// ============================================
// Request Item Component
// ============================================

function RequestItem({ request, isAr, index = 0 }: { request: ClientRequestWithDetails; isAr: boolean; index?: number }) {
    const [expanded, setExpanded] = useState(false)
    const config = getRequestStatusConfig(request.request_status)
    const StatusIcon = STATUS_ICONS[request.request_status]

    const departmentLabel = request.department === 'photography'
        ? (isAr ? 'التصوير' : 'Photography')
        : (isAr ? 'المحتوى' : 'Content')

    const requestTypeLabel = request.request_type === 'new_task'
        ? (isAr ? 'مهمة جديدة' : 'New Task')
        : (isAr ? 'طلب تعديل' : 'Modification')

    const attachmentCount = request.attachments?.length ?? 0

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Card
                className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    request.request_status === 'rejected' && 'border-red-500/20',
                    request.request_status === 'approved' && 'border-green-500/20',
                    request.request_status === 'pending_approval' && 'border-yellow-500/20',
                )}
                onClick={() => setExpanded(!expanded)}
            >
                <CardContent className="p-4">
                    {/* Main Row */}
                    <div className="flex items-center gap-3">
                        {/* Status Icon */}
                        <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                            config.bgColor
                        )}>
                            <StatusIcon className={cn('h-5 w-5', config.color)} />
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
                                <Badge variant="outline" className="text-xs">
                                    {requestTypeLabel}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                    {departmentLabel}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {format(new Date(request.created_at), 'MMM d, yyyy', {
                                        locale: isAr ? ar : enUS
                                    })}
                                </span>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <Badge className={cn('flex-shrink-0', config.bgColor, config.color, 'border')}>
                            {isAr ? config.labelAr : config.label}
                        </Badge>

                        {/* Expand Arrow */}
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
                                        <p className="text-sm text-muted-foreground">
                                            {request.description}
                                        </p>
                                    )}

                                    {/* Rejection Reason */}
                                    {request.request_status === 'rejected' && (
                                        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                                            <div className="flex items-center gap-2 mb-1">
                                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                                <span className="text-sm font-medium text-red-600">
                                                    {isAr ? 'سبب الرفض' : 'Rejection Reason'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-red-600/80">
                                                {request.rejection_reason
                                                    || (isAr ? 'لم يتم تحديد سبب' : 'No reason provided')
                                                }
                                            </p>
                                        </div>
                                    )}

                                    {/* Attachments */}
                                    {attachmentCount > 0 && (
                                        <div className="space-y-2">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {isAr ? 'المرفقات' : 'Attachments'}
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
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted/50 hover:bg-muted text-xs transition-colors"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Icon className="h-3.5 w-3.5" />
                                                            <span className="truncate max-w-[120px]">
                                                                {att.file_name || (isAr ? 'ملف' : 'File')}
                                                            </span>
                                                        </a>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Project info */}
                                    {request.project && (
                                        <div className="text-xs text-muted-foreground">
                                            {isAr ? 'المشروع: ' : 'Project: '}
                                            <span className="font-medium">{request.project.name}</span>
                                        </div>
                                    )}

                                    {/* Deadline */}
                                    {request.deadline && (
                                        <div className="text-xs text-muted-foreground">
                                            {isAr ? 'الموعد النهائي: ' : 'Deadline: '}
                                            {format(new Date(request.deadline), 'PPP', {
                                                locale: isAr ? ar : enUS
                                            })}
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

export function RequestsList({ clientUserId, className }: RequestsListProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const { data: requests, isLoading } = useClientRequests(clientUserId)

    if (isLoading) {
        return (
            <div className={cn('space-y-3', className)}>
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
            </div>
        )
    }

    if (!requests || requests.length === 0) {
        return (
            <div className={cn('text-center py-12', className)}>
                <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">
                    {isAr ? 'لا توجد طلبات حتى الآن' : 'No requests yet'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    {isAr
                        ? 'أرسل طلبك الأول باستخدام زر "إرسال طلب"'
                        : 'Submit your first request using the "Submit Request" button'
                    }
                </p>
            </div>
        )
    }

    return (
        <div className={cn('space-y-3', className)}>
            {requests.map((request, index) => (
                <RequestItem
                    key={request.id}
                    request={request}
                    isAr={isAr}
                    index={index}
                />
            ))}
        </div>
    )
}
