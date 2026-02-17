'use client'

import { useCurrentUser } from './use-users'
import type { UserRole } from '@/types/database'

/**
 * Hook to get current user's role
 * Returns the role or null if not authenticated
 */
export function useCurrentRole(): { role: UserRole | null; isAdmin: boolean; isAccountant: boolean; isClient: boolean; isLoading: boolean } {
    const { data: user, isLoading } = useCurrentUser()

    const role = user?.role || null
    const isAdmin = role === 'admin'
    const isAccountant = role === 'accountant'
    const isClient = role === 'client'

    return {
        role,
        isAdmin,
        isAccountant,
        isClient,
        isLoading
    }
}

/**
 * Hook to check if user is admin or accountant
 */
export function useIsAccountantOrAdmin(): boolean {
    const { role } = useCurrentRole()
    return role === 'admin' || role === 'accountant'
}
