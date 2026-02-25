// ============================================
// Database Types - Auto-generated from schema
// ============================================

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

// Enums
export type UserRole = 'admin' | 'accountant' | 'team_leader' | 'account_manager' | 'creator' | 'designer' | 'client' | 'videographer' | 'editor' | 'photographer'
export type Department = 'photography' | 'content'
export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'cancelled'
export type TaskStatus = 'new' | 'in_progress' | 'review' | 'client_review' | 'revision' | 'approved' | 'rejected' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskType = 'video' | 'photo' | 'editing' | 'content' | 'general'
export type WorkflowStage = 'filming' | 'filming_done' | 'editing' | 'editing_done' | 'final_review' | 'shooting' | 'shooting_done' | 'delivered' | 'none'
export type ScheduleStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type MessageType = 'text' | 'image' | 'file'
export type TransactionType = 'income' | 'expense'
export type RequestType = 'new_task' | 'modification'
export type RequestStatus = 'pending_approval' | 'approved' | 'rejected'
export type MissingItemsStatus = 'pending' | 'resolved' | 'not_applicable'
export type ScheduleType = 'reels' | 'post'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type AdvanceRecipientType = 'employee' | 'owner'

export interface ScheduleLink {
    url: string
    comment: string
}

// ============================================
// Table Types
// ============================================

export interface User {
    id: string
    email: string
    name: string | null
    phone: string | null
    role: UserRole
    department: Department | null
    avatar_url: string | null
    is_active: boolean
    created_at: string
}

export interface Client {
    id: string
    user_id: string | null
    name: string
    email: string | null
    phone: string | null
    notes: string | null
    created_at: string
}

export interface ClientAssignment {
    id: string
    client_id: string
    user_id: string
    assigned_by: string
    created_at: string
}

export interface ClientAssignmentWithRelations extends ClientAssignment {
    client?: Client | null
    user?: Pick<User, 'id' | 'name' | 'email' | 'role' | 'avatar_url' | 'department'> | null
    assigner?: Pick<User, 'id' | 'name' | 'role'> | null
}

export interface Project {
    id: string
    client_id: string | null
    name: string
    description: string | null
    status: ProjectStatus
    department: Department | null
    budget: number | null
    start_date: string | null
    end_date: string | null
    created_by: string | null
    created_at: string
}

export interface Task {
    id: string
    project_id: string | null
    title: string
    description: string | null
    status: TaskStatus
    priority: TaskPriority
    department: Department | null
    task_type: TaskType
    workflow_stage: WorkflowStage
    assigned_to: string | null
    created_by: string | null
    editor_id: string | null
    deadline: string | null
    client_feedback: string | null
    company_name: string | null
    location: string | null
    scheduled_date: string | null
    scheduled_time: string | null
    request_type: RequestType | null
    request_status: RequestStatus | null
    rejection_reason: string | null
    original_task_id: string | null
    client_id: string | null
    created_at: string
    updated_at: string
}

export interface Attachment {
    id: string
    task_id: string | null
    file_url: string
    file_name: string | null
    file_type: string | null
    file_size: number | null
    is_final: boolean
    uploaded_by: string | null
    created_at: string
}

export interface Comment {
    id: string
    task_id: string | null
    user_id: string | null
    content: string
    created_at: string
}

export interface Treasury {
    id: string
    current_balance: number
    updated_at: string
}

export type PaymentMethod = 'cash' | 'transfer' | 'check'

export interface Advance {
    id: string
    recipient_id: string | null
    recipient_type: AdvanceRecipientType
    recipient_name: string
    amount: number
    notes: string | null
    transaction_id: string | null
    created_by: string | null
    created_at: string
}

export interface AdvanceRecipient {
    id: string
    name: string
    recipient_type: AdvanceRecipientType
    created_by: string | null
    created_at: string
}

export interface AdvanceRecipientWithAdvances extends AdvanceRecipient {
    advances: Pick<Advance, 'id' | 'amount' | 'notes' | 'transaction_id' | 'created_at'>[]
}

export interface Transaction {
    id: string
    type: TransactionType
    payment_method: PaymentMethod
    amount: number
    description: string | null
    category: string | null
    sub_category: string | null
    receipt_url: string | null
    client_id: string | null
    project_id: string | null
    client_account_id: string | null
    transaction_date: string | null
    is_approved: boolean
    approved_by: string | null
    approved_at: string | null
    visible_to_client: boolean
    notes: string | null
    created_by: string | null
    created_at: string
}

export interface TreasuryLog {
    id: string
    transaction_id: string | null
    action: 'create' | 'update' | 'delete' | 'approve' | 'reject'
    performed_by: string
    client_id: string | null
    client_name: string | null
    amount: number | null
    transaction_type: 'income' | 'expense' | null
    category: string | null
    description: string | null
    changes: Json | null
    created_at: string
}

export interface Package {
    id: string
    name: string
    name_ar: string | null
    price: number
    duration_days: number
    description: string | null
    description_ar: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface ClientAccount {
    id: string
    client_id: string
    package_id: string | null
    package_name: string | null
    package_name_ar: string | null
    package_price: number | null
    package_description: string | null
    package_description_ar: string | null
    package_duration_days: number | null
    remaining_balance: number
    start_date: string
    end_date: string | null
    is_active: boolean
    created_by: string | null
    created_at: string
    updated_at: string
}

// Extended Types with Relations
export interface ClientAccountWithRelations extends ClientAccount {
    client?: Client
    package?: Package
    transactions?: Transaction[]
}

export interface Notification {
    id: string
    user_id: string | null
    title: string
    message: string | null
    link: string | null
    is_read: boolean
    created_at: string
}

export interface SiteSetting {
    id: string
    key: string
    value: Json
    type: string | null
    updated_at: string
}

export interface Page {
    id: string
    slug: string
    title_en: string | null
    title_ar: string | null
    content_en: Json | null
    content_ar: Json | null
    is_published: boolean
    updated_at: string
}

export interface TeamMember {
    id: string
    name_en: string
    name_ar: string | null
    position_en: string | null
    position_ar: string | null
    bio_en: string | null
    bio_ar: string | null
    photo_url: string | null
    display_order: number
    is_active: boolean
    created_at: string
}

export interface PortfolioItem {
    id: string
    title_en: string
    title_ar: string | null
    description_en: string | null
    description_ar: string | null
    images: Json
    category: string | null
    is_featured: boolean
    created_at: string
}

export interface ActivityLog {
    id: string
    user_id: string | null
    action: string
    details: Json | null
    ip_address: string | null
    created_at: string
}

export interface StorageSettings {
    id: string
    auto_delete_months: number
    last_cleanup: string | null
}

// ============================================
// New Tables - v2 Department System
// ============================================

export interface Schedule {
    id: string
    department: Department
    team_leader_id: string
    client_id: string | null
    project_id: string | null
    task_id: string | null
    assigned_members: string[]
    company_name: string
    title: string
    description: string | null
    scheduled_date: string
    start_time: string
    end_time: string | null
    location: string | null
    status: ScheduleStatus
    notes: string | null
    missing_items: string | null
    missing_items_status: MissingItemsStatus
    schedule_type: ScheduleType
    created_by: string | null
    approval_status: ApprovalStatus
    manager_notes: string | null
    links: ScheduleLink[]
    images: string[]
    created_at: string
    updated_at: string
}

export interface Conversation {
    id: string
    project_id: string | null
    department: Department | null
    created_at: string
    updated_at: string
    last_message_at: string
}

export interface ConversationParticipant {
    id: string
    conversation_id: string
    user_id: string
    last_read_at: string | null
    joined_at: string
}

export interface Message {
    id: string
    conversation_id: string
    sender_id: string
    content: string | null
    message_type: MessageType
    file_url: string | null
    file_name: string | null
    is_read: boolean
    created_at: string
}

// ============================================
// Database Schema Type (for Supabase Client)
// ============================================
export interface Database {
    public: {
        Tables: {
            users: {
                Row: User
                Insert: Omit<User, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<Omit<User, 'id'>>
            }
            clients: {
                Row: Client
                Insert: Omit<Client, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<Omit<Client, 'id'>>
            }
            projects: {
                Row: Project
                Insert: Omit<Project, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<Omit<Project, 'id'>>
            }
            tasks: {
                Row: Task
                Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
                Update: Partial<Omit<Task, 'id'>>
            }
            attachments: {
                Row: Attachment
                Insert: Omit<Attachment, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<Omit<Attachment, 'id'>>
            }
            comments: {
                Row: Comment
                Insert: Omit<Comment, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<Omit<Comment, 'id'>>
            }
            treasury: {
                Row: Treasury
                Insert: Omit<Treasury, 'id' | 'updated_at'> & { id?: string; updated_at?: string }
                Update: Partial<Omit<Treasury, 'id'>>
            }
            transactions: {
                Row: Transaction
                Insert: Omit<Transaction, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<Omit<Transaction, 'id'>>
            }
            notifications: {
                Row: Notification
                Insert: Omit<Notification, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<Omit<Notification, 'id'>>
            }
            site_settings: {
                Row: SiteSetting
                Insert: Omit<SiteSetting, 'id' | 'updated_at'> & { id?: string; updated_at?: string }
                Update: Partial<Omit<SiteSetting, 'id'>>
            }
            pages: {
                Row: Page
                Insert: Omit<Page, 'id' | 'updated_at'> & { id?: string; updated_at?: string }
                Update: Partial<Omit<Page, 'id'>>
            }
            team_members: {
                Row: TeamMember
                Insert: Omit<TeamMember, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<Omit<TeamMember, 'id'>>
            }
            portfolio: {
                Row: PortfolioItem
                Insert: Omit<PortfolioItem, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<Omit<PortfolioItem, 'id'>>
            }
            activity_log: {
                Row: ActivityLog
                Insert: Omit<ActivityLog, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<Omit<ActivityLog, 'id'>>
            }
            storage_settings: {
                Row: StorageSettings
                Insert: Omit<StorageSettings, 'id'> & { id?: string }
                Update: Partial<Omit<StorageSettings, 'id'>>
            }
            schedules: {
                Row: Schedule
                Insert: Omit<Schedule, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
                Update: Partial<Omit<Schedule, 'id'>>
            }
            conversations: {
                Row: Conversation
                Insert: Omit<Conversation, 'id' | 'created_at' | 'updated_at' | 'last_message_at'> & { id?: string; created_at?: string; updated_at?: string; last_message_at?: string }
                Update: Partial<Omit<Conversation, 'id'>>
            }
            conversation_participants: {
                Row: ConversationParticipant
                Insert: Omit<ConversationParticipant, 'id' | 'joined_at'> & { id?: string; joined_at?: string }
                Update: Partial<Omit<ConversationParticipant, 'id'>>
            }
            messages: {
                Row: Message
                Insert: Omit<Message, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<Omit<Message, 'id'>>
            }
            treasury_logs: {
                Row: TreasuryLog
                Insert: Omit<TreasuryLog, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<Omit<TreasuryLog, 'id'>>
            }
            packages: {
                Row: Package
                Insert: Omit<Package, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
                Update: Partial<Omit<Package, 'id'>>
            }
            client_accounts: {
                Row: ClientAccount
                Insert: Omit<ClientAccount, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
                Update: Partial<Omit<ClientAccount, 'id'>>
            }
            advances: {
                Row: Advance
                Insert: Omit<Advance, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<Omit<Advance, 'id'>>
            }
            advance_recipients: {
                Row: AdvanceRecipient
                Insert: Omit<AdvanceRecipient, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<Omit<AdvanceRecipient, 'id'>>
            }
        }
        Enums: {
            user_role: UserRole
            department: Department
            project_status: ProjectStatus
            task_status: TaskStatus
            task_priority: TaskPriority
            task_type: TaskType
            workflow_stage: WorkflowStage
            schedule_status: ScheduleStatus
            message_type: MessageType
            transaction_type: TransactionType
            request_type: RequestType
            request_status: RequestStatus
            advance_recipient_type: AdvanceRecipientType
        }
    }
}
