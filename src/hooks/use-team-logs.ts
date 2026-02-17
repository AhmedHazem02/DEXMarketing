'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ActivityLog } from '@/types/database'

const TEAM_LOGS_KEY = ['team-activity-log']

// ============================================
// Activity log filtered by team members
// ============================================

export type ActivityLogWithUser = ActivityLog & {
    user: { id: string; name: string; email: string } | null
}

export function useTeamActivityLog(teamLeaderId: string, limit = 100) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...TEAM_LOGS_KEY, teamLeaderId, limit],
        enabled: !!teamLeaderId,
        queryFn: async () => {
            // 1. Get leader's department
            const { data: leader, error: leaderErr } = await supabase
                .from('users')
                .select('department')
                .eq('id', teamLeaderId)
                .single() as { data: { department: string | null } | null; error: unknown }

            if (leaderErr) throw leaderErr
            if (!leader?.department) return []

            // 2. Get all team member IDs in the same department
            const { data: members, error: membersErr } = await supabase
                .from('users')
                .select('id')
                .eq('department', leader.department)
                .eq('is_active', true) as { data: { id: string }[] | null; error: unknown }

            if (membersErr) throw membersErr
            if (!members || members.length === 0) return []

            const memberIds = members.map(m => m.id)
            // Include the leader themselves
            if (!memberIds.includes(teamLeaderId)) {
                memberIds.push(teamLeaderId)
            }

            // 3. Fetch activity logs for these members
            const { data, error } = await supabase
                .from('activity_log')
                .select('*, user:users(id, name, email)')
                .in('user_id', memberIds)
                .order('created_at', { ascending: false })
                .limit(limit)

            if (error) throw error
            return (data ?? []) as unknown as ActivityLogWithUser[]
        },
        staleTime: 5 * 60 * 1000,
    })
}
