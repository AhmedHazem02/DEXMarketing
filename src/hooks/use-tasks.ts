'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskStatus, TaskPriority } from '@/types/database'

const TASKS_KEY = ['tasks']

/**
 * Hook to fetch all tasks
 */
export function useTasks(filters?: { status?: TaskStatus; assignedTo?: string }) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...TASKS_KEY, filters],
        queryFn: async () => {
            let query = supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false })

            if (filters?.status) {
                query = query.eq('status', filters.status)
            }
            if (filters?.assignedTo) {
                query = query.eq('assigned_to', filters.assignedTo)
            }

            const { data, error } = await query
            if (error) throw error
            return data as unknown as Task[]
        },
    })
}

/**
 * Hook to fetch tasks grouped by status (for Kanban)
 */
export function useTasksKanban() {
    const supabase = createClient()

    return useQuery({
        queryKey: [...TASKS_KEY, 'kanban'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .order('updated_at', { ascending: false })

            if (error) throw error

            // Group by status
            const columns: Record<TaskStatus, Task[]> = {
                new: [],
                in_progress: [],
                review: [],
                revision: [],
                approved: [],
                rejected: [],
            }

                ; (data as unknown as Task[])?.forEach((task) => {
                    if (columns[task.status]) {
                        columns[task.status].push(task)
                    }
                })

            return columns
        },
    })
}

/**
 * Hook to fetch a single task
 */
export function useTask(taskId: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...TASKS_KEY, taskId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('id', taskId)
                .single()

            if (error) throw error
            return data as unknown as Task
        },
        enabled: !!taskId,
    })
}

interface CreateTaskInput {
    title: string
    description?: string
    status?: TaskStatus
    priority?: TaskPriority
    project_id?: string
    assigned_to?: string
    created_by?: string
    deadline?: string
}

/**
 * Hook to create a task
 */
export function useCreateTask() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (task: CreateTaskInput) => {
            const { data, error } = await supabase
                .from('tasks')
                .insert(task as any)
                .select()
                .single()

            if (error) throw error
            return data as unknown as Task
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TASKS_KEY })
        },
    })
}

/**
 * Hook to update a task
 */
export function useUpdateTask() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
            const updatePayload = { ...updates, updated_at: new Date().toISOString() }
            const { data, error } = await supabase
                .from('tasks')
                // @ts-ignore - Supabase types don't match our schema yet
                .update(updatePayload)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data as unknown as Task
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: TASKS_KEY })
            queryClient.invalidateQueries({ queryKey: [...TASKS_KEY, variables.id] })
        },
    })
}

/**
 * Hook to update task status (optimized for Kanban drag)
 */
export function useUpdateTaskStatus() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
            const updatePayload = { status, updated_at: new Date().toISOString() }
            const { error } = await supabase
                .from('tasks')
                // @ts-ignore - Supabase types don't match our schema yet
                .update(updatePayload)
                .eq('id', id)

            if (error) throw error
        },
        // Optimistic update for smooth Kanban experience
        onMutate: async ({ id, status }) => {
            await queryClient.cancelQueries({ queryKey: [...TASKS_KEY, 'kanban'] })
            const previousData = queryClient.getQueryData([...TASKS_KEY, 'kanban'])

            queryClient.setQueryData([...TASKS_KEY, 'kanban'], (old: Record<TaskStatus, Task[]> | undefined) => {
                if (!old) return old

                const newData = { ...old }
                // Find and move task
                for (const key of Object.keys(newData) as TaskStatus[]) {
                    const index = newData[key].findIndex((t) => t.id === id)
                    if (index !== -1) {
                        const [task] = newData[key].splice(index, 1)
                        task.status = status
                        newData[status].unshift(task)
                        break
                    }
                }
                return newData
            })

            return { previousData }
        },
        onError: (_, __, context) => {
            if (context?.previousData) {
                queryClient.setQueryData([...TASKS_KEY, 'kanban'], context.previousData)
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: TASKS_KEY })
        },
    })
}

/**
 * Hook to delete a task
 */
export function useDeleteTask() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (taskId: string) => {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TASKS_KEY })
        },
    })
}
