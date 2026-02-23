'use client'

import { useState, useMemo } from 'react'
import { useLocale } from 'next-intl'
import {
    Users, UserCheck, Building2, Search,
    Loader2, CheckCircle2, XCircle, UserPlus
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

import { useCurrentUser, useTeamMembers, getRoleLabel } from '@/hooks/use-users'
import { useClients } from '@/hooks/use-clients'
import { useTeamClientAssignments, useSyncClientAssignments } from '@/hooks/use-client-assignments'
import type { User } from '@/types/database'

type TeamMember = Pick<User, 'id' | 'name' | 'email' | 'role' | 'avatar_url' | 'department'>

export function ClientAssignmentManager() {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const { data: currentUser, isLoading: userLoading } = useCurrentUser()
    const { data: teamMembers, isLoading: membersLoading } = useTeamMembers(currentUser?.id || '')
    const { data: allClients, isLoading: clientsLoading } = useClients()
    const { data: assignments, isLoading: assignmentsLoading } = useTeamClientAssignments(currentUser?.id)
    const syncMutation = useSyncClientAssignments()

    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [pendingChanges, setPendingChanges] = useState<Record<string, Set<string>>>({}) // memberId -> Set of clientIds

    const isLoading = userLoading || membersLoading || clientsLoading || assignmentsLoading

    // Get assignment counts per member from server data + pending changes
    const memberAssignmentCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        if (!assignments) return counts

        // Build from server assignments
        for (const a of assignments) {
            const uid = (a as any).user_id
            counts[uid] = (counts[uid] || 0) + 1
        }

        return counts
    }, [assignments])

    // Build a set of assigned client IDs for the selected member
    const getAssignedClientIds = (memberId: string): Set<string> => {
        // If there are pending changes for this member, use those
        if (pendingChanges[memberId]) {
            return pendingChanges[memberId]
        }

        // Otherwise, build from server data
        const ids = new Set<string>()
        if (assignments) {
            for (const a of assignments) {
                if ((a as any).user_id === memberId) {
                    ids.add((a as any).client_id)
                }
            }
        }
        return ids
    }

    const selectedMemberAssignedIds = selectedMemberId ? getAssignedClientIds(selectedMemberId) : new Set<string>()

    // Filter clients by search
    const filteredClients = useMemo(() => {
        if (!allClients) return []
        if (!searchQuery.trim()) return allClients
        const q = searchQuery.toLowerCase()
        return allClients.filter(c =>
            (c.name || '').toLowerCase().includes(q) ||
            (c.email || '').toLowerCase().includes(q)
        )
    }, [allClients, searchQuery])

    const toggleClient = (clientId: string) => {
        if (!selectedMemberId) return

        const current = new Set(getAssignedClientIds(selectedMemberId))
        if (current.has(clientId)) {
            current.delete(clientId)
        } else {
            current.add(clientId)
        }

        setPendingChanges(prev => ({
            ...prev,
            [selectedMemberId]: current,
        }))
    }

    const selectAllClients = () => {
        if (!selectedMemberId || !allClients) return
        const allIds = new Set(allClients.map(c => c.id))
        setPendingChanges(prev => ({
            ...prev,
            [selectedMemberId]: allIds,
        }))
    }

    const clearAllClients = () => {
        if (!selectedMemberId) return
        setPendingChanges(prev => ({
            ...prev,
            [selectedMemberId]: new Set(),
        }))
    }

    const hasPendingChanges = (memberId: string): boolean => {
        if (!pendingChanges[memberId]) return false
        const serverIds = new Set<string>()
        if (assignments) {
            for (const a of assignments) {
                if ((a as any).user_id === memberId) {
                    serverIds.add((a as any).client_id)
                }
            }
        }
        const pending = pendingChanges[memberId]
        if (pending.size !== serverIds.size) return true
        for (const id of pending) {
            if (!serverIds.has(id)) return true
        }
        return false
    }

    const saveChanges = async (memberId: string) => {
        if (!currentUser?.id || !pendingChanges[memberId]) return

        await syncMutation.mutateAsync({
            userId: memberId,
            clientIds: [...pendingChanges[memberId]],
            assignedBy: currentUser.id,
        })

        // Clear pending changes for this member after successful save
        setPendingChanges(prev => {
            const copy = { ...prev }
            delete copy[memberId]
            return copy
        })
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Skeleton className="h-[400px] rounded-2xl" />
                    <Skeleton className="h-[400px] rounded-2xl lg:col-span-2" />
                </div>
            </div>
        )
    }

    if (!currentUser || !teamMembers) {
        return (
            <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                    {isAr ? 'لم يتم العثور على بيانات الفريق' : 'Team data not found'}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">
                        {isAr ? 'تعيين العملاء للفريق' : 'Assign Clients to Team'}
                    </h2>
                </div>
                <Badge variant="secondary" className="text-xs">
                    {teamMembers.length} {isAr ? 'عضو' : 'members'} · {allClients?.length || 0} {isAr ? 'عميل' : 'clients'}
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: Team Members List */}
                <div className="rounded-2xl border border-border/50 bg-card/50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {isAr ? 'أعضاء الفريق' : 'Team Members'}
                        </h3>
                    </div>
                    <div className="divide-y divide-border/30 max-h-[500px] overflow-y-auto">
                        {teamMembers.map((member: TeamMember) => {
                            const isSelected = selectedMemberId === member.id
                            const count = pendingChanges[member.id]
                                ? pendingChanges[member.id].size
                                : (memberAssignmentCounts[member.id] || 0)
                            const hasChanges = hasPendingChanges(member.id)

                            return (
                                <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => setSelectedMemberId(member.id)}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-4 py-3 text-start transition-colors',
                                        isSelected
                                            ? 'bg-primary/10 border-s-2 border-primary'
                                            : 'hover:bg-muted/50'
                                    )}
                                >
                                    <div className="relative">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={member.avatar_url || ''} />
                                            <AvatarFallback className={cn(
                                                'text-xs font-bold',
                                                isSelected ? 'bg-primary/20 text-primary' : 'bg-muted'
                                            )}>
                                                {member.name?.charAt(0) || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        {hasChanges && (
                                            <div className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-card" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">
                                            {member.name || member.email}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            {getRoleLabel(member.role, isAr)}
                                        </div>
                                    </div>
                                    <Badge
                                        variant={count > 0 ? 'default' : 'secondary'}
                                        className={cn(
                                            'text-[10px] px-1.5 py-0 h-5 rounded-md shrink-0',
                                            count > 0 ? 'bg-primary/10 text-primary border-primary/30' : ''
                                        )}
                                    >
                                        {count} {isAr ? 'عميل' : 'clients'}
                                    </Badge>
                                </button>
                            )
                        })}

                        {teamMembers.length === 0 && (
                            <div className="text-center py-8">
                                <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground">
                                    {isAr ? 'لا يوجد أعضاء في الفريق' : 'No team members found'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Client Assignment Panel */}
                <div className="lg:col-span-2 rounded-2xl border border-border/50 bg-card/50 overflow-hidden">
                    {selectedMemberId ? (
                        <>
                            {/* Member Header */}
                            {(() => {
                                const member = teamMembers.find((m: TeamMember) => m.id === selectedMemberId)
                                if (!member) return null
                                const hasChanges = hasPendingChanges(selectedMemberId)

                                return (
                                    <div className="px-4 py-3 border-b border-border/50 bg-muted/30 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={member.avatar_url || ''} />
                                                <AvatarFallback className="text-xs font-bold bg-primary/20 text-primary">
                                                    {member.name?.charAt(0) || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="text-sm font-semibold">
                                                    {isAr ? `عملاء ${member.name}` : `${member.name}'s Clients`}
                                                </h3>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {selectedMemberAssignedIds.size} {isAr ? 'عميل معيّن' : 'assigned'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {hasChanges && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => saveChanges(selectedMemberId)}
                                                    disabled={syncMutation.isPending}
                                                    className="rounded-xl text-xs h-8"
                                                >
                                                    {syncMutation.isPending ? (
                                                        <Loader2 className="h-3 w-3 animate-spin me-1" />
                                                    ) : (
                                                        <CheckCircle2 className="h-3 w-3 me-1" />
                                                    )}
                                                    {isAr ? 'حفظ التغييرات' : 'Save Changes'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })()}

                            {/* Search + Actions */}
                            <div className="px-4 py-3 border-b border-border/30 flex flex-col sm:flex-row gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder={isAr ? 'بحث عن عميل...' : 'Search clients...'}
                                        className="ps-9 rounded-xl h-9 text-sm"
                                    />
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={selectAllClients}
                                        className="rounded-xl text-xs h-9"
                                    >
                                        <UserCheck className="h-3 w-3 me-1" />
                                        {isAr ? 'تحديد الكل' : 'Select All'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={clearAllClients}
                                        className="rounded-xl text-xs h-9"
                                    >
                                        <XCircle className="h-3 w-3 me-1" />
                                        {isAr ? 'إلغاء الكل' : 'Clear All'}
                                    </Button>
                                </div>
                            </div>

                            {/* Client Grid */}
                            <div className="p-4 max-h-[400px] overflow-y-auto">
                                {filteredClients.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {filteredClients.map(client => {
                                            const isAssigned = selectedMemberAssignedIds.has(client.id)
                                            return (
                                                <button
                                                    key={client.id}
                                                    type="button"
                                                    onClick={() => toggleClient(client.id)}
                                                    className={cn(
                                                        'flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm transition-all duration-200 text-start',
                                                        isAssigned
                                                            ? 'bg-primary/10 border-primary/40 shadow-sm'
                                                            : 'bg-card/50 hover:bg-muted/50 border-border/50'
                                                    )}
                                                >
                                                    <div className="relative">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className={cn(
                                                                'text-[10px] font-bold',
                                                                isAssigned ? 'bg-primary/20 text-primary' : 'bg-muted'
                                                            )}>
                                                                {client.name?.charAt(0)?.toUpperCase() || '?'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        {isAssigned && (
                                                            <div className="absolute -top-0.5 -end-0.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
                                                                <CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className={cn(
                                                            'font-medium text-xs truncate',
                                                            isAssigned ? 'text-primary' : 'text-foreground'
                                                        )}>
                                                            {client.name}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground truncate">
                                                            {client.email || (isAr ? 'بدون بريد' : 'No email')}
                                                        </div>
                                                    </div>
                                                    {client.user_id && (
                                                        <span className="text-emerald-500 text-[10px] shrink-0" title={isAr ? 'لديه حساب' : 'Has account'}>✓</span>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Building2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground">
                                            {searchQuery
                                                ? (isAr ? 'لا توجد نتائج للبحث' : 'No search results')
                                                : (isAr ? 'لا يوجد عملاء متاحين' : 'No clients available')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        // No member selected
                        <div className="flex items-center justify-center h-full min-h-[300px]">
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
                                    <UserPlus className="h-8 w-8 text-muted-foreground/30" />
                                </div>
                                <h3 className="text-sm font-semibold mb-1">
                                    {isAr ? 'اختر عضو من الفريق' : 'Select a Team Member'}
                                </h3>
                                <p className="text-xs text-muted-foreground max-w-[250px]">
                                    {isAr
                                        ? 'اختر عضو من القائمة لتعيين العملاء له'
                                        : 'Choose a member from the list to assign clients to them'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
