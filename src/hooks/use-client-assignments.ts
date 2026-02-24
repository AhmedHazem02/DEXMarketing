'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Client, ClientAssignment } from '@/types/database'

// ============================================
// Query Keys
// ============================================
export const clientAssignmentKeys = {
    all: ['client-assignments'] as const,
    byUser: (userId: string) => [...clientAssignmentKeys.all, 'user', userId] as const,
    byAssigner: (assignerId: string) => [...clientAssignmentKeys.all, 'assigner', assignerId] as const,
}

// ============================================
// Hooks
// ============================================

/**
 * Get assigned clients for a specific user (team member).
 * Returns clients with their details.
 */
export function useMyAssignedClients(userId?: string) {
    return useQuery({
        queryKey: clientAssignmentKeys.byUser(userId!),
        enabled: !!userId,
        staleTime: 2 * 60 * 1000,
        queryFn: async () => {
            const supabase = createClient()

            const { data, error } = await supabase
                .from('client_assignments')
                .select(`
                    id,
                    client_id,
                    user_id,
                    assigned_by,
                    created_at,
                    client:clients(
                        id, name, email, phone, user_id, notes, created_at
                    )
                `)
                .eq('user_id', userId!)
                .order('created_at', { ascending: false })

            if (error) throw error

            // Extract clients from assignments
            const clients = (data || [])
                .map((a: any) => a.client)
                .filter(Boolean) as (Client & { user?: { id: string; name: string | null; email: string; role: string } | null })[]

            return clients
        },
    })
}

/**
 * Get all assignments created by a team leader (for management UI).
 * Groups assignments by team member.
 */
export function useTeamClientAssignments(assignerId?: string) {
    return useQuery({
        queryKey: clientAssignmentKeys.byAssigner(assignerId || ''),
        enabled: !!assignerId,
        staleTime: 2 * 60 * 1000,
        queryFn: async () => {
            const supabase = createClient()

            const { data, error } = await supabase
                .from('client_assignments')
                .select(`
                    id,
                    client_id,
                    user_id,
                    assigned_by,
                    created_at,
                    client:clients(id, name, email, phone, user_id),
                    user:users!client_assignments_user_id_fkey(id, name, email, role, avatar_url, department)
                `)
                .eq('assigned_by', assignerId!)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data || []
        },
    })
}

/**
 * Assign a client to a team member.
 */
export function useAssignClient() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ clientId, userId, assignedBy }: {
            clientId: string
            userId: string
            assignedBy: string
        }) => {
            const supabase = createClient()

            const { data, error } = await supabase
                .from('client_assignments')
                .insert({
                    client_id: clientId,
                    user_id: userId,
                    assigned_by: assignedBy,
                } as any)
                .select()
                .single()

            if (error) {
                // Handle unique constraint violation gracefully
                if (error.code === '23505') {
                    return null // Already assigned
                }
                throw error
            }
            return data as ClientAssignment
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: clientAssignmentKeys.byUser(variables.userId) })
            queryClient.invalidateQueries({ queryKey: clientAssignmentKeys.byAssigner(variables.assignedBy) })
        },
    })
}

/**
 * Remove a client assignment from a team member.
 */
export function useUnassignClient() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ clientId, userId }: {
            clientId: string
            userId: string
        }) => {
            const supabase = createClient()

            const { error } = await supabase
                .from('client_assignments')
                .delete()
                .eq('client_id', clientId)
                .eq('user_id', userId)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientAssignmentKeys.all })
        },
    })
}

/**
 * Bulk assign/sync clients for a team member.
 * Sets the exact list of assigned clients (removes old ones not in the list, adds new ones).
 */
export function useSyncClientAssignments() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ userId, clientIds, assignedBy }: {
            userId: string
            clientIds: string[]
            assignedBy: string
        }) => {
            const supabase = createClient()

            // Get current assignments for this user
            const { data: current, error: fetchError } = await supabase
                .from('client_assignments')
                .select('client_id')
                .eq('user_id', userId)
                .eq('assigned_by', assignedBy)

            if (fetchError) throw fetchError

            const currentIds = new Set((current || []).map((a: any) => a.client_id))
            const targetIds = new Set(clientIds)

            // Determine what to add and what to remove
            const toAdd = clientIds.filter(id => !currentIds.has(id))
            const toRemove = [...currentIds].filter(id => !targetIds.has(id))

            // Remove old assignments
            if (toRemove.length > 0) {
                const { error: deleteError } = await supabase
                    .from('client_assignments')
                    .delete()
                    .eq('user_id', userId)
                    .eq('assigned_by', assignedBy)
                    .in('client_id', toRemove)

                if (deleteError) throw deleteError
            }

            // Add new assignments
            if (toAdd.length > 0) {
                const inserts = toAdd.map(clientId => ({
                    client_id: clientId,
                    user_id: userId,
                    assigned_by: assignedBy,
                }))

                const { error: insertError } = await supabase
                    .from('client_assignments')
                    .insert(inserts as any)

                if (insertError) throw insertError
            }

            return { added: toAdd.length, removed: toRemove.length }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: clientAssignmentKeys.byUser(variables.userId) })
            queryClient.invalidateQueries({ queryKey: clientAssignmentKeys.byAssigner(variables.assignedBy) })
        },
    })
}
