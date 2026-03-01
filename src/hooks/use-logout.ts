'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Shared logout hook — logs activity, signs out, and redirects.
 * Extracted to eliminate duplicate logout logic across layout components.
 */
export function useLogout() {
    const router = useRouter()

    const handleLogout = useCallback(async () => {
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await supabase.from('activity_log').insert({ user_id: user.id, action: 'logout' })
            }
            await supabase.auth.signOut()
            router.push('/login')
        } catch (error) {
            console.error('Logout failed:', error)
            // Force redirect even on error
            window.location.href = '/login'
        }
    }, [router])

    return handleLogout
}
