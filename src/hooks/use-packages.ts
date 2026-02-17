'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Package } from '@/types/database'
import { toast } from 'sonner'

// Query keys
const PACKAGES_KEY = ['packages'] as const

/**
 * Hook to fetch all packages
 */
export function usePackages(activeOnly: boolean = false) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...PACKAGES_KEY, { activeOnly }],
        queryFn: async () => {
            let query = supabase
                .from('packages')
                .select('*')
                .order('price', { ascending: false })

            if (activeOnly) {
                query = query.eq('is_active', true)
            }

            const { data, error } = await query

            if (error) throw error
            return data as Package[]
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

/**
 * Hook to fetch single package
 */
export function usePackage(id: string | undefined) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...PACKAGES_KEY, id],
        queryFn: async () => {
            if (!id) return null

            const { data, error } = await supabase
                .from('packages')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            return data as Package
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

/**
 * Hook to create a package (Admin only)
 */
export function useCreatePackage() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async (packageData: Omit<Package, 'id' | 'created_at' | 'updated_at'>) => {
            const { data, error } = await (supabase
                .from('packages') as any)
                .insert(packageData)
                .select()
                .single()

            if (error) throw error
            return data as Package
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PACKAGES_KEY })
            toast.success('تم إنشاء الباقة بنجاح', {
                description: 'Package created successfully'
            })
        },
        onError: (error: Error) => {
            console.error('Failed to create package:', error)
            toast.error('فشل إنشاء الباقة', {
                description: error.message || 'Failed to create package'
            })
        }
    })
}

/**
 * Hook to update a package (Admin only)
 */
export function useUpdatePackage() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async ({
            id,
            updates
        }: {
            id: string
            updates: Partial<Omit<Package, 'id' | 'created_at' | 'updated_at'>>
        }) => {
            const { data, error } = await (supabase
                .from('packages') as any)
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data as Package
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PACKAGES_KEY })
            toast.success('تم تحديث الباقة بنجاح', {
                description: 'Package updated successfully'
            })
        },
        onError: (error: Error) => {
            console.error('Failed to update package:', error)
            toast.error('فشل تحديث الباقة', {
                description: error.message || 'Failed to update package'
            })
        }
    })
}

/**
 * Hook to delete a package (Admin only)
 */
export function useDeletePackage() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase
                .from('packages') as any)
                .delete()
                .eq('id', id)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PACKAGES_KEY })
            toast.success('تم حذف الباقة بنجاح', {
                description: 'Package deleted successfully'
            })
        },
        onError: (error: Error) => {
            console.error('Failed to delete package:', error)
            toast.error('فشل حذف الباقة', {
                description: error.message || 'Failed to delete package'
            })
        }
    })
}

/**
 * Hook to toggle package active status (Admin only)
 */
export function useTogglePackageStatus() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            const { data, error } = await (supabase
                .from('packages') as any)
                .update({ is_active: isActive })
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data as Package
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: PACKAGES_KEY })
            const message  = variables.isActive ? 'تم تفعيل الباقة' : 'تم إلغاء تفعيل الباقة'
            const description = variables.isActive ? 'Package activated' : 'Package deactivated'
            toast.success(message, { description })
        },
        onError: (error: Error) => {
            console.error('Failed to toggle package status:', error)
            toast.error('فشل تغيير حالة الباقة', {
                description: error.message || 'Failed to toggle package status'
            })
        }
    })
}
