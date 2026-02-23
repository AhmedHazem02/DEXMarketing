'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { taskKeys } from './use-tasks'
import { NOTIFICATIONS_KEY } from './use-notifications'

/**
 * Returns a debounced version of `fn` that batches rapid calls.
 * The function runs at most once per `delay` ms.
 */
function useDebouncedCallback<T extends (...args: any[]) => void>(fn: T, delay: number): T {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const fnRef = useRef(fn)
    fnRef.current = fn

    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useCallback(((...args: any[]) => {
        if (timerRef.current) return // already scheduled — skip
        timerRef.current = setTimeout(() => {
            timerRef.current = null
            fnRef.current(...args)
        }, delay)
    }) as unknown as T, [delay])
}

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
 *
 * IMPORTANT: Uses a global singleton subscription + debounced invalidation
 * to prevent the cascade: realtime event → invalidateQueries → refetch →
 * React re-render → RSC payload fetch → dev server logs GET.
 * Multiple components calling this hook share ONE set of channels.
 */

// Global ref-count to ensure only one set of channels exists at a time
let _tasksRealtimeSubscribers = 0
let _tasksRealtimeCleanup: (() => void) | null = null

export function useTasksRealtime() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    // Debounce: batch all realtime events into a single invalidation
    // every 2 seconds instead of firing on every row change
    const debouncedInvalidate = useDebouncedCallback(() => {
        queryClient.invalidateQueries({ queryKey: taskKeys.all })
    }, 2000)

    useEffect(() => {
        _tasksRealtimeSubscribers++

        // Only create channels for the first subscriber
        if (_tasksRealtimeSubscribers === 1) {
            const tasksChannel = supabase
                .channel('db-tasks')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'tasks' },
                    () => { debouncedInvalidate() }
                )
                .subscribe()

            const commentsChannel = supabase
                .channel('db-comments')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'comments' },
                    () => { debouncedInvalidate() }
                )
                .subscribe()

            const attachmentsChannel = supabase
                .channel('db-attachments')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'attachments' },
                    () => { debouncedInvalidate() }
                )
                .subscribe()

            _tasksRealtimeCleanup = () => {
                supabase.removeChannel(tasksChannel)
                supabase.removeChannel(commentsChannel)
                supabase.removeChannel(attachmentsChannel)
            }
        }

        return () => {
            _tasksRealtimeSubscribers--
            if (_tasksRealtimeSubscribers === 0 && _tasksRealtimeCleanup) {
                _tasksRealtimeCleanup()
                _tasksRealtimeCleanup = null
            }
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
