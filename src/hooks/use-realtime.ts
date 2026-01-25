'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook to subscribe to real-time updates for a table
 * Automatically invalidates React Query cache when changes occur
 */
export function useRealtimeSubscription(
    table: 'tasks' | 'notifications' | 'comments',
    queryKey: string[]
) {
    const supabase = createClient()
    const queryClient = useQueryClient()

    useEffect(() => {
        const channel = supabase
            .channel(`realtime-${table}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: table,
                },
                () => {
                    // Invalidate the query to refetch
                    queryClient.invalidateQueries({ queryKey })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, queryClient, table, queryKey])
}

/**
 * Hook to subscribe to user-specific notifications
 */
export function useNotificationsRealtime(userId: string) {
    const supabase = createClient()
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!userId) return

        const channel = supabase
            .channel(`notifications-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    // Add new notification to cache
                    queryClient.setQueryData(['notifications', userId], (old: any[] = []) => {
                        return [payload.new, ...old]
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, queryClient, userId])
}

/**
 * Hook to subscribe to task updates for a specific user
 */
export function useTasksRealtime(userId?: string) {
    const supabase = createClient()
    const queryClient = useQueryClient()

    useEffect(() => {
        let filter = undefined
        if (userId) {
            filter = `assigned_to=eq.${userId}`
        }

        const channel = supabase
            .channel('tasks-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks',
                    filter,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['tasks'] })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, queryClient, userId])
}
