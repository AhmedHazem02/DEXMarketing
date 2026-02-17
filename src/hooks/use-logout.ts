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
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase.from('activity_log').insert({ user_id: user.id, action: 'logout' } as never)
        }
        await supabase.auth.signOut()
        router.refresh()
        router.push('/login')
    }, [router])

    return handleLogout
}
