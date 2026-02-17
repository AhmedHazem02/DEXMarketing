'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ClientAccount, Client, Package, ClientAccountWithRelations } from '@/types/database'
import { toast } from 'sonner'

// Query keys
const CLIENT_ACCOUNTS_KEY = ['client-accounts'] as const

/**
 * Hook to fetch all client accounts with filters
 */
export function useClientAccounts(filters?: {
    clientId?: string
    isActive?: boolean
    search?: string
}) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...CLIENT_ACCOUNTS_KEY, filters],
        queryFn: async () => {
            let query = supabase
                .from('client_accounts')
                .select(`
                    *,
                    client:clients(id, name, email, company, user:users(id, name, email)),
                    package:packages(id, name, name_ar),
                    transactions:transactions(*)
                `)
                .order('created_at', { ascending: false })

            if (filters?.clientId) {
                query = query.eq('client_id', filters.clientId)
            }

            if (filters?.isActive !== undefined) {
                query = query.eq('is_active', filters.isActive)
            }

            const { data, error } = await query

            if (error) throw error

            // Client-side search filter
            let results = data as unknown as ClientAccountWithRelations[]

            if (filters?.search) {
                const searchLower = filters.search.toLowerCase()
                results = results.filter(
                    (account) =>
                        account.client?.name?.toLowerCase().includes(searchLower) ||
                        account.client?.company?.toLowerCase().includes(searchLower) ||
                        account.package_name?.toLowerCase().includes(searchLower)
                )
            }

            return results
        },
        staleTime: 30 * 1000, // 30 seconds
    })
}

/**
 * Hook to fetch single client account
 */
export function useClientAccount(id: string | undefined) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...CLIENT_ACCOUNTS_KEY, id],
        queryFn: async () => {
            if (!id) return null

            const { data, error } = await supabase
                .from('client_accounts')
                .select(`
                    *,
                    client:clients(id, name, email, company, phone),
                    package:packages(id, name, name_ar, price, duration_days),
                    transactions:transactions(*)
                `)
                .eq('id', id)
                .single()

            if (error) throw error
            return data as unknown as ClientAccountWithRelations
        },
        enabled: !!id,
        staleTime: 30 * 1000,
    })
}

/**
 * Hook to fetch client accounts for a specific client (for dropdown)
 */
export function useClientAccountsByClientId(clientId: string | undefined) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...CLIENT_ACCOUNTS_KEY, 'by-client', clientId],
        queryFn: async () => {
            if (!clientId) return []

            const { data, error } = await supabase
                .from('client_accounts')
                .select(`
                    *,
                    package:packages(id, name, name_ar),
                    transactions:transactions(*)
                `)
                .eq('client_id', clientId)
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data as unknown as ClientAccountWithRelations[]
        },
        enabled: !!clientId,
        staleTime: 60 * 1000, // 1 minute
    })
}

/**
 * Hook to fetch client accounts for the current logged-in user (client role)
 * Resolves user_id -> client.id -> client_accounts
 */
export function useMyClientAccounts() {
    const supabase = createClient()

    return useQuery({
        queryKey: [...CLIENT_ACCOUNTS_KEY, 'my-accounts'],
        queryFn: async () => {
            // First get the current user's auth id
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return []

            // Find the client record linked to this user
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (clientError || !clientData) return []

            const clientId = (clientData as any).id as string

            // Fetch client accounts using the client.id
            const { data, error } = await supabase
                .from('client_accounts')
                .select(`
                    *,
                    package:packages(id, name, name_ar),
                    transactions:transactions(*)
                `)
                .eq('client_id', clientId)
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data as unknown as ClientAccountWithRelations[]
        },
        staleTime: 60 * 1000,
    })
}

/**
 * Hook to create a client account
 */
export function useCreateClientAccount() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async (accountData: {
            client_id: string
            package_id: string
            start_date?: string
            end_date?: string
        }) => {
            // Fetch package details to store snapshot
            const { data: packageData } = await supabase
                .from('packages')
                .select('*')
                .eq('id', accountData.package_id)
                .single()

            if (!packageData) {
                throw new Error('Package not found')
            }

            // Type assertion for package data (migration pending)
            const pkg = packageData as unknown as Package

            // Calculate end date if not provided
            const startDate = accountData.start_date ? new Date(accountData.start_date) : new Date()
            const endDate = accountData.end_date 
                ? new Date(accountData.end_date)
                : new Date(startDate.getTime() + pkg.duration_days * 24 * 60 * 60 * 1000)

            // Create client account with package snapshot
            // Note: package_description, package_description_ar, package_duration_days 
            // require migration_v6 to be run on the database
            const { data, error } = await (supabase
                .from('client_accounts') as any)
                .insert({
                    client_id: accountData.client_id,
                    package_id: accountData.package_id,
                    package_name: pkg.name,
                    package_name_ar: pkg.name_ar,
                    package_price: pkg.price,
                    remaining_balance: pkg.price,
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0],
                    is_active: true,
                })
                .select()
                .single()

            if (error) throw error
            return data as ClientAccount
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLIENT_ACCOUNTS_KEY })
            toast.success('تم إنشاء حساب العميل بنجاح', {
                description: 'Client account created successfully'
            })
        },
        onError: (error: Error) => {
            console.error('Failed to create client account:', error)
            toast.error('فشل إنشاء حساب العميل', {
                description: error.message || 'Failed to create client account'
            })
        }
    })
}

/**
 * Hook to update client account (Admin only)
 */
export function useUpdateClientAccount() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async ({
            id,
            updates
        }: {
            id: string
            updates: Partial<Omit<ClientAccount, 'id' | 'created_at' | 'updated_at'>>
        }) => {
            const { data, error } = await (supabase
                .from('client_accounts') as any)
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data as ClientAccount
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLIENT_ACCOUNTS_KEY })
            toast.success('تم تحديث حساب العميل بنجاح', {
                description: 'Client account updated successfully'
            })
        },
        onError: (error: Error) => {
            console.error('Failed to update client account:', error)
            toast.error('فشل تحديث حساب العميل', {
                description: error.message || 'Failed to update client account'
            })
        }
    })
}

/**
 * Hook to toggle client account active status
 */
export function useToggleClientAccountStatus() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            const { data, error } = await (supabase
                .from('client_accounts') as any)
                .update({ is_active: isActive })
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data as ClientAccount
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: CLIENT_ACCOUNTS_KEY })
            const message = variables.isActive ? 'تم تفعيل الحساب' : 'تم إلغاء تفعيل الحساب'
            const description = variables.isActive ? 'Account activated' : 'Account deactivated'
            toast.success(message, { description })
        },
        onError: (error: Error) => {
            console.error('Failed to toggle account status:', error)
            toast.error('فشل تغيير حالة الحساب', {
                description: error.message || 'Failed to toggle account status'
            })
        }
    })
}

/**
 * Hook to delete client account (Admin only)
 */
export function useDeleteClientAccount() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase
                .from('client_accounts') as any)
                .delete()
                .eq('id', id)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLIENT_ACCOUNTS_KEY })
            toast.success('تم حذف الحساب بنجاح', {
                description: 'Account deleted successfully'
            })
        },
        onError: (error: Error) => {
            console.error('Failed to delete account:', error)
            toast.error('فشل حذف الحساب', {
                description: error.message || 'Failed to delete account'
            })
        }
    })
}
