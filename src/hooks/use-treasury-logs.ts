'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { TreasuryLog, User, Client } from '@/types/database'

// Query keys
const TREASURY_LOGS_KEY = ['treasury-logs'] as const

/**
 * Extended Treasury Log with relations
 */
export interface TreasuryLogWithRelations extends TreasuryLog {
    performer?: Pick<User, 'id' | 'name' | 'email'>
    client?: Pick<Client, 'id' | 'name'> & { user?: Pick<User, 'id' | 'name' | 'email'> | null }
}

/**
 * Filters for treasury logs
 */
export interface TreasuryLogsFilters {
    action?: string
    clientId?: string
    performedBy?: string
    startDate?: string
    endDate?: string
    search?: string
}

/**
 * Hook to fetch treasury logs with filters (Admin only)
 */
export function useTreasuryLogs(filters?: TreasuryLogsFilters) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...TREASURY_LOGS_KEY, filters],
        queryFn: async () => {
            let query = supabase
                .from('treasury_logs')
                .select(`
                    *,
                    performer:users!treasury_logs_performed_by_fkey(id, name, email),
                    client:clients(id, name, user:users(id, name, email))
                `)
                .order('created_at', { ascending: false })
                .limit(100)

            // Apply filters
            if (filters?.action) {
                query = query.eq('action', filters.action)
            }

            if (filters?.clientId) {
                query = query.eq('client_id', filters.clientId)
            }

            if (filters?.performedBy) {
                query = query.eq('performed_by', filters.performedBy)
            }

            if (filters?.startDate) {
                query = query.gte('created_at', filters.startDate)
            }

            if (filters?.endDate) {
                query = query.lte('created_at', filters.endDate)
            }

            const { data, error } = await query

            if (error) throw error

            // Client-side search filter
            let results = data as unknown as TreasuryLogWithRelations[]

            if (filters?.search) {
                const searchLower = filters.search.toLowerCase()
                results = results.filter(
                    (log) =>
                        log.client_name?.toLowerCase().includes(searchLower) ||
                        log.description?.toLowerCase().includes(searchLower) ||
                        log.category?.toLowerCase().includes(searchLower) ||
                        log.performer?.name?.toLowerCase().includes(searchLower)
                )
            }

            return results
        },
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
    })
}

/**
 * Hook to fetch logs for a specific transaction
 */
export function useTransactionLogs(transactionId: string | undefined) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...TREASURY_LOGS_KEY, 'transaction', transactionId],
        queryFn: async () => {
            if (!transactionId) return []

            const { data, error } = await supabase
                .from('treasury_logs')
                .select(`
                    *,
                    performer:users!treasury_logs_performed_by_fkey(id, name, email)
                `)
                .eq('transaction_id', transactionId)
                .order('created_at', { ascending: true })

            if (error) throw error
            return data as unknown as TreasuryLogWithRelations[]
        },
        enabled: !!transactionId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}

/**
 * Hook to fetch recent activity (last N logs)
 */
export function useRecentTreasuryActivity(limit: number = 10) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...TREASURY_LOGS_KEY, 'recent', limit],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('treasury_logs')
                .select(`
                    *,
                    performer:users!treasury_logs_performed_by_fkey(id, name, email),
                    client:clients(id, name)
                `)
                .order('created_at', { ascending: false })
                .limit(limit)

            if (error) throw error
            return data as unknown as TreasuryLogWithRelations[]
        },
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 60 * 1000, // Auto-refresh every minute
    })
}

/**
 * Hook to get activity statistics
 */
export function useTreasuryActivityStats(startDate?: string, endDate?: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...TREASURY_LOGS_KEY, 'stats', { startDate, endDate }],
        queryFn: async () => {
            let query = supabase
                .from('treasury_logs')
                .select('action, amount')

            if (startDate) {
                query = query.gte('created_at', startDate)
            }

            if (endDate) {
                query = query.lte('created_at', endDate)
            }

            const { data, error } = await query

            if (error) throw error

            // Calculate statistics
            const logs = data as any[] || []
            const stats = {
                total: logs.length,
                creates: logs.filter(log => log.action === 'create').length,
                updates: logs.filter(log => log.action === 'update').length,
                deletes: logs.filter(log => log.action === 'delete').length,
                approvals: logs.filter(log => log.action === 'approve').length,
                rejections: logs.filter(log => log.action === 'reject').length,
            }

            return stats
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}
