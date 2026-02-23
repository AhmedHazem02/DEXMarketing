'use client'

import { useMemo } from 'react'
import {
    Clock, MapPin, Building2,
    Edit2, Trash2, CheckCircle2,
    Users, AlertTriangle, X
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Tooltip, TooltipContent, TooltipTrigger
} from '@/components/ui/tooltip'

import {
    SCHEDULE_STATUS_CONFIG, getScheduleStatusConfig,
    isScheduleOverdue, OVERDUE_CONFIG,
    APPROVAL_STATUS_CONFIG
} from '@/types/schedule'
import type { ScheduleWithRelations, ScheduleStatus } from '@/types/schedule'
import type { User } from '@/types/database'
import { getRoleLabel } from '@/hooks/use-users'
import { getStatusDot, getStatusBadgeClasses, getCardBorderClass } from './schedule-helpers'

export interface ScheduleCardProps {
    schedule: ScheduleWithRelations
    isAr: boolean
    memberMap: Map<string, Pick<User, 'id' | 'name' | 'avatar_url' | 'role'>>
    onEdit: () => void
    onDelete: (id: string) => void
    onStatusChange: (status: ScheduleStatus) => void
    isAccountManager?: boolean
    onApproval?: (id: string, status: 'approved' | 'rejected') => void
}

export function ScheduleCard({ schedule, isAr, memberMap, onEdit, onDelete, onStatusChange, isAccountManager, onApproval }: ScheduleCardProps) {
    const overdue = isScheduleOverdue(schedule)
    const statusCfg = overdue ? OVERDUE_CONFIG : getScheduleStatusConfig(schedule.status)

    const members = useMemo(() => 
        (schedule.assigned_members || [])
            .map(id => memberMap.get(id))
            .filter(Boolean) as Pick<User, 'id' | 'name' | 'avatar_url' | 'role'>[],
        [schedule.assigned_members, memberMap]
    )

    return (
        <div className={cn(
            'group relative rounded-xl glass-dashboard p-4 transition-all duration-300 hover:translate-y-[-1px]',
            getCardBorderClass(schedule.status, overdue),
            overdue && '!border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.1)]',
            schedule.status === 'completed' && '!border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.08)]',
        )}>
            {/* Status accent line */}
            <div className={cn(
                'absolute top-0 start-0 w-1 h-full rounded-s-xl',
                getStatusDot(schedule.status, overdue)
            )} />

            <div className="ps-3">
                {/* Top row: title + actions */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm truncate">{schedule.title}</h4>
                            <Badge
                                variant="outline"
                                className={cn('shrink-0 text-[10px] px-2 py-0 h-5 rounded-md border', getStatusBadgeClasses(schedule.status, overdue))}
                            >
                                {overdue
                                    ? (isAr ? 'متأخر' : 'Overdue')
                                    : (isAr ? statusCfg?.labelAr : statusCfg?.label)}
                            </Badge>
                        </div>

                        {schedule.schedule_type && (
                            <div className="mb-1.5">
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        'text-[10px] px-2 py-0 h-5 rounded-md border font-semibold',
                                        schedule.schedule_type === 'reels'
                                            ? 'bg-violet-500/10 text-violet-500 border-violet-500/30'
                                            : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                                    )}
                                >
                                    {schedule.schedule_type === 'reels'
                                        ? (isAr ? '📹 ريلز' : '📹 Reel')
                                        : (isAr ? '📝 بوست' : '📝 Post')}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-lg hover:bg-muted"
                                    onClick={onEdit}
                                >
                                    <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{isAr ? 'تعديل' : 'Edit'}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-lg hover:bg-destructive/10 text-destructive"
                                    onClick={() => onDelete(schedule.id)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{isAr ? 'حذف' : 'Delete'}</TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Info chips */}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                    {schedule.start_time && (
                        <div className="flex items-center gap-1 text-xs bg-muted/30 text-muted-foreground px-2 py-1 rounded-lg">
                            <Clock className="h-3 w-3" />
                            {schedule.start_time.slice(0, 5)}
                            {schedule.end_time && (
                                <span className="text-muted-foreground/60">
                                    → {schedule.end_time.slice(0, 5)}
                                </span>
                            )}
                        </div>
                    )}
                    {schedule.location && (
                        <div className="flex items-center gap-1 text-xs bg-muted/30 text-muted-foreground px-2 py-1 rounded-lg">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">{schedule.location}</span>
                        </div>
                    )}
                    {schedule.client && (
                        <div className="flex items-center gap-1 text-xs bg-primary/5 text-primary px-2 py-1 rounded-lg">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">{schedule.client?.name}</span>
                        </div>
                    )}
                </div>

                {/* Assigned Members */}
                {members.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                        <Users className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                        <div className="flex -space-x-1.5">
                            {members.slice(0, 6).map(member => (
                                <Tooltip key={member.id}>
                                    <TooltipTrigger asChild>
                                            <Avatar className="h-7 w-7 border-2 border-card ring-0">
                                                <AvatarImage src={member.avatar_url || ''} />
                                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                                                    {member.name?.charAt(0) || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="text-xs">
                                            <p className="font-semibold">{member.name}</p>
                                            <p className="text-muted-foreground">
                                                {getRoleLabel(member.role, isAr)}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                        </div>
                        {members.length > 6 && (
                            <span className="text-[10px] text-muted-foreground">
                                +{members.length - 6}
                            </span>
                        )}
                        <span className="text-xs text-muted-foreground/60 ms-1">
                            {members.map(m => m.name?.split(' ')[0]).join(' · ')}
                        </span>
                    </div>
                )}

                {/* Notes */}
                {schedule.notes && (
                    <p className="text-xs text-muted-foreground/60 mt-2 line-clamp-1 italic">
                        {schedule.notes}
                    </p>
                )}

                {/* Approval Status & Missing Items */}
                {(schedule.approval_status || schedule.missing_items) && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-border/20">
                        {schedule.approval_status && (
                            <Badge
                                variant="outline"
                                className={cn(
                                    'text-[10px] px-2 py-0 h-5 rounded-md border',
                                    schedule.approval_status === 'approved' && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
                                    schedule.approval_status === 'rejected' && 'bg-red-500/10 text-red-600 border-red-500/30',
                                    schedule.approval_status === 'pending' && 'bg-amber-500/10 text-amber-600 border-amber-500/30',
                                )}
                            >
                                {isAr
                                    ? APPROVAL_STATUS_CONFIG.find(c => c.id === schedule.approval_status)?.labelAr
                                    : APPROVAL_STATUS_CONFIG.find(c => c.id === schedule.approval_status)?.label}
                            </Badge>
                        )}
                        {schedule.missing_items && (
                            <Badge
                                variant="outline"
                                className={cn(
                                    'text-[10px] px-2 py-0 h-5 rounded-md border',
                                    schedule.missing_items_status === 'pending' && 'bg-orange-500/10 text-orange-600 border-orange-500/30',
                                    schedule.missing_items_status === 'resolved' && 'bg-green-500/10 text-green-600 border-green-500/30',
                                    schedule.missing_items_status === 'not_applicable' && 'bg-gray-400/10 text-gray-500 border-gray-400/30',
                                )}
                            >
                                <AlertTriangle className="h-3 w-3 me-1" />
                                {isAr ? 'نواقص' : 'Missing'}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Manager Notes */}
                {schedule.manager_notes && (
                    <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-blue-500/5 border border-blue-500/20">
                        <p className="text-[10px] font-semibold text-blue-600 mb-0.5">{isAr ? 'ملاحظات المدير' : 'Manager Notes'}</p>
                        <p className="text-xs text-blue-600/80 line-clamp-2">{schedule.manager_notes}</p>
                    </div>
                )}

                {/* Account Manager Approval Controls */}
                {isAccountManager && onApproval && schedule.approval_status !== 'approved' && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-xs rounded-lg bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
                            onClick={() => onApproval(schedule.id, 'approved')}
                        >
                            <CheckCircle2 className="h-3 w-3 me-1" />
                            {isAr ? 'موافقة' : 'Approve'}
                        </Button>
                        {schedule.approval_status !== 'rejected' && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-7 text-xs rounded-lg bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20"
                                onClick={() => onApproval(schedule.id, 'rejected')}
                            >
                                <X className="h-3 w-3 me-1" />
                                {isAr ? 'رفض' : 'Reject'}
                            </Button>
                        )}
                    </div>
                )}

                {/* Status Change Dropdown */}
                <div className="mt-3 pt-3 border-t border-border/20">
                    <Select value={schedule.status} onValueChange={(v) => onStatusChange(v as ScheduleStatus)}>
                        <SelectTrigger className="h-8 rounded-lg text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SCHEDULE_STATUS_CONFIG.map(cfg => (
                                <SelectItem key={cfg.id} value={cfg.id}>
                                    <span className="text-xs">{isAr ? cfg.labelAr : cfg.label}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )
}
