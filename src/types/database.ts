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
export type UserRole = 'admin' | 'accountant' | 'team_leader' | 'creator' | 'client'
export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'cancelled'
export type TaskStatus = 'new' | 'in_progress' | 'review' | 'revision' | 'approved' | 'rejected'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TransactionType = 'income' | 'expense'

// ============================================
// Table Types
// ============================================

export interface User {
    id: string
    email: string
    name: string | null
    phone: string | null
    role: UserRole
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
    company: string | null
    notes: string | null
    created_at: string
}

export interface Project {
    id: string
    client_id: string | null
    name: string
    description: string | null
    status: ProjectStatus
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
    assigned_to: string | null
    created_by: string | null
    deadline: string | null
    client_feedback: string | null
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

export interface Transaction {
    id: string
    type: TransactionType
    amount: number
    description: string | null
    category: string | null
    receipt_url: string | null
    client_id: string | null
    project_id: string | null
    created_by: string | null
    created_at: string
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
        }
        Enums: {
            user_role: UserRole
            project_status: ProjectStatus
            task_status: TaskStatus
            task_priority: TaskPriority
            transaction_type: TransactionType
        }
    }
}
