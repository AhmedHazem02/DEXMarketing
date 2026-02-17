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
    // Get initial user if not provided
    if (!initialUser) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user)
      })
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [initialUser, supabase])

  // Fetch user role if we have a user but no role
  useEffect(() => {
    if (user && !role) {
      supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          const userData = data as any
          if (userData && userData.role && typeof userData.role === 'string') {
            setRole(userData.role)
          }
        })
    }
  }, [user, role, supabase])

  const dashboardLink = role ? ROLE_DASHBOARD_MAP[role] ?? '/profile' : '/profile'

  const handleLogout = async () => {
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
