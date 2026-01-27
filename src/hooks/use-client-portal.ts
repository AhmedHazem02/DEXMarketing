'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Project, Task, Client } from '@/types/database'
import type { TaskWithRelations, TaskDetails } from '@/types/task'

const CLIENT_KEYS = {
    all: ['client-portal'] as const,
    profile: (userId: string) => [...CLIENT_KEYS.all, 'profile', userId] as const,
    projects: (clientId: string) => [...CLIENT_KEYS.all, 'projects', clientId] as const,
    project: (projectId: string) => [...CLIENT_KEYS.all, 'project', projectId] as const,
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
        queryKey: CLIENT_KEYS.projects((clientId ?? '') as string),
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
            // Fetch project
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single()

            if (projectError) throw projectError

            // Fetch tasks separately to ensure clean types
            // We only want tasks that are 'review' or 'approved' or 'in_progress' to show progress
            const { data: tasks, error: tasksError } = await supabase
                .from('tasks')
                .select(`
                    *,
                    assigned_to_user:users!assigned_to(id, name, avatar_url),
                    created_by_user:users!created_by(id, name, avatar_url),
                    attachments(*),
                    comments(*)
                `)
                .eq('project_id', projectId)
                .order('created_at', { ascending: false })

            if (tasksError) throw tasksError

            return {
                project: project as unknown as Project,
                tasks: tasks as unknown as TaskDetails[]
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
