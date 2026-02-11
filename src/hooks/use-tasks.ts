'use client'

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { TaskStatus, TaskPriority, Comment, Attachment, WorkflowStage, TaskType, Department } from '@/types/database'
import type {
    TaskWithRelations,
    TaskDetails,
    CommentWithUser,
    CreateTaskInput,
    UpdateTaskInput,
    TaskFilters,
    TasksByStatus,
    ClientRequestWithDetails,
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
    departmentTasks: (dept: string) => [...taskKeys.all, 'department', dept] as const,
    editorTasks: (userId: string) => [...taskKeys.all, 'editor', userId] as const,
    pendingRequests: (userId: string) => [...taskKeys.all, 'pending-requests', userId] as const,
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
                    project:projects(id, name, status),
                    client:clients(id, name, company)
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
            if (filters.department && filters.department !== 'all') {
                query = query.eq('department', filters.department)
            }
            if (filters.task_type && filters.task_type !== 'all') {
                query = query.eq('task_type', filters.task_type)
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
export function useTasksKanban(projectId?: string, department?: Department) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...taskKeys.kanban(), projectId, department],
        queryFn: async () => {
            let query = supabase
                .from('tasks')
                .select(`
                    *,
                    assigned_user:users!tasks_assigned_to_fkey(id, name, email, avatar_url),
                    creator:users!tasks_created_by_fkey(id, name, email, avatar_url),
                    project:projects(id, name, status),
                    client:clients(id, name, company)
                `)
                .order('updated_at', { ascending: false })

            if (projectId) {
                query = query.eq('project_id', projectId)
            }

            if (department) {
                query = query.eq('department', department)
            }

            const { data, error } = await query
            if (error) throw error

            // Initialize empty columns
            const columns: TasksByStatus = {
                new: [],
                in_progress: [],
                review: [],
                client_review: [],
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
// Tasks - Client Review (For Clients)
// ============================================

/**
 * Fetch tasks awaiting client review for a specific client
 */
export function useTasksForClientReview(clientId: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...taskKeys.all, 'client-review', clientId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tasks')
                .select(`
                    *,
                    assigned_user:users!tasks_assigned_to_fkey(id, name, email, avatar_url),
                    creator:users!tasks_created_by_fkey(id, name, email, avatar_url),
                    project:projects(id, name, status),
                    attachments(id, file_url, file_name, file_type, created_at)
                `)
                .eq('client_id', clientId)
                .eq('status', 'client_review')
                .order('updated_at', { ascending: false })

            if (error) throw error
            return data as unknown as TaskWithRelations[]
        },
        enabled: !!clientId,
        staleTime: 20 * 1000, // 20 seconds for near real-time updates
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
                    project:projects(id, name, status),
                    client:clients(id, name, company)
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
 * Create a new task (supports both content and photography departments)
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
                department: input.department ?? null,
                task_type: input.task_type ?? 'general',
                workflow_stage: input.workflow_stage ?? 'none',
                project_id: input.project_id ?? null,
                client_id: input.client_id ?? null,
                assigned_to: input.assigned_to ?? null,
                editor_id: input.editor_id ?? null,
                created_by: input.created_by,
                deadline: input.deadline ?? null,
                company_name: input.company_name ?? null,
                location: input.location ?? null,
                scheduled_date: input.scheduled_date ?? null,
                scheduled_time: input.scheduled_time ?? null,
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
            // Auto-route to client_review if approving a task with client_id
            let finalStatus = status
            if (status === 'approved') {
                // Check if task has client_id
                const { data: task } = await supabase
                    .from('tasks')
                    .select('client_id')
                    .eq('id', id)
                    .single() as { data: { client_id: string | null } | null; error: unknown }
                
                if (task?.client_id) {
                    finalStatus = 'client_review'
                }
            }

            const { error } = await supabase
                .from('tasks')
                .update({ status: finalStatus, updated_at: new Date().toISOString() } as never)
                .eq('id', id)

            if (error) throw error
            return { id, status: finalStatus }
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
 * Return task for revision with reason
 */
export function useReturnTask() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ taskId, reason }: { taskId: string; reason: string }) => {
            const { error } = await supabase
                .from('tasks')
                .update({
                    status: 'revision',
                    client_feedback: reason,
                    updated_at: new Date().toISOString(),
                } as never)
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

/**
 * Apply common admin task filters to a Supabase query builder
 */
function applyAdminFilters(query: any, filters: TaskFilters) {
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
    if (filters.department && filters.department !== 'all') {
        query = query.eq('department', filters.department)
    }
    if (filters.task_type && filters.task_type !== 'all') {
        query = query.eq('task_type', filters.task_type)
    }
    return query
}

/**
 * Server-side paginated admin tasks with exact count.
 * Only fetches the needed page, reducing payload and improving speed.
 */
export function useAdminTasks(filters: TaskFilters = {}, page = 1, pageSize = 15) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...taskKeys.all, 'admin-full', filters, page, pageSize],
        queryFn: async () => {
            let query = supabase
                .from('tasks')
                .select(`
                    id, title, description, status, priority, department, task_type,
                    created_at, deadline, client_feedback,
                    assigned_user:users!tasks_assigned_to_fkey(id, name, email, avatar_url),
                    creator:users!tasks_created_by_fkey(id, name, email, avatar_url),
                    project:projects(
                        id, name, status,
                        client:clients(id, name, company)
                    )
                `, { count: 'exact' })
                .order('created_at', { ascending: false })
                .range((page - 1) * pageSize, page * pageSize - 1)

            query = applyAdminFilters(query, filters)

            const { data, error, count } = await query
            if (error) throw error
            return { data: data ?? [], totalCount: count ?? 0 }
        },
        placeholderData: keepPreviousData,
        staleTime: 60 * 1000,
    })
}

/**
 * Lightweight stats query - fetches only status column for summary counts.
 * Separate from main query so stats don't flicker on page changes.
 */
export function useAdminTasksStats(filters: TaskFilters = {}) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...taskKeys.all, 'admin-stats', filters],
        queryFn: async () => {
            let query = supabase
                .from('tasks')
                .select('status')

            query = applyAdminFilters(query, filters)

            const { data, error } = await query
            if (error) throw error

            const statuses = data ?? []
            return {
                total: statuses.length,
                in_progress: statuses.filter((t: any) => t.status === 'in_progress').length,
                review: statuses.filter((t: any) => t.status === 'review').length,
                approved: statuses.filter((t: any) => t.status === 'approved').length,
            }
        },
        placeholderData: keepPreviousData,
        staleTime: 120 * 1000, // 2 minutes - stats don't need to be as fresh
    })
}

/**
 * Fetch all admin tasks (unpaginated) for CSV export.
 * Only called on demand via enabled flag.
 */
export function useAdminTasksExport(filters: TaskFilters = {}, enabled = false) {
    const supabase = createClient()

    return useQuery({
        queryKey: [...taskKeys.all, 'admin-export', filters],
        queryFn: async () => {
            let query = supabase
                .from('tasks')
                .select(`
                    id, title, description, status, priority, department, task_type,
                    created_at, client_feedback,
                    assigned_user:users!tasks_assigned_to_fkey(id, name),
                    creator:users!tasks_created_by_fkey(id, name),
                    project:projects(
                        id, name,
                        client:clients(id, name, company)
                    )
                `)
                .order('created_at', { ascending: false })

            query = applyAdminFilters(query, filters)

            const { data, error } = await query
            if (error) throw error
            return data ?? []
        },
        enabled,
        staleTime: 0,
    })
}

// ============================================
// Photography Department - Specific Hooks
// ============================================

/**
 * Fetch tasks for a photography department by workflow stage
 */
export function usePhotographyTasks(teamLeaderId?: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: taskKeys.departmentTasks('photography'),
        queryFn: async () => {
            let query = supabase
                .from('tasks')
                .select(`
                    *,
                    assigned_user:users!tasks_assigned_to_fkey(id, name, email, avatar_url),
                    creator:users!tasks_created_by_fkey(id, name, email, avatar_url),
                    project:projects(id, name, status)
                `)
                .eq('department', 'photography')
                .order('scheduled_date', { ascending: true, nullsFirst: false })

            if (teamLeaderId) {
                query = query.eq('created_by', teamLeaderId)
            }

            const { data, error } = await query
            if (error) throw error
            return data as unknown as TaskWithRelations[]
        },
        staleTime: 15 * 1000,
    })
}

/**
 * Fetch tasks assigned to editor (for Editor/Monteur role)
 */
export function useEditorTasks(editorId: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: taskKeys.editorTasks(editorId),
        enabled: !!editorId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tasks')
                .select(`
                    *,
                    assigned_user:users!tasks_assigned_to_fkey(id, name, email, avatar_url),
                    creator:users!tasks_created_by_fkey(id, name, email, avatar_url),
                    project:projects(id, name, status)
                `)
                .eq('editor_id', editorId)
                .in('workflow_stage', ['editing', 'editing_done'])
                .order('updated_at', { ascending: false })

            if (error) throw error
            return data as unknown as TaskWithRelations[]
        },
        staleTime: 15 * 1000,
    })
}

/**
 * Advance photography workflow stage
 * Handles the full pipeline: filming → filming_done → editing → editing_done → final_review → delivered
 */
export function useAdvanceWorkflowStage() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            taskId,
            newStage,
            editorId,
        }: {
            taskId: string
            newStage: WorkflowStage
            editorId?: string
        }) => {
            const updateData: Record<string, unknown> = {
                workflow_stage: newStage,
                updated_at: new Date().toISOString(),
            }

            // When moving to editing stage, assign the editor
            if (newStage === 'editing' && editorId) {
                updateData.editor_id = editorId
            }

            // When delivered, mark task as approved
            if (newStage === 'delivered') {
                updateData.status = 'review'
            }

            // When stage is *_done, update status to review for TL
            if (['filming_done', 'editing_done', 'shooting_done'].includes(newStage)) {
                updateData.status = 'review'
            }

            // When stage moves to active work (filming, editing, shooting)
            if (['filming', 'editing', 'shooting'].includes(newStage)) {
                updateData.status = 'in_progress'
            }

            const { data, error } = await supabase
                .from('tasks')
                .update(updateData as never)
                .eq('id', taskId)
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
        },
    })
}

/**
 * Create a photography task with schedule integration
 */
export function useCreatePhotographyTask() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (input: CreateTaskInput & { schedule_id?: string }) => {
            const taskType = input.task_type ?? 'video'
            const initialStage: WorkflowStage = taskType === 'video' ? 'filming'
                : taskType === 'photo' ? 'shooting'
                : 'none'

            const insertData = {
                title: input.title,
                description: input.description ?? null,
                status: 'in_progress' as TaskStatus,
                priority: input.priority ?? 'medium',
                department: 'photography' as Department,
                task_type: taskType,
                workflow_stage: initialStage,
                project_id: input.project_id ?? null,
                assigned_to: input.assigned_to ?? null,
                editor_id: input.editor_id ?? null,
                created_by: input.created_by,
                deadline: input.deadline ?? null,
                company_name: input.company_name ?? null,
                location: input.location ?? null,
                scheduled_date: input.scheduled_date ?? null,
                scheduled_time: input.scheduled_time ?? null,
                client_feedback: null,
            }

            const { data: task, error } = await supabase
                .from('tasks')
                .insert(insertData as never)
                .select()
                .single()

            if (error) throw error

            // Link schedule if provided
            if (input.schedule_id && task) {
                await supabase
                    .from('schedules')
                    .update({ task_id: (task as any).id } as never)
                    .eq('id', input.schedule_id)
            }

            return task as unknown as TaskWithRelations
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
        },
    })
}

/**
 * Mark a photography task as complete (by worker)
 * Videographer marks filming_done, Photographer marks shooting_done, Editor marks editing_done
 */
export function useMarkTaskComplete() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ taskId, currentStage }: { taskId: string; currentStage: WorkflowStage }) => {
            let nextStage: WorkflowStage

            switch (currentStage) {
                case 'filming': nextStage = 'filming_done'; break
                case 'editing': nextStage = 'editing_done'; break
                case 'shooting': nextStage = 'shooting_done'; break
                default: throw new Error(`Cannot mark complete from stage: ${currentStage}`)
            }

            const { data, error } = await supabase
                .from('tasks')
                .update({
                    workflow_stage: nextStage,
                    status: 'review',
                    updated_at: new Date().toISOString(),
                } as never)
                .eq('id', taskId)
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
        },
    })
}

/**
 * Deliver task to client (by TL)
 */
export function useDeliverToClient() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (taskId: string) => {
            const { data, error } = await supabase
                .from('tasks')
                .update({
                    workflow_stage: 'delivered',
                    status: 'review',
                    updated_at: new Date().toISOString(),
                } as never)
                .eq('id', taskId)
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
        },
    })
}

// ============================================
// Team Leader - Client Request Review
// ============================================

/**
 * Fetch pending client requests for a team leader's department
 */
export function usePendingRequests(teamLeaderId: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: taskKeys.pendingRequests(teamLeaderId),
        queryFn: async () => {
            // Get TL's department
            const { data: tlUser } = await supabase
                .from('users')
                .select('department')
                .eq('id', teamLeaderId)
                .single() as { data: { department: string | null } | null; error: unknown }

            if (!tlUser?.department) return []

            const { data, error } = await supabase
                .from('tasks')
                .select(`
                    *,
                    creator:users!tasks_created_by_fkey(id, name, email, avatar_url),
                    project:projects(id, name, status),
                    attachments(id, file_url, file_name, file_type, file_size)
                `)
                .not('request_type', 'is', null)
                .eq('department', tlUser.department)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data as unknown as ClientRequestWithDetails[]
        },
        enabled: !!teamLeaderId,
        staleTime: 30_000,
    })
}

/**
 * Approve a client request (by team leader)
 */
export function useApproveClientRequest() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (requestId: string) => {
            const { error } = await supabase
                .from('tasks')
                .update({
                    request_status: 'approved',
                    updated_at: new Date().toISOString(),
                } as never)
                .eq('id', requestId)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
        },
    })
}

/**
 * Reject a client request with optional reason
 */
export function useRejectClientRequest() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ requestId, reason }: { requestId: string; reason?: string }) => {
            const { error } = await supabase
                .from('tasks')
                .update({
                    request_status: 'rejected',
                    rejection_reason: reason ?? null,
                    updated_at: new Date().toISOString(),
                } as never)
                .eq('id', requestId)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all })
        },
    })
}
