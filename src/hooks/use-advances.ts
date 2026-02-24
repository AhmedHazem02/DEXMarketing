'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Advance, AdvanceRecipientType } from '@/types/database'

const ADVANCES_KEY = ['advances']
const TREASURY_KEY = ['treasury']
const TRANSACTIONS_KEY = ['transactions']

/**
 * Hook to fetch advances with optional date filters
 */
export function useAdvances(filters?: {
    startDate?: string
    endDate?: string
}) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...ADVANCES_KEY, filters],
        queryFn: async () => {
            let query = supabase
                .from('advances')
                .select('*')
                .order('created_at', { ascending: false })

            if (filters?.startDate) {
                query = query.gte('created_at', filters.startDate)
            }
            if (filters?.endDate) {
                // Add a day to include the full end date
                const endDate = new Date(filters.endDate)
                endDate.setDate(endDate.getDate() + 1)
                query = query.lt('created_at', endDate.toISOString())
            }

            const { data, error } = await query
            if (error) throw error
            return data as unknown as Advance[]
        },
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
    })
}

interface CreateAdvanceInput {
    recipient_type: AdvanceRecipientType
    recipient_name: string
    amount: number
    notes?: string
}

/**
 * Hook to create an advance.
 * This creates an expense transaction first (which auto-deducts from treasury via trigger),
 * then creates the advance record linked to that transaction.
 */
export function useCreateAdvance() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (input: CreateAdvanceInput) => {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not authenticated')

            const recipientLabel = input.recipient_type === 'owner' ? 'مالك' : 'موظف'

            // 1. Create expense transaction (triggers treasury balance deduction)
            const { data: transaction, error: txError } = await supabase
                .from('transactions')
                .insert({
                    type: 'expense',
                    amount: input.amount,
                    category: 'advance',
                    description: `سلفة - ${recipientLabel} - ${input.recipient_name}`,
                    notes: input.notes || null,
                    payment_method: 'cash',
                    created_by: user.id,
                    is_approved: true,
                    approved_by: user.id,
                    approved_at: new Date().toISOString(),
                } as never)
                .select()
                .single()

            if (txError) throw txError

            // 2. Create advance record linked to the transaction
            const { data: advance, error: advError } = await supabase
                .from('advances')
                .insert({
                    recipient_type: input.recipient_type,
                    recipient_name: input.recipient_name,
                    amount: input.amount,
                    notes: input.notes || null,
                    transaction_id: (transaction as any).id,
                    created_by: user.id,
                } as never)
                .select()
                .single()

            if (advError) throw advError
            return advance as unknown as Advance
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ADVANCES_KEY })
            queryClient.invalidateQueries({ queryKey: TREASURY_KEY })
            queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
        },
    })
}

/**
 * Hook to delete an advance.
 * Also deletes the linked transaction so the treasury balance is restored.
 */
export function useDeleteAdvance() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (advance: Advance) => {
            // 1. Delete the advance record first
            const { error: advError } = await supabase
                .from('advances')
                .delete()
                .eq('id', advance.id)

            if (advError) throw advError

            // 2. Delete linked transaction to restore treasury balance
            if (advance.transaction_id) {
                const { error: txError } = await supabase
                    .from('transactions')
                    .delete()
                    .eq('id', advance.transaction_id)

                if (txError) throw txError
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ADVANCES_KEY })
            queryClient.invalidateQueries({ queryKey: TREASURY_KEY })
            queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
        },
    })
}
