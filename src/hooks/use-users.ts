'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { User, UserRole } from '@/types/database'

const USERS_KEY = ['users']

/**
 * Hook to fetch all users (Admin only)
 */
export function useUsers() {
    const supabase = createClient()

    return useQuery({
        queryKey: USERS_KEY,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            return data as unknown as User[]
        },
    })
}

/**
 * Hook to fetch a single user by ID
 */
export function useUser(userId: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...USERS_KEY, userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) throw error
            return data as unknown as User
        },
        enabled: !!userId,
    })
}

/**
 * Hook to update a user
 */
export function useUpdateUser() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, ...updates }: { id: string; name?: string; role?: UserRole; is_active?: boolean }) => {
            const { data, error } = await supabase
                .from('users')
                // @ts-ignore - Supabase types don't match our schema yet
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data as unknown as User
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USERS_KEY })
        },
    })
}

/**
 * Hook to delete a user
 */
export function useDeleteUser() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (userId: string) => {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USERS_KEY })
        },
    })
}
