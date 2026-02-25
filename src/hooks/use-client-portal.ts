'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project, Task, Client, Attachment } from '@/types/database'
import type { TaskWithRelations, TaskDetails, CreateClientRequestInput, ClientRequestFilters, ClientRequestWithDetails } from '@/types/task'

const CLIENT_KEYS = {
    all: ['client-portal'] as const,
    profile: (userId: string) => [...CLIENT_KEYS.all, 'profile', userId] as const,
    projects: (clientId: string) => [...CLIENT_KEYS.all, 'projects', clientId] as const,
    project: (projectId: string) => [...CLIENT_KEYS.all, 'project', projectId] as const,
    requests: () => [...CLIENT_KEYS.all, 'requests'] as const,
    requestList: (userId: string, filters?: ClientRequestFilters) => [...CLIENT_KEYS.requests(), userId, filters] as const,
    requestDetail: (requestId: string) => [...CLIENT_KEYS.requests(), 'detail', requestId] as const,
}

/**
 * Fetch client profile by user ID
 */
export function useClientProfile(userId: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: CLIENT_KEYS.profile(userId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle() // Use maybeSingle instead of single to handle 0 rows gracefully

            if (error) throw error
            return data as unknown as Client | null
        },
        enabled: !!userId,
    })
}

/**
 * Fetch projects for a specific client
 */
export function useClientProjects(clientId?: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: CLIENT_KEYS.projects(clientId ?? ''),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('projects')
                .select(`
                    *,
                    tasks (
                        id,
                        status,
                        priority,
                        title,
                        deadline
                    )
                `)
                .eq('client_id', clientId ?? '')
                .order('created_at', { ascending: false })

            if (error) throw error
            return data as unknown as (Project & { tasks: { id: string; status: string; title: string; deadline: string | null }[] })[]
        },
        enabled: !!clientId,
    })
}

/**
 * Fetch single project details with tasks for approval
 */
export function useClientProjectDetails(projectId: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: CLIENT_KEYS.project(projectId),
        queryFn: async () => {
            // Fetch project and tasks in parallel (independent queries)
            const [projectResult, tasksResult] = await Promise.all([
                supabase
                    .from('projects')
                    .select('*')
                    .eq('id', projectId)
                    .single(),
                supabase
                    .from('tasks')
                    .select(`
                        *,
                        assigned_to_user:users!assigned_to(id, name, avatar_url),
                        created_by_user:users!created_by(id, name, avatar_url),
                        attachments(id, file_url, file_name, file_type, created_at),
                        comments(id, content, created_at, user_id)
                    `)
                    .eq('project_id', projectId)
                    .order('created_at', { ascending: false }),
            ])

            if (projectResult.error) throw projectResult.error
            if (tasksResult.error) throw tasksResult.error

            return {
                project: projectResult.data as unknown as Project,
                tasks: tasksResult.data as unknown as TaskDetails[]
            }
        },
        enabled: !!projectId,
    })
}

/**
 * Approve a task
 */
export function useApproveTask() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ taskId, feedback }: { taskId: string; feedback?: string }) => {
            const { error } = await supabase
                .from('tasks')
                .update({
                    status: 'approved',
                    client_feedback: feedback || 'Approved by client',
                    updated_at: new Date().toISOString()
                } as never)
                .eq('id', taskId)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.all })
        },
    })
}

/**
 * Reject a task (Request Revision)
 */
export function useRejectTask() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ taskId, feedback }: { taskId: string; feedback: string }) => {
            const { error } = await supabase
                .from('tasks')
                .update({
                    status: 'revision',
                    client_feedback: feedback,
                    updated_at: new Date().toISOString()
                } as never)
                .eq('id', taskId)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.all })
        },
    })
}

// ============================================
// Client Task Requests
// ============================================

/**
 * Fetch client's task requests with optional filters
 */
export function useClientRequests(clientUserId: string, filters?: ClientRequestFilters) {
    const supabase = createClient()

    return useQuery({
        queryKey: CLIENT_KEYS.requestList(clientUserId, filters),
        queryFn: async () => {
            let query = supabase
                .from('tasks')
                .select(`
                    *,
                    assigned_user:users!tasks_assigned_to_fkey(id, name, email, avatar_url),
                    project:projects(id, name, status),
                    attachments(id, file_url, file_name, file_type, file_size)
                `)
                .eq('created_by', clientUserId)
                .not('request_type', 'is', null)
                .order('created_at', { ascending: false })

            if (filters?.request_type && filters.request_type !== 'all') {
                query = query.eq('request_type', filters.request_type)
            }
            if (filters?.request_status && filters.request_status !== 'all') {
                query = query.eq('request_status', filters.request_status)
            }
            if (filters?.department && filters.department !== 'all') {
                query = query.eq('department', filters.department)
            }

            const { data, error } = await query
            if (error) throw error
            return data as unknown as ClientRequestWithDetails[]
        },
        enabled: !!clientUserId,
        staleTime: 30_000,
    })
}

/**
 * Fetch a single client request with full details
 */
export function useClientRequestDetail(requestId: string) {
    const supabase = createClient()

    return useQuery({
        queryKey: CLIENT_KEYS.requestDetail(requestId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tasks')
                .select(`
                    *,
                    assigned_user:users!tasks_assigned_to_fkey(id, name, email, avatar_url),
                    creator:users!tasks_created_by_fkey(id, name, email, avatar_url),
                    project:projects(id, name, status),
                    attachments(*)
                `)
                .eq('id', requestId)
                .single()

            if (error) throw error
            return data as unknown as ClientRequestWithDetails
        },
        enabled: !!requestId,
    })
}

/**
 * Create a client task request
 * Auto-assigns to department team leader and sets pending status
 */
export function useCreateClientRequest() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (input: CreateClientRequestInput) => {
            // 1. Find the team leader for the selected department
            const { data: teamLeader } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'team-leader')
                .eq('department', input.department)
                .eq('is_active', true)
                .limit(1)
                .maybeSingle() as { data: { id: string } | null; error: unknown }

            // 2. Insert the task request
            const insertData = {
                title: input.title,
                description: input.description ?? null,
                status: 'new' as const,
                priority: 'medium' as const,
                department: input.department,
                task_type: input.task_type,
                workflow_stage: 'none' as const,
                project_id: input.project_id ?? null,
                assigned_to: teamLeader?.id ?? null,
                created_by: input.created_by,
                deadline: input.deadline ?? null,
                request_type: input.request_type,
                request_status: 'pending_approval' as const,
                original_task_id: input.original_task_id ?? null,
                client_feedback: null,
                company_name: null,
                location: null,
                scheduled_date: null,
                scheduled_time: null,
                editor_id: null,
                rejection_reason: null,
            }

            const { data, error } = await supabase
                .from('tasks')
                .insert(insertData as never)
                .select()
                .single()

            if (error) throw error
            return data as unknown as Task
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.requests() })
            queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.all })
        },
    })
}

/**
 * Get counts of client requests by status
 */
export function useClientRequestCounts(clientUserId: string) {
    const { data: requests } = useClientRequests(clientUserId)

    const counts = useMemo(() => ({
        total: requests?.length ?? 0,
        pending: requests?.filter(r => r.request_status === 'pending_approval').length ?? 0,
        approved: requests?.filter(r => r.request_status === 'approved').length ?? 0,
        rejected: requests?.filter(r => r.request_status === 'rejected').length ?? 0,
    }), [requests])

    return counts
}
