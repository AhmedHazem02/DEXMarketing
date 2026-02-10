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
        const channelName = `realtime-${table}-${queryKey.join('-')}`

        const channel = supabase
            .channel(channelName)
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [table])
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId])
}

/**
 * Hook to subscribe to task updates for a specific user
 * Also listens to comments and attachments changes
 */
export function useTasksRealtime(userId?: string) {
    const supabase = createClient()
    const queryClient = useQueryClient()

    useEffect(() => {
        // Create channels for each table separately
        const tasksChannel = supabase
            .channel('db-tasks')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                (payload) => {
                    queryClient.invalidateQueries({ queryKey: ['tasks'] })
                }
            )
            .subscribe()

        const commentsChannel = supabase
            .channel('db-comments')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'comments' },
                (payload) => {
                    queryClient.invalidateQueries({ queryKey: ['tasks'] })
                }
            )
            .subscribe()

        const attachmentsChannel = supabase
            .channel('db-attachments')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'attachments' },
                (payload) => {
                    queryClient.invalidateQueries({ queryKey: ['tasks'] })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(tasksChannel)
            supabase.removeChannel(commentsChannel)
            supabase.removeChannel(attachmentsChannel)
        }
    }, []) // Empty dependency - only subscribe once
}
