'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Treasury, Transaction, TransactionType } from '@/types/database'
import { CLIENT_ACCOUNTS_KEY } from './use-client-accounts'

const TREASURY_KEY = ['treasury']
const TRANSACTIONS_KEY = ['transactions']

/**
 * Hook to fetch current treasury balance
 */
export function useTreasury() {
    const supabase = createClient()

    return useQuery({
        queryKey: TREASURY_KEY,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('treasury')
                .select('*')
                .maybeSingle()

            if (error) throw error
            // Return a default treasury object if no row exists
            return (data as unknown as Treasury) ?? { id: '', current_balance: 0, updated_at: new Date().toISOString() } as Treasury
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    })
}

/**
 * Hook to fetch transactions with optional filters
 */
export function useTransactions(filters?: {
    type?: TransactionType
    category?: string
    startDate?: string
    endDate?: string
    minAmount?: number
    maxAmount?: number
    limit?: number
}) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...TRANSACTIONS_KEY, filters],
        queryFn: async () => {
            let query = supabase
                .from('transactions')
                .select('*')
                .order('created_at', { ascending: false })

            if (filters?.type) {
                query = query.eq('type', filters.type)
            }
            if (filters?.category) {
                query = query.eq('category', filters.category)
            }
            if (filters?.startDate) {
                query = query.gte('created_at', filters.startDate)
            }
            if (filters?.endDate) {
                query = query.lte('created_at', filters.endDate)
            }
            if (filters?.minAmount !== undefined) {
                query = query.gte('amount', filters.minAmount)
            }
            if (filters?.maxAmount !== undefined) {
                query = query.lte('amount', filters.maxAmount)
            }
            if (filters?.limit) {
                query = query.limit(filters.limit)
            }

            const { data, error } = await query
            if (error) throw error
            return data as unknown as Transaction[]
        },
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
    })
}

/**
 * Hook to get transaction summary (income vs expense)
 */
export function useTransactionSummary(period?: 'day' | 'week' | 'month' | 'year') {
    const supabase = createClient()

    return useQuery({
        queryKey: [...TRANSACTIONS_KEY, 'summary', period],
        queryFn: async () => {
            let startDate = new Date()

            switch (period) {
                case 'day':
                    startDate.setHours(0, 0, 0, 0)
                    break
                case 'week':
                    startDate.setDate(startDate.getDate() - startDate.getDay())
                    startDate.setHours(0, 0, 0, 0)
                    break
                case 'month':
                    startDate.setDate(1)
                    startDate.setHours(0, 0, 0, 0)
                    break
                case 'year':
                    startDate.setMonth(0, 1)
                    startDate.setHours(0, 0, 0, 0)
                    break
                default:
                    startDate = new Date(0) // All time
            }

            const { data, error } = await supabase
                .from('transactions')
                .select('type, amount')
                .gte('created_at', startDate.toISOString())

            if (error) throw error

            const summary = {
                totalIncome: 0,
                totalExpense: 0,
                netBalance: 0,
            }

                ; (data as unknown as { type: TransactionType; amount: number }[])?.forEach((t) => {
                    if (t.type === 'income') {
                        summary.totalIncome += Number(t.amount)
                    } else {
                        summary.totalExpense += Number(t.amount)
                    }
                })

            summary.netBalance = summary.totalIncome - summary.totalExpense

            return summary
        },
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
    })
}

interface CreateTransactionInput {
    type: TransactionType
    payment_method?: 'cash' | 'transfer' | 'check'
    amount: number
    description?: string
    category?: string
    sub_category?: string
    receipt_url?: string
    client_id?: string
    project_id?: string
    client_account_id?: string
    visible_to_client?: boolean
    notes?: string
    created_by?: string
    transaction_date?: string
}

/**
 * Hook to create a transaction
 */
export function useCreateTransaction() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (transaction: CreateTransactionInput) => {
            const { data, error } = await supabase
                .from('transactions')
                .insert(transaction as never) // Using never to bypass strict type checking for now
                .select()
                .single()

            if (error) throw error
            return data as unknown as Transaction
        },
        onSuccess: () => {
            // Invalidate treasury, transactions, and client accounts
            queryClient.invalidateQueries({ queryKey: TREASURY_KEY })
            queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
            queryClient.invalidateQueries({ queryKey: CLIENT_ACCOUNTS_KEY })
        },
    })
}

/**
 * Hook to update a transaction (Admin only)
 */
export function useUpdateTransaction() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            id,
            updates
        }: {
            id: string
            updates: Partial<Omit<Transaction, 'id' | 'created_at'>>
        }) => {
            const { data, error } = await (supabase
                .from('transactions') as any)
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data as unknown as Transaction
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TREASURY_KEY })
            queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
            queryClient.invalidateQueries({ queryKey: CLIENT_ACCOUNTS_KEY })
        },
    })
}

/**
 * Hook to approve a transaction (Admin only)
 */
export function useApproveTransaction() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            transactionId,
            visibleToClient = true
        }: {
            transactionId: string
            visibleToClient?: boolean
        }) => {
            // Get current user for approved_by
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not authenticated')

            const { data, error } = await (supabase
                .from('transactions') as any)
                .update({
                    is_approved: true,
                    approved_by: user.id,
                    approved_at: new Date().toISOString(),
                    visible_to_client: visibleToClient
                })
                .eq('id', transactionId)
                .select()
                .single()

            if (error) throw error
            return data as unknown as Transaction
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TREASURY_KEY })
            queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
            queryClient.invalidateQueries({ queryKey: CLIENT_ACCOUNTS_KEY })
        },
    })
}

/**
 * Hook to delete a transaction (Admin only - rare operation)
 */
export function useDeleteTransaction() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (transactionId: string) => {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', transactionId)

            if (error) throw error
        },
        onSuccess: () => {
            // Invalidate all related queries to refresh UI
            queryClient.invalidateQueries({ queryKey: TREASURY_KEY })
            queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
            queryClient.invalidateQueries({ queryKey: CLIENT_ACCOUNTS_KEY })
        },
    })
}
