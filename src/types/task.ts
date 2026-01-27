// ============================================
// Task Management Types - Extended & Enriched
// ============================================

import type { Task, TaskStatus, TaskPriority, User, Project, Comment, Attachment } from './database'

// ============================================
// Extended Task Types with Relations
// ============================================

/**
 * Task with all related data populated for display
 */
export interface TaskWithRelations extends Task {
    assigned_user?: Pick<User, 'id' | 'name' | 'email' | 'avatar_url'> | null
    creator?: Pick<User, 'id' | 'name' | 'email' | 'avatar_url'> | null
    project?: Pick<Project, 'id' | 'name' | 'status'> | null
    comments_count?: number
    attachments_count?: number
}

/**
 * Full task details with all nested data
 */
export interface TaskDetails extends TaskWithRelations {
    comments?: CommentWithUser[]
    attachments?: Attachment[]
}

/**
 * Comment with user data
 */
export interface CommentWithUser extends Comment {
    user?: Pick<User, 'id' | 'name' | 'avatar_url'> | null
}

// ============================================
// Kanban Board Types
// ============================================

/**
 * Kanban column definition
 */
export interface KanbanColumn {
    id: TaskStatus
    title: string
    titleAr: string
    color: string
    bgColor: string
    icon: string
}

/**
 * Kanban columns configuration
 */
export const KANBAN_COLUMNS: KanbanColumn[] = [
    {
        id: 'new',
        title: 'New',
        titleAr: 'جديد',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10 border-blue-500/30',
        icon: 'Plus'
    },
    {
        id: 'in_progress',
        title: 'In Progress',
        titleAr: 'قيد التنفيذ',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10 border-yellow-500/30',
        icon: 'Clock'
    },
    {
        id: 'review',
        title: 'Review',
        titleAr: 'مراجعة',
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10 border-purple-500/30',
        icon: 'Eye'
    },
    {
        id: 'revision',
        title: 'Revision',
        titleAr: 'تعديل',
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10 border-orange-500/30',
        icon: 'RotateCcw'
    },
    {
        id: 'approved',
        title: 'Approved',
        titleAr: 'معتمد',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10 border-green-500/30',
        icon: 'Check'
    },
    {
        id: 'rejected',
        title: 'Rejected',
        titleAr: 'مرفوض',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10 border-red-500/30',
        icon: 'X'
    },
]

/**
 * Get column config by status
 */
export function getColumnConfig(status: TaskStatus): KanbanColumn {
    return KANBAN_COLUMNS.find(col => col.id === status) ?? KANBAN_COLUMNS[0]
}

// ============================================
// Priority Configuration
// ============================================

export interface PriorityConfig {
    id: TaskPriority
    label: string
    labelAr: string
    color: string
    bgColor: string
}

export const PRIORITY_CONFIG: PriorityConfig[] = [
    { id: 'low', label: 'Low', labelAr: 'منخفض', color: 'text-slate-500', bgColor: 'bg-slate-500/10' },
    { id: 'medium', label: 'Medium', labelAr: 'متوسط', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { id: 'high', label: 'High', labelAr: 'عالي', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { id: 'urgent', label: 'Urgent', labelAr: 'عاجل', color: 'text-red-500', bgColor: 'bg-red-500/10' },
]

export function getPriorityConfig(priority: TaskPriority): PriorityConfig {
    return PRIORITY_CONFIG.find(p => p.id === priority) ?? PRIORITY_CONFIG[1]
}

// ============================================
// Form Types
// ============================================

export interface CreateTaskInput {
    title: string
    description?: string
    status?: TaskStatus
    priority?: TaskPriority
    project_id?: string
    assigned_to?: string
    created_by: string
    deadline?: string
}

export interface UpdateTaskInput {
    id: string
    title?: string
    description?: string
    status?: TaskStatus
    priority?: TaskPriority
    project_id?: string
    assigned_to?: string
    deadline?: string
    client_feedback?: string
}

export interface CreateCommentInput {
    task_id: string
    user_id: string
    content: string
}

export interface CreateAttachmentInput {
    task_id: string
    file_url: string
    file_name: string
    file_type?: string
    file_size?: number
    uploaded_by: string
    is_final?: boolean
}

// ============================================
// Filter & Search Types
// ============================================

export interface TaskFilters {
    status?: TaskStatus | 'all'
    priority?: TaskPriority | 'all'
    assigned_to?: string | 'all'
    project_id?: string | 'all'
    search?: string
    dateFrom?: string
    dateTo?: string
}

export interface TaskSortOptions {
    field: 'created_at' | 'updated_at' | 'deadline' | 'priority' | 'title'
    direction: 'asc' | 'desc'
}

// ============================================
// Workflow Transitions (Business Logic)
// ============================================

/**
 * Valid status transitions based on role
 */
export const STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
    new: ['in_progress'],
    in_progress: ['review'],
    review: ['approved', 'in_progress'], // Leader can approve or request changes
    revision: ['in_progress'],
    approved: [], // Final state internally, can go to client
    rejected: ['in_progress'], // Can be reassigned
}

/**
 * Check if status transition is valid
 */
export function isValidTransition(from: TaskStatus, to: TaskStatus): boolean {
    return STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

// ============================================
// Utility Types
// ============================================

export type TasksByStatus = Record<TaskStatus, TaskWithRelations[]>

export interface KanbanDragResult {
    taskId: string
    sourceStatus: TaskStatus
    destinationStatus: TaskStatus
    sourceIndex: number
    destinationIndex: number
}
