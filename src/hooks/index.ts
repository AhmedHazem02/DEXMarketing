export { useUsers, useUser, useCurrentUser, useUpdateUser, useDeleteUser } from './use-users'
export {
    // Query keys
    taskKeys,
    // Task lists
    useTasks,
    useTasksKanban,
    useMyTasks,
    useRevisionsTasks,
    // Single task
    useTaskDetails,
    // Task mutations
    useCreateTask,
    useUpdateTask,
    useUpdateTaskStatus,
    useAssignTask,
    useDeleteTask,
    // Comments
    useTaskComments,
    useAddComment,
    useDeleteComment,
    // Attachments
    useTaskAttachments,
    useAddAttachment,
    useDeleteAttachment,
    useMarkAttachmentFinal,
    // Admin
    useAdminTasks,
    useAdminTasksStats,
    useAdminTasksExport,
    // Photography department
    usePhotographyTasks,
    useEditorTasks,
    useAdvanceWorkflowStage,
    useCreatePhotographyTask,
    useMarkTaskComplete,
    useDeliverToClient,
} from './use-tasks'
export {
    useTreasury,
    useTransactions,
    useTransactionSummary,
    useCreateTransaction,
    useDeleteTransaction
} from './use-treasury'
export {
    useRealtimeSubscription,
    useNotificationsRealtime,
    useTasksRealtime
} from './use-realtime'
export {
    useSiteSettings,
    useUpdateSiteSetting,
    usePages,
    usePage,
    useUpdatePage,
    useTeamMembers,
    useCreateTeamMember,
    useUpdateTeamMember,
    useDeleteTeamMember,
    usePortfolio,
    useCreatePortfolioItem,
    useDeletePortfolioItem,
    useStorageSettings,
    useUpdateStorageSettings,
    useActivityLog,
    useLogActivity,
} from './use-cms'
export {
    useClientProfile,
    useClientProjects,
    useClientProjectDetails,
    useApproveTask,
    useRejectTask,
} from './use-client-portal'
// Client hooks
export {
    clientKeys,
    useClients,
    useClient,
    useUpdateClient,
    useDeleteClient,
} from './use-clients'
// Project hooks
export {
    projectKeys,
    useProjects,
    useProject,
    useCreateProject,
    useUpdateProject,
    useDeleteProject,
} from './use-projects'
// Schedule hooks
export {
    scheduleKeys,
    useSchedules,
    useCalendarSchedules,
    useMySchedules,
    useClientSchedules,
    useScheduleDetail,
    useCreateSchedule,
    useUpdateSchedule,
    useDeleteSchedule,
    useUpdateScheduleStatus,
} from './use-schedule'
// Chat hooks
export {
    chatKeys,
    useConversations,
    useMessages,
    useSendMessage,
    useCreateConversation,
    useMarkMessagesRead,
    useUnreadCount,
    useChatRealtime,
    useTypingIndicator,
    useFindOrCreateConversation,
} from './use-chat'

// Utility hooks
export { usePagination } from './use-pagination'
export { useDebounce } from './use-debounce'
