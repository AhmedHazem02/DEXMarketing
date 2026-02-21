'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { taskKeys } from './use-tasks'
import { NOTIFICATIONS_KEY } from './use-notifications'

/**
 * Hook to subscribe to real-time updates for a table
 * Automatically invalidates React Query cache when changes occur
 */
export function useRealtimeSubscription(
    table: 'tasks' | 'notifications' | 'comments' | 'client_accounts' | 'transactions',
    queryKey: string[]
) {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const queryKeyRef = useRef(queryKey)
    queryKeyRef.current = queryKey

    useEffect(() => {
        const channelName = `realtime-${table}-${queryKeyRef.current.join('-')}`

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
                    queryClient.invalidateQueries({ queryKey: queryKeyRef.current })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [table, queryClient])
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
                    // Add new notification to cache optimistically
                    queryClient.setQueryData([...NOTIFICATIONS_KEY, userId], (old: any[] = []) => {
                        // Prevent duplicates
                        const exists = old.some((n: any) => n.id === payload.new.id)
                        if (exists) return old
                        return [payload.new, ...old].slice(0, 50)
                    })
                    // Also invalidate to ensure fresh data
                    queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_KEY, userId] })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, queryClient])
}

/**
 * Hook to subscribe to task updates for a specific user
 * Also listens to comments and attachments changes
 */
export function useTasksRealtime() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    useEffect(() => {
        // Create channels for each table separately
        const tasksChannel = supabase
            .channel('db-tasks')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                () => {
                    queryClient.invalidateQueries({ queryKey: taskKeys.all })
                }
            )
            .subscribe()

        const commentsChannel = supabase
            .channel('db-comments')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'comments' },
                () => {
                    queryClient.invalidateQueries({ queryKey: taskKeys.all })
                }
            )
            .subscribe()

        const attachmentsChannel = supabase
            .channel('db-attachments')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'attachments' },
                () => {
                    queryClient.invalidateQueries({ queryKey: taskKeys.all })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(tasksChannel)
            supabase.removeChannel(commentsChannel)
            supabase.removeChannel(attachmentsChannel)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryClient])
}

/**
 * Hook to subscribe to real-time updates for client accounts and transactions
 * Automatically updates client balance when transactions are created/updated
 */
export function useClientAccountsRealtimeSync() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    const { CLIENT_ACCOUNTS_KEY } = require('./use-client-accounts')

    useEffect(() => {
        // Listen to client_accounts changes
        const accountsChannel = supabase
            .channel('db-client-accounts')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'client_accounts' },
                () => {
                    queryClient.invalidateQueries({ queryKey: CLIENT_ACCOUNTS_KEY })
                }
            )
            .subscribe()

        // Listen to transactions changes - invalidates accounts since it affects balance
        const transactionsChannel = supabase
            .channel('db-transactions-balance')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'transactions' },
                () => {
                    queryClient.invalidateQueries({ queryKey: CLIENT_ACCOUNTS_KEY })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(accountsChannel)
            supabase.removeChannel(transactionsChannel)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryClient])
}
