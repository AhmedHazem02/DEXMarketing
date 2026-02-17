'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
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
    queryFn: async () => {
      const supabase = createClient()

      let query = supabase
        .from('clients')
        .select(`
          *,
          user:users(id, name, email, role)
        `)
        .order('company', { ascending: true })

      if (filters?.search) {
        query = query.or(
          `company.ilike.%${filters.search}%,name.ilike.%${filters.search}%`
        )
      }

      const { data, error } = await query

      if (error) throw error
      
      // Filter to show clients with role = 'client' or 'admin', or clients without user accounts
      const clientsOnly = (data || []).filter((client: any) => 
        !client.user || client.user?.role === 'client' || client.user?.role === 'admin'
      )
      
      return clientsOnly as (Client & { user?: { id: string; name: string | null; email: string; role: string } | null })[]
    },
  })
}

// Get single client
export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: clientKeys.detail(id || ''),
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
