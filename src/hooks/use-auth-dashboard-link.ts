'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type UserRole = 'admin' | 'client' | 'team_leader' | 'creator' | 'accountant'

interface AuthDashboardState {
    user: User | null
    dashboardLink: string
    handleLogout: () => Promise<void>
}

const ROLE_ROUTES: Record<string, string> = {
    admin: '/admin',
    client: '/client',
    team_leader: '/team-leader',
    creator: '/creator',
    accountant: '/accountant',
}

function resolveLink(role?: string): string {
    if (!role) return '/login'
    const normalized = String(role).toLowerCase().trim()
    return ROLE_ROUTES[normalized] ?? (normalized ? '/client' : '/login')
}

export function useAuthDashboardLink(
    initialUser?: User | null,
    initialRole?: string,
): AuthDashboardState {
    const supabaseRef = useRef(createClient())
    const [user, setUser] = useState<User | null>(initialUser ?? null)
    const [dashboardLink, setDashboardLink] = useState(() => resolveLink(initialRole))

    const updateUserAndLink = useCallback(async (currentUser: User | null) => {
        if (!currentUser) {
            setUser(null)
            setDashboardLink('/login')
            return
        }

        setUser(currentUser)

        const { data } = await supabaseRef.current
            .from('users')
            .select('role')
            .eq('id', currentUser.id)
            .single()

        const role = (data as { role?: string } | null)?.role
            ?? currentUser.user_metadata?.role

        if (role) {
            setDashboardLink(resolveLink(String(role)))
        }
    }, [])

    useEffect(() => {
        const supabase = supabaseRef.current

        if (!initialUser) {
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session?.user) updateUserAndLink(session.user)
            })
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
                    await updateUserAndLink(session?.user ?? null)
                } else if (event === 'SIGNED_OUT') {
                    setUser(null)
                    setDashboardLink('/login')
                }
            },
        )

        return () => subscription.unsubscribe()
    }, [initialUser, updateUserAndLink])

    const handleLogout = useCallback(async () => {
        await supabaseRef.current.auth.signOut()
        setUser(null)
        setDashboardLink('/login')
    }, [])

    return { user, dashboardLink, handleLogout }
}
