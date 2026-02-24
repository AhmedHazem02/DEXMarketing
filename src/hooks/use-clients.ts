'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { sanitizeSearch } from '@/lib/utils'
import type { Client } from '@/types/database'

// Query keys
export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (filters: ClientFilters) => [...clientKeys.lists(), { filters }] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
}

interface ClientFilters {
  search?: string
}

// Get all clients
export function useClients(filters?: ClientFilters) {
  return useQuery({
    queryKey: clientKeys.list(filters || {}),
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const supabase = createClient()

      const applySearch = (q: any) => {
        if (filters?.search) {
          const safe = sanitizeSearch(filters.search)
          if (safe) {
            q = q.or(`name.ilike.%${safe}%`)
          }
        }
        return q.order('name', { ascending: true })
      }

      // Server-side role filtering using two parallel queries
      const [withUsers, withoutUsers] = await Promise.all([
        // Clients with user role = 'client' or 'admin'
        applySearch(
          (supabase.from('clients') as any)
            .select('*, user:users!inner(id, name, email, role)')
            .in('users.role', ['client', 'admin'])
        ),
        // Clients without a linked user account
        applySearch(
          (supabase.from('clients') as any)
            .select('*')
            .is('user_id', null)
        ),
      ])

      if (withUsers.error) throw withUsers.error
      if (withoutUsers.error) throw withoutUsers.error

      const combined = [
        ...(withUsers.data || []),
        ...(withoutUsers.data || []).map((c: any) => ({ ...c, user: null })),
      ].sort((a, b) => (a.name || '').localeCompare(b.name || ''))

      return combined as (Client & { user?: { id: string; name: string | null; email: string; role: string } | null })[]
    },
  })
}

// Get single client
export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: clientKeys.detail(id || ''),
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      if (!id) return null

      const supabase = createClient()
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Client
    },
    enabled: !!id,
  })
}

// Update client
export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Client>
    }) => {
      const supabase = createClient()

      const { data, error } = await (supabase
        .from('clients') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all })
    },
  })
}

// Delete client
export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()

      const { error } = await supabase.from('clients').delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all })
    },
  })
}
