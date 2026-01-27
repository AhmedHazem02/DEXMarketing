'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { TaskStatus, TaskPriority, Comment, Attachment } from '@/types/database'
import type {
    TaskWithRelations,
    TaskDetails,
    CommentWithUser,
    CreateTaskInput,
    UpdateTaskInput,
    TaskFilters,
    TasksByStatus,
} from '@/types/task'
import { KANBAN_COLUMNS } from '@/types/task'

// ============================================
// Query Keys - Centralized for consistency
// ============================================

export const taskKeys = {
    all: ['tasks'] as const,
    lists: () => [...taskKeys.all, 'list'] as const,
    list: (filters: TaskFilters) => [...taskKeys.lists(), filters] as const,
    kanban: () => [...taskKeys.all, 'kanban'] as const,
    details: () => [...taskKeys.all, 'detail'] as const,
    detail: (id: string) => [...taskKeys.details(), id] as const,
    comments: (taskId: string) => [...taskKeys.all, 'comments', taskId] as const,
    attachments: (taskId: string) => [...taskKeys.all, 'attachments', taskId] as const,
    myTasks: (userId: string) => [...taskKeys.all, 'my', userId] as const,
    revisions: () => [...taskKeys.all, 'revisions'] as const,
}

// ============================================
// Tasks - List with Filters
// ============================================

/**
 * Fetch tasks with optional filters and includes user data
 */
export function useTasks(filters: TaskFilters = {}) {
    const supabase = createClient()

    return useQuery({
        queryKey: taskKeys.list(filters),
        queryFn: async () => {
            let query = supabase
                .from('tasks')
                .select(`
                    *,
                    assigned_user:users!tasks_assigned_to_fkey(id, name, email, avatar_url),
                    creator:users!tasks_created_by_fkey(id, name, email, avatar_url),
                    project:projects(id, name, status)
                `)
                .order('created_at', { ascending: false })

            // Apply filters
            if (filters.status && filters.status !== 'all') {
                query = query.eq('status', filters.status)
            }
            if (filters.priority && filters.priority !== 'all') {
                query = query.eq('priority', filters.priority)
            }
            if (filters.assigned_to && filters.assigned_to !== 'all') {
                query = query.eq('assigned_to', filters.assigned_to)
            }
            if (filters.project_id && filters.project_id !== 'all') {
                query = query.eq('project_id', filters.project_id)
            }
            if (filters.search) {
                query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
            }
            if (filters.dateFrom) {
                query = query.gte('created_at', filters.dateFrom)
            }
            if (filters.dateTo) {
                query = query.lte('created_at', filters.dateTo)
            }

            const { data, error } = await query
            if (error) throw error
            return data as unknown as TaskWithRelations[]
        },
        staleTime: 30 * 1000, // 30 seconds
    })
}

// ============================================
// Tasks - Kanban View (Grouped by Status)
// ============================================

/**
 * Fetch tasks grouped by status for Kanban board
 * Optimized to fetch all at once and group client-side
 */
export function useTasksKanban(projectId?: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...taskKeys.kanban(), projectId],
        queryFn: async () => {
            let query = supabase
                .from('tasks')
                .select(`
                    *,
                    assigned_user:users!tasks_assigned_to_fkey(id, name, email, avatar_url),
                    creator:users!tasks_created_by_fkey(id, name, email, avatar_url),
                    project:projects(id, name, status)
                `)
                .order('updated_at', { ascending: false })

            if (projectId) {
                query = query.eq('project_id', projectId)
            }

            const { data, error } = await query
            if (error) throw error

            // Initialize empty columns
            const columns: TasksByStatus = {
                new: [],
                in_progress: [],
                review: [],
                revision: [],
                approved: [],
                rejected: [],
            }

                // Group tasks by status
                ; (data as unknown as TaskWithRelations[])?.forEach((task) => {
                    if (columns[task.status]) {
                        columns[task.status].push(task)
                    }
                })

            return columns
        },
        staleTime: 10 * 1000, // 10 seconds for real-time feel
    })
}

// ============================================
// Tasks - My Tasks (For Creator role)
// ============================================

/**
 * Fetch tasks assigned to a specific user
 */
export function useMyTasks(userId: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: taskKeys.myTasks(userId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tasks')
                .select(`
                    *,
                    project:projects(id, name, status),
                    creator:users!tasks_created_by_fkey(id, name, avatar_url)
                `)
                .eq('assigned_to', userId)
                .order('deadline', { ascending: true, nullsFirst: false })

            if (error) throw error
            return data as unknown as TaskWithRelations[]
        },
        enabled: !!userId,
        staleTime: 30 * 1000,
    })
}

// ============================================
// Tasks - Revisions Hub (For Team Leader)
// ============================================

/**
 * Fetch tasks in revision/rejected status
 */
export function useRevisionsTasks() {
    const supabase = createClient()

    return useQuery({
        queryKey: taskKeys.revisions(),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tasks')
                .select(`
                    *,
                    assigned_user:users!tasks_assigned_to_fkey(id, name, email, avatar_url),
                    creator:users!tasks_created_by_fkey(id, name, avatar_url),
                    project:projects(id, name, status)
                `)
                .in('status', ['revision', 'rejected'])
                .order('updated_at', { ascending: false })

            if (error) throw error
            return data as unknown as TaskWithRelations[]
        },
        staleTime: 30 * 1000,
    })
}

// ============================================
// Task - Single with Full Details
// ============================================

/**
 * Fetch a single task with all related data
 */
export function useTaskDetails(taskId: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: taskKeys.detail(taskId),
        queryFn: async () => {
            // Fetch task with relations
            const { data: task, error } = await supabase
                .from('tasks')
                .select(`
                    *,
                    assigned_user:users!tasks_assigned_to_fkey(id, name, email, avatar_url),
                    creator:users!tasks_created_by_fkey(id, name, email, avatar_url),
                    project:projects(id, name, status)
                `)
                .eq('id', taskId)
                .single()

            if (error) throw error

            // Fetch comments separately
            const { data: comments } = await supabase
                .from('comments')
                .select(`
                    *,
                    user:users(id, name, avatar_url)
                `)
                .eq('task_id', taskId)
                .order('created_at', { ascending: true })

            // Fetch attachments
            const { data: attachments } = await supabase
                .from('attachments')
                .select('*')
                .eq('task_id', taskId)
                .order('created_at', { ascending: false })

            const taskResult = task as Record<string, unknown>
            return {
                ...taskResult,
                comments: comments as unknown as CommentWithUser[],
                attachments: attachments as unknown as Attachment[],
            } as TaskDetails
        },
        enabled: !!taskId,
    })
}

// ============================================
// Task - CRUD Mutations
// ============================================

/**
 * Create a new task
 */
export function useCreateTask() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (input: CreateTaskInput) => {
            const insertData = {
                title: input.title,
                description: input.description ?? null,
                status: input.status ?? 'new',
                priority: input.priority ?? 'medium',
                project_id: input.project_id ?? null,
                assigned_to: input.assigned_to ?? null,
                created_by: input.created_by,
                deadline: input.deadline ?? null,
                client_feedback: null,
            }
            const { data, error } = await supabase
                .from('tasks')
                .insert(insertData as never)
                .select()
                .single()

            if (error) throw error
            return data as unknown as TaskWithRelations
        },
        onSuccess: () => {
            // Invalidate all task queries
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
        },
    })
}

/**
 * Update an existing task
 */
export function useUpdateTask() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (input: UpdateTaskInput) => {
            const { id, ...updates } = input
            const updateData = {
                ...updates,
                updated_at: new Date().toISOString(),
            }
            const { data, error } = await supabase
                .from('tasks')
                .update(updateData as never)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data as unknown as TaskWithRelations
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
            queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.id) })
        },
    })
}

/**
 * Update task status only (optimized for Kanban drag & drop)
 * Uses optimistic updates for instant UI feedback
 */
export function useUpdateTaskStatus() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
            const { error } = await supabase
                .from('tasks')
                .update({ status, updated_at: new Date().toISOString() } as never)
                .eq('id', id)

            if (error) throw error
            return { id, status }
        },
        // Optimistic update for smooth drag experience
        onMutate: async ({ id, status }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: taskKeys.kanban() })

            // Snapshot previous value
            const previousData = queryClient.getQueryData(taskKeys.kanban())

            // Optimistically update
            queryClient.setQueryData(
                taskKeys.kanban(),
                (old: TasksByStatus | undefined) => {
                    if (!old) return old

                    const newData = { ...old }
                    // Find task and move it
                    for (const key of Object.keys(newData) as TaskStatus[]) {
                        const taskIndex = newData[key].findIndex((t) => t.id === id)
                        if (taskIndex !== -1) {
                            const [task] = newData[key].splice(taskIndex, 1)
                            task.status = status
                            task.updated_at = new Date().toISOString()
                            newData[status].unshift(task)
                            break
                        }
                    }
                    return newData
                }
            )

            return { previousData }
        },
        onError: (_, __, context) => {
            // Rollback on error
            if (context?.previousData) {
                queryClient.setQueryData(taskKeys.kanban(), context.previousData)
            }
        },
        onSettled: () => {
            // Refetch to sync with server
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
        },
    })
}

/**
 * Assign task to a user
 */
export function useAssignTask() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ taskId, userId }: { taskId: string; userId: string | null }) => {
            const { error } = await supabase
                .from('tasks')
                .update({ assigned_to: userId, updated_at: new Date().toISOString() } as never)
                .eq('id', taskId)

            if (error) throw error
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
            queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) })
        },
    })
}

/**
 * Delete a task
 */
export function useDeleteTask() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (taskId: string) => {
            // Delete attachments first (cascade might not be set)
            await supabase.from('attachments').delete().eq('task_id', taskId)
            // Delete comments
            await supabase.from('comments').delete().eq('task_id', taskId)
            // Delete task
            const { error } = await supabase.from('tasks').delete().eq('id', taskId)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
        },
    })
}

// ============================================
// Comments - CRUD
// ============================================

/**
 * Fetch comments for a task
 */
export function useTaskComments(taskId: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: taskKeys.comments(taskId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    *,
                    user:users(id, name, avatar_url)
                `)
                .eq('task_id', taskId)
                .order('created_at', { ascending: true })

            if (error) throw error
            return data as unknown as CommentWithUser[]
        },
        enabled: !!taskId,
    })
}

/**
 * Add a comment to a task
 */
export function useAddComment() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ task_id, user_id, content }: {
            task_id: string
            user_id: string
            content: string
        }) => {
            const { data, error } = await supabase
                .from('comments')
                .insert({ task_id, user_id, content } as never)
                .select(`
                    *,
                    user:users(id, name, avatar_url)
                `)
                .single()

            if (error) throw error
            return data as unknown as CommentWithUser
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: taskKeys.comments(variables.task_id) })
            queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.task_id) })
        },
    })
}

/**
 * Delete a comment
 */
export function useDeleteComment() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ commentId, taskId }: { commentId: string; taskId: string }) => {
            const { error } = await supabase.from('comments').delete().eq('id', commentId)
            if (error) throw error
            return taskId
        },
        onSuccess: (taskId) => {
            queryClient.invalidateQueries({ queryKey: taskKeys.comments(taskId) })
        },
    })
}

// ============================================
// Attachments - CRUD
// ============================================

/**
 * Fetch attachments for a task
 */
export function useTaskAttachments(taskId: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: taskKeys.attachments(taskId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('attachments')
                .select('*')
                .eq('task_id', taskId)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data as unknown as Attachment[]
        },
        enabled: !!taskId,
    })
}

/**
 * Add an attachment to a task
 */
export function useAddAttachment() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (input: {
            task_id: string
            file_url: string
            file_name: string
            file_type?: string
            file_size?: number
            uploaded_by: string
            is_final?: boolean
        }) => {
            const insertData = {
                task_id: input.task_id,
                file_url: input.file_url,
                file_name: input.file_name,
                file_type: input.file_type ?? null,
                file_size: input.file_size ?? null,
                uploaded_by: input.uploaded_by,
                is_final: input.is_final ?? false,
            }
            const { data, error } = await supabase
                .from('attachments')
                .insert(insertData as never)
                .select()
                .single()

            if (error) throw error
            return data as unknown as Attachment
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: taskKeys.attachments(variables.task_id) })
            queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.task_id) })
        },
    })
}

/**
 * Delete an attachment
 */
export function useDeleteAttachment() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ attachmentId, taskId }: { attachmentId: string; taskId: string }) => {
            const { error } = await supabase.from('attachments').delete().eq('id', attachmentId)
            if (error) throw error
            return taskId
        },
        onSuccess: (taskId) => {
            queryClient.invalidateQueries({ queryKey: taskKeys.attachments(taskId) })
            queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
        },
    })
}

/**
 * Mark attachment as final deliverable
 */
export function useMarkAttachmentFinal() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ attachmentId, taskId, isFinal }: {
            attachmentId: string
            taskId: string
            isFinal: boolean
        }) => {
            const { error } = await supabase
                .from('attachments')
                .update({ is_final: isFinal } as never)
                .eq('id', attachmentId)

            if (error) throw error
            return taskId
        },
        onSuccess: (taskId) => {
            queryClient.invalidateQueries({ queryKey: taskKeys.attachments(taskId) })
        },
    })
}

// ============================================
// Admin Tasks - Full View
// ============================================

export function useAdminTasks(filters: TaskFilters = {}) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...taskKeys.all, 'admin-full', filters],
        queryFn: async () => {
            let query = supabase
                .from('tasks')
                .select(`
                    *,
                    assigned_user:users!tasks_assigned_to_fkey(id, name, email, avatar_url),
                    creator:users!tasks_created_by_fkey(id, name, email, avatar_url),
                    project:projects!inner(
                        id, 
                        name, 
                        status,
                        client:clients(id, name, company)
                    )
                `)
                .order('created_at', { ascending: false })

            // Apply filters
            if (filters.status && filters.status !== 'all') {
                query = query.eq('status', filters.status)
            }
            if (filters.priority && filters.priority !== 'all') {
                query = query.eq('priority', filters.priority)
            }
            if (filters.assigned_to && filters.assigned_to !== 'all') {
                query = query.eq('assigned_to', filters.assigned_to)
            }
            if (filters.project_id && filters.project_id !== 'all') {
                query = query.eq('project_id', filters.project_id)
            }
            if (filters.search) {
                query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
            }
            if (filters.dateFrom) {
                query = query.gte('created_at', filters.dateFrom)
            }
            if (filters.dateTo) {
                query = query.lte('created_at', filters.dateTo)
            }

            const { data, error } = await query
            if (error) throw error
            return data
        },
        staleTime: 60 * 1000,
    })
}
