import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UseAuthDashboardLinkReturn {
  user: User | null
  dashboardLink: string
  handleLogout: () => Promise<void>
}

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  admin: '/admin',
  'team-leader': '/team-leader',
  'account-manager': '/account-manager',
  creator: '/creator',
  editor: '/editor',
  photographer: '/photographer',
  videographer: '/videographer',
  accountant: '/accountant',
  client: '/client',
}

export function useAuthDashboardLink(
  initialUser?: User | null,
  initialRole?: string
): UseAuthDashboardLinkReturn {
  const [user, setUser] = useState<User | null>(initialUser ?? null)
  const [role, setRole] = useState<string | undefined>(initialRole)
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false

    // Get initial user if not provided
    if (!initialUser) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!cancelled) setUser(user)
      })
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setUser(session?.user ?? null)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUser])

  // Fetch user role if we have a user but no role
  useEffect(() => {
    let cancelled = false

    if (user && !role) {
      supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (cancelled) return
          const userData = data as { role?: string } | null
          if (userData?.role && typeof userData.role === 'string') {
            setRole(userData.role)
          }
        })
    }

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role])

  const dashboardLink = role ? ROLE_DASHBOARD_MAP[role] ?? '/profile' : '/profile'

  const handleLogout = async () => {
    // Log activity before signing out (consistent with use-logout.ts)
    if (user) {
      await supabase.from('activity_log').insert({ user_id: user.id, action: 'logout' } as never)
    }
    await supabase.auth.signOut()
    setUser(null)
    setRole(undefined)
    window.location.href = '/'
  }

  return {
    user,
    dashboardLink,
    handleLogout,
  }
}
