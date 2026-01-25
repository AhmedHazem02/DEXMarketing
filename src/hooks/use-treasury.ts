'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Treasury, Transaction, TransactionType } from '@/types/database'

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
                .single()

            if (error) throw error
            return data as unknown as Treasury
        },
    })
}

/**
 * Hook to fetch transactions with optional filters
 */
export function useTransactions(filters?: {
    type?: TransactionType
    startDate?: string
    endDate?: string
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
            if (filters?.startDate) {
                query = query.gte('created_at', filters.startDate)
            }
            if (filters?.endDate) {
                query = query.lte('created_at', filters.endDate)
            }
            if (filters?.limit) {
                query = query.limit(filters.limit)
            }

            const { data, error } = await query
            if (error) throw error
            return data as unknown as Transaction[]
        },
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
                    startDate.setDate(startDate.getDate() - 7)
                    break
                case 'month':
                    startDate.setMonth(startDate.getMonth() - 1)
                    break
                case 'year':
                    startDate.setFullYear(startDate.getFullYear() - 1)
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
    })
}

interface CreateTransactionInput {
    type: TransactionType
    amount: number
    description?: string
    category?: string
    receipt_url?: string
    client_id?: string
    project_id?: string
    created_by?: string
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
                .insert(transaction as any)
                .select()
                .single()

            if (error) throw error
            return data as unknown as Transaction
        },
        onSuccess: () => {
            // Invalidate both treasury and transactions
            queryClient.invalidateQueries({ queryKey: TREASURY_KEY })
            queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
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
            queryClient.invalidateQueries({ queryKey: TREASURY_KEY })
            queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
        },
    })
}
