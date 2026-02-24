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

            // 2. Single query: fetch activity logs with inner join on users filtered by department
            // Combines the previous member IDs query + activity logs query into one
            const { data, error } = await (supabase
                .from('activity_log') as any)
                .select('*, user:users!inner(id, name, email)')
                .eq('users.department', leader.department)
                .eq('users.is_active', true)
                .order('created_at', { ascending: false })
                .limit(limit)

            if (error) throw error
            return (data ?? []) as unknown as ActivityLogWithUser[]
        },
        staleTime: 5 * 60 * 1000,
    })
}
