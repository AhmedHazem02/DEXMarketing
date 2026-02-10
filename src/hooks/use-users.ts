'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { User, UserRole, Department } from '@/types/database'

const USERS_KEY = ['users']
const CURRENT_USER_KEY = ['current-user']
const TEAM_MEMBERS_KEY = ['team-members']

// Role-to-department mapping
const DEPARTMENT_ROLES: Record<Department, UserRole[]> = {
    photography: ['videographer', 'photographer', 'editor'],
    content: ['creator'],
}

/**
 * Hook to fetch the currently logged-in user's profile
 */
export function useCurrentUser() {
    const supabase = createClient()

    return useQuery({
        queryKey: CURRENT_USER_KEY,
        queryFn: async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single()

            if (error) throw error
            return data as unknown as User
        },
        staleTime: 5 * 60 * 1000, // 5 min
    })
}

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
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 15 * 60 * 1000, // 15 minutes
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

/**
 * Hook to fetch team members for a given team leader's department.
 * Returns all active users with roles belonging to that department.
 * @param teamLeaderId - The team leader's user ID (used to determine department)
 */
export function useTeamMembers(teamLeaderId: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...TEAM_MEMBERS_KEY, teamLeaderId],
        enabled: !!teamLeaderId,
        queryFn: async () => {
            // Get the team leader's department
            const { data: tl, error: tlError } = await supabase
                .from('users')
                .select('department')
                .eq('id', teamLeaderId)
                .single()

            if (tlError) throw tlError
            if (!tl?.department) return []

            const dept = tl.department as Department
            const roles = DEPARTMENT_ROLES[dept] || []

            if (roles.length === 0) return []

            const { data, error } = await supabase
                .from('users')
                .select('id, name, email, avatar_url, role, department')
                .in('role', roles)
                .eq('is_active', true)
                .order('name')

            if (error) throw error
            return (data ?? []) as unknown as Pick<User, 'id' | 'name' | 'email' | 'avatar_url' | 'role' | 'department'>[]
        },
        staleTime: 10 * 60 * 1000, // 10 minutes - team members rarely change
    })
}

/**
 * Get human-readable role label for display
 */
export function getRoleLabel(role: string, isAr: boolean): string {
    const labels: Record<string, { en: string; ar: string }> = {
        videographer: { en: 'Videographer', ar: 'مصور فيديو' },
        photographer: { en: 'Photographer', ar: 'مصور' },
        editor: { en: 'Editor', ar: 'محرر' },
        creator: { en: 'Creator', ar: 'صانع محتوى' },
        team_leader: { en: 'Team Leader', ar: 'قائد فريق' },
        admin: { en: 'Admin', ar: 'مسؤول' },
        accountant: { en: 'Accountant', ar: 'محاسب' },
        client: { en: 'Client', ar: 'عميل' },
    }
    return labels[role]?.[isAr ? 'ar' : 'en'] || role
}
