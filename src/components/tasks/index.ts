// Task Management Components - Central Export
// ============================================

export { KanbanBoard } from './kanban-board'
export { TaskForm } from './task-form'
export { TaskDetails } from './task-details'
export { FileUploadZone } from './file-upload-zone'
export { RevisionsHub } from './revisions-hub'
export { PendingRequests } from './pending-requests'
export { ReturnTaskDialog } from './return-task-dialog'

// Re-export types for convenience
export type {
    TaskWithRelations,
    TaskDetails as TaskDetailsType,
    CommentWithUser,
    CreateTaskInput,
    UpdateTaskInput,
    TaskFilters,
    TasksByStatus,
    KanbanColumn,
    PriorityConfig,
} from '@/types/task'

export {
    KANBAN_COLUMNS,
    PRIORITY_CONFIG,
    getColumnConfig,
    getPriorityConfig,
    isValidTransition,
} from '@/types/task'
