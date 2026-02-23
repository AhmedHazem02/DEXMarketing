'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
    Calendar as CalendarIcon, Plus, Building2, Loader2,
    Edit2, CheckCircle2, Users, AlertTriangle, X, Bug
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { EmojiTextarea } from '@/components/ui/emoji-textarea'
import { LinksInput } from '@/components/ui/links-input'
import { ImageUploader } from '@/components/ui/image-uploader'

import { useClients } from '@/hooks/use-clients'
import { useMyAssignedClients } from '@/hooks/use-client-assignments'
import { useCurrentUser, useTeamMembers, getRoleLabel } from '@/hooks/use-users'
import {
    SCHEDULE_STATUS_CONFIG, SCHEDULE_TYPE_CONFIG,
    MISSING_ITEMS_STATUS_CONFIG
} from '@/types/schedule'
import type { ScheduleWithRelations, ScheduleStatus } from '@/types/schedule'
import type { Department, ScheduleType, ScheduleLink, MissingItemsStatus } from '@/types/database'

export interface ScheduleFormProps {
    teamLeaderId: string
    initialDate?: string
    schedule?: ScheduleWithRelations | null
    isLoading: boolean
    onSubmit: (data: any) => void
    defaultClientId?: string
    userRole?: string
    simplifiedForm?: boolean
}

export function ScheduleForm({ teamLeaderId, initialDate, schedule, isLoading, onSubmit, defaultClientId, userRole, simplifiedForm = false }: ScheduleFormProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const { data: currentUser } = useCurrentUser()
    const { data: allClients } = useClients()
    const { data: assignedClients } = useMyAssignedClients(currentUser?.id)
    const { data: teamMembers } = useTeamMembers(teamLeaderId)

    // Team members (creator, designer, videographer, photographer, editor) see only assigned clients
    // Leaders (team_leader, account_manager) and admin see all clients
    const isTeamMember = ['creator', 'designer', 'videographer', 'photographer', 'editor'].includes(currentUser?.role || '')
    const clients = isTeamMember ? assignedClients : allClients

    const [title, setTitle] = useState(schedule?.title || '')
    const [date] = useState(schedule?.scheduled_date || initialDate || format(new Date(), 'yyyy-MM-dd'))
    const [time, setTime] = useState(schedule?.start_time?.slice(0, 5) || '')
    const [endTime, setEndTime] = useState(schedule?.end_time?.slice(0, 5) || '')
    const [location, setLocation] = useState(schedule?.location || '')
    const [description, setDescription] = useState(schedule?.description || '')
    const [notes, setNotes] = useState(schedule?.notes || '')
    const [status, setStatus] = useState<ScheduleStatus>(schedule?.status || 'scheduled')
    const [clientId, setClientId] = useState(schedule?.client_id || defaultClientId || 'no-client')
    const [department, setDepartment] = useState<Department>(schedule?.department || (currentUser?.department || 'photography'))
    const [assignedMembers, setAssignedMembers] = useState<string[]>(schedule?.assigned_members || [])
    const [scheduleType, setScheduleType] = useState<ScheduleType>(schedule?.schedule_type || 'post')
    const [missingItems, setMissingItems] = useState(schedule?.missing_items || '')
    const [missingItemsStatus, setMissingItemsStatus] = useState<MissingItemsStatus>(schedule?.missing_items_status || 'not_applicable')
    const [links, setLinks] = useState<ScheduleLink[]>(schedule?.links || [])
    const [images, setImages] = useState<string[]>(schedule?.images || [])

    // Simplified form: hide endTime & team members (for content department)
    const isSimplified = simplifiedForm || userRole === 'creator' || currentUser?.role === 'creator'

    const toggleMember = (memberId: string) => {
        setAssignedMembers(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        )
    }

    const selectAllMembers = () => {
        if (teamMembers) {
            setAssignedMembers(teamMembers.map(m => m.id))
        }
    }

    const clearAllMembers = () => {
        setAssignedMembers([])
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const selectedClient = clients?.find(c => c.id === clientId)
        const companyName = selectedClient ? (selectedClient.name || selectedClient.company) : title
        onSubmit({
            title,
            company_name: companyName,
            scheduled_date: date,
            start_time: isSimplified ? '00:00' : (time || '00:00'),
            end_time: isSimplified ? null : (endTime || null),
            location: isSimplified ? null : (location || null),
            description: description || null,
            notes: notes || null,
            status,
            client_id: clientId === 'no-client' ? null : clientId,
            department,
            assigned_members: assignedMembers,
            team_leader_id: teamLeaderId,
            schedule_type: scheduleType,
            missing_items: isSimplified ? null : (missingItems || null),
            missing_items_status: isSimplified ? 'not_applicable' : (missingItems.trim() ? missingItemsStatus : 'not_applicable'),
            links: isSimplified ? [] : links.filter(l => l.url.trim()),
            images: isSimplified ? [] : images,
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            {/* Title */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? 'العنوان' : 'Title'} *
                </Label>
                <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    className="rounded-xl"
                    placeholder={isAr ? 'مثال: تصوير منتجات' : 'e.g. Product Photoshoot'}
                />
            </div>

            {/* Schedule Type */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? 'نوع المحتوى' : 'Content Type'} *
                </Label>
                <Select value={scheduleType} onValueChange={(v) => setScheduleType(v as ScheduleType)}>
                    <SelectTrigger className="rounded-xl">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {SCHEDULE_TYPE_CONFIG.map(cfg => (
                            <SelectItem key={cfg.id} value={cfg.id}>
                                <span className="flex items-center gap-2">
                                    <span>{cfg.icon}</span>
                                    <span>{isAr ? cfg.labelAr : cfg.label}</span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Date & Time */}
            <div className={cn("grid gap-3", isSimplified ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-3")}>
                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {isAr ? 'التاريخ' : 'Date'}
                    </Label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-muted/30 text-sm">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{date ? format(new Date(date + 'T00:00:00'), 'dd MMM yyyy', { locale: isAr ? ar : enUS }) : (isAr ? 'اختر من التقويم' : 'Select from calendar')}</span>
                    </div>
                </div>
                {!isSimplified && (
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {isAr ? 'من' : 'From'}
                        </Label>
                        <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="rounded-xl" />
                    </div>
                )}
                {!isSimplified && (
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {isAr ? 'إلى' : 'To'}
                        </Label>
                        <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="rounded-xl" />
                    </div>
                )}
            </div>

            {/* Client */}
            <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5" />
                            {isAr ? 'العميل' : 'Client'}
                        </span>
                        {clients && clients.length > 0 && (
                            <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {clients.length} {isAr ? 'عميل' : 'clients'}
                            </span>
                        )}
                    </Label>
                    <Select value={clientId} onValueChange={setClientId}>
                        <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder={isAr ? 'اختر العميل (اختياري)' : 'Select client (optional)'} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {/* No Client Option */}
                            <SelectItem value="no-client">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">
                                            {isAr ? 'بدون عميل' : 'No Client'}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            {isAr ? 'مهمة عامة' : 'General task'}
                                        </div>
                                    </div>
                                </div>
                            </SelectItem>
                            
                            {clients && clients.length > 0 ? (
                                <>
                                    <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-t mt-1 pt-2">
                                        {isAr ? 'العملاء المتاحين' : 'Available Clients'}
                                    </div>
                                    {clients.map(client => {
                                        const hasUserAccount = !!client.user_id
                                        return (
                                            <SelectItem key={client.id} value={client.id}>
                                                <div className="flex items-center gap-2.5 py-1">
                                                    <Avatar className="h-8 w-8 border border-border/50">
                                                        <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-primary/20 to-primary/5">
                                                            {(client.name || client.company)?.charAt(0)?.toUpperCase() || '?'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-medium text-sm truncate">
                                                                {client.name || client.company}
                                                            </span>
                                                            {hasUserAccount && (
                                                                <span className="text-emerald-500" title={isAr ? 'لديه حساب - يمكنه الدخول' : 'Has account - Can login'}>
                                                                    ✓
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground truncate">
                                                            {hasUserAccount 
                                                                ? (client.email || (client.phone ? `📱 ${client.phone}` : (isAr ? 'لديه حساب' : 'Has account')))
                                                                : (isAr ? '⚠️ بدون حساب - لن يرى الجدولة' : '⚠️ No account - Won\'t see schedule')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        )
                                    })}
                                </>
                            ) : (
                                <div className="px-3 py-6 text-center">
                                    <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mx-auto mb-2">
                                        <Users className="h-6 w-6 text-muted-foreground/30" />
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-1 font-medium">
                                        {isTeamMember
                                            ? (isAr ? 'لا يوجد عملاء معيّنين لك' : 'No clients assigned to you')
                                            : (isAr ? 'لا يوجد عملاء' : 'No clients yet')}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground/60">
                                        {isTeamMember
                                            ? (isAr ? 'تواصل مع قائد الفريق لتعيين عملاء لك' : 'Contact your team leader to assign clients')
                                            : (isAr ? 'قم بإضافة عميل جديد أولاً' : 'Add a new client first')}
                                    </p>
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                    {/* Warning if client has no account */}
                    {clientId && clientId !== 'no-client' && clients?.find(c => c.id === clientId && !c.user_id) && (
                        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            <div className="flex-1 text-[11px] text-amber-600 dark:text-amber-400">
                                <p className="font-semibold mb-0.5">
                                    {isAr ? '⚠️ تنبيه: هذا العميل ليس لديه حساب' : '⚠️ Warning: This client has no account'}
                                </p>
                                <p className="text-amber-600/80 dark:text-amber-400/80">
                                    {isAr 
                                        ? 'لن يتمكن من رؤية هذه الجدولة في لوحة التحكم الخاصة به. قم بإنشاء حساب له أولاً.'
                                        : 'They won\'t be able to see this schedule in their dashboard. Create an account for them first.'}
                                </p>
                            </div>
                        </div>
                    )}
                    {/* Debug tip for admins */}
                    {clientId && clientId !== 'no-client' && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/30 text-xs text-muted-foreground">
                            <Bug className="h-3.5 w-3.5 shrink-0" />
                            <span>
                                {isAr 
                                    ? 'للتشخيص: اذهب إلى Admin → 🔍 تشخيص الجدولات'
                                    : 'Debug: Go to Admin → 🔍 Debug Schedules'}
                            </span>
                        </div>
                    )}
                </div>

            {/* Location */}
            {!isSimplified && (
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? 'الموقع' : 'Location'}
                </Label>
                <Input
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="rounded-xl"
                    placeholder={isAr ? 'عنوان أو رابط الموقع' : 'Address or location link'}
                />
            </div>
            )}

            {/* Team Members */}
            {!isSimplified && (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" />
                        {isAr ? 'أعضاء الفريق' : 'Team Members'}
                        {assignedMembers.length > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-md">
                                {assignedMembers.length}
                            </Badge>
                        )}
                    </Label>
                    {teamMembers && teamMembers.length > 0 && (
                        <div className="flex gap-1.5">
                            <button
                                type="button"
                                onClick={selectAllMembers}
                                className="text-[10px] text-primary hover:underline font-medium"
                            >
                                {isAr ? 'تحديد الكل' : 'Select all'}
                            </button>
                            {assignedMembers.length > 0 && (
                                <>
                                    <span className="text-muted-foreground/30">|</span>
                                    <button
                                        type="button"
                                        onClick={clearAllMembers}
                                        className="text-[10px] text-muted-foreground hover:underline font-medium"
                                    >
                                        {isAr ? 'إلغاء الكل' : 'Clear'}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
                {teamMembers && teamMembers.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                        {teamMembers.map(member => {
                            const isSelected = assignedMembers.includes(member.id)
                            return (
                                <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => toggleMember(member.id)}
                                    className={cn(
                                        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm transition-all duration-200',
                                        isSelected
                                            ? 'bg-primary/10 border-primary/40 shadow-sm'
                                            : 'bg-card/50 hover:bg-muted/50 border-border/50'
                                    )}
                                >
                                    <div className="relative">
                                        <Avatar className="h-7 w-7">
                                            <AvatarImage src={member.avatar_url || ''} />
                                            <AvatarFallback className={cn(
                                                'text-[10px] font-bold',
                                                isSelected ? 'bg-primary/20 text-primary' : 'bg-muted'
                                            )}>
                                                {member.name?.charAt(0) || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        {isSelected && (
                                            <div className="absolute -top-0.5 -end-0.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
                                                <CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-start min-w-0">
                                        <div className={cn(
                                            'font-medium text-xs truncate',
                                            isSelected ? 'text-primary' : 'text-foreground'
                                        )}>
                                            {member.name}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground truncate">
                                            {getRoleLabel(member.role, isAr)}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-4 rounded-xl border border-dashed border-border/50">
                        <Users className="h-5 w-5 text-muted-foreground/30 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">
                            {isAr ? 'لا يوجد أعضاء فريق متاحين' : 'No team members available'}
                        </p>
                    </div>
                )}
            </div>
            )}

            {/* Department - Read Only */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? 'القسم' : 'Department'}
                </Label>
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-primary/30 bg-primary/5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        {department === 'photography' ? (
                            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        ) : (
                            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-sm text-foreground">
                            {department === 'photography' 
                                ? (isAr ? 'التصوير' : 'Photography')
                                : (isAr ? 'المحتوى' : 'Content')}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                            {isAr ? 'قسمك الحالي' : 'Your current department'}
                        </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 h-5 rounded-md">
                        {isAr ? 'تلقائي' : 'Auto'}
                    </Badge>
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? 'الوصف' : 'Description'}
                </Label>
                <EmojiTextarea
                    value={description}
                    onChange={setDescription}
                    rows={2}
                    className="rounded-xl resize-none"
                    placeholder={isAr ? 'وصف تفصيلي...' : 'Detailed description...'}
                />
            </div>

            {/* Status (editing only) */}
            {schedule && (
                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {isAr ? 'الحالة' : 'Status'}
                    </Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as ScheduleStatus)}>
                        <SelectTrigger className="rounded-xl">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SCHEDULE_STATUS_CONFIG.map(cfg => (
                                <SelectItem key={cfg.id} value={cfg.id}>
                                    {isAr ? cfg.labelAr : cfg.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? 'ملاحظات' : 'Notes'}
                </Label>
                <EmojiTextarea
                    value={notes}
                    onChange={setNotes}
                    rows={3}
                    className="rounded-xl resize-none"
                    placeholder={isAr ? 'ملاحظات إضافية... يمكنك استخدام الإيموجي 😊' : 'Additional notes... You can use emoji 😊'}
                />
            </div>

            {/* Missing Items */}
            {!isSimplified && (
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {isAr ? 'النواقص' : 'Missing Items'}
                </Label>
                <EmojiTextarea
                    value={missingItems}
                    onChange={(val) => {
                        setMissingItems(val)
                        if (val.trim() && missingItemsStatus === 'not_applicable') {
                            setMissingItemsStatus('pending')
                        } else if (!val.trim()) {
                            setMissingItemsStatus('not_applicable')
                        }
                    }}
                    rows={2}
                    className="rounded-xl resize-none"
                    placeholder={isAr ? 'مثال: المنيو، الشعار، صور المنتجات...' : 'e.g. Menu, Logo, Product photos...'}
                />
                {missingItems.trim() && (
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
                )}
            </div>
            )}

            {/* Links */}
            {!isSimplified && (
            <LinksInput
                value={links}
                onChange={setLinks}
                maxLinks={10}
            />
            )}

            {/* Images */}
            {!isSimplified && (
            <ImageUploader
                value={images}
                onChange={setImages}
                maxImages={10}
            />
            )}

            {/* Submit */}
            <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl h-11 text-sm font-semibold shadow-lg shadow-primary/20"
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : schedule ? (
                    <>
                        <Edit2 className="h-4 w-4 me-2" />
                        {isAr ? 'تحديث الجدولة' : 'Update Schedule'}
                    </>
                ) : (
                    <>
                        <Plus className="h-4 w-4 me-2" />
                        {isAr ? 'إنشاء الجدولة' : 'Create Schedule'}
                    </>
                )}
            </Button>
        </form>
    )
}
