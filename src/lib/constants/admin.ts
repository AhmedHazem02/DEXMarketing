// ============================================
// Shared Admin Constants
// Centralized to avoid duplication across components
// ============================================

import type { TaskStatus, TaskPriority, Department } from '@/types/database'

// ============================================
// Department Options
// ============================================

export const DEPARTMENT_OPTIONS = [
    { value: 'all', label: 'كل الأقسام', labelEn: 'All Departments' },
    { value: 'content', label: 'قسم المحتوى', labelEn: 'Content' },
    { value: 'photography', label: 'قسم التصوير', labelEn: 'Photography' },
] as const

export const DASHBOARD_DEPARTMENT_OPTIONS = [
    { value: 'all', label: 'كل الأقسام', labelEn: 'All Departments' },
    { value: 'content', label: 'المحتوى', labelEn: 'Content' },
    { value: 'photography', label: 'التصوير', labelEn: 'Photography' },
] as const

// ============================================
// Task Status Configuration
// ============================================

export interface StatusConfig {
    label: string
    labelEn: string
    style: string
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
    new: { label: 'جديدة', labelEn: 'New', style: 'bg-blue-100 text-blue-700 border-blue-200' },
    in_progress: { label: 'قيد التنفيذ', labelEn: 'In Progress', style: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    review: { label: 'مراجعة', labelEn: 'Review', style: 'bg-purple-100 text-purple-700 border-purple-200' },
    client_review: { label: 'مراجعة العميل', labelEn: 'Client Review', style: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    revision: { label: 'تعديل مطلوب', labelEn: 'Revision', style: 'bg-orange-100 text-orange-700 border-orange-200' },
    approved: { label: 'معتمد', labelEn: 'Approved', style: 'bg-green-100 text-green-700 border-green-200' },
    rejected: { label: 'مرفوض', labelEn: 'Rejected', style: 'bg-red-100 text-red-700 border-red-200' },
    completed: { label: 'مكتمل', labelEn: 'Completed', style: 'bg-gray-100 text-gray-700 border-gray-200' },
} as const

export const STATUS_OPTIONS = [
    { value: 'all', label: 'كل الحالات', labelEn: 'All Statuses' },
    { value: 'new', label: 'جديدة', labelEn: 'New' },
    { value: 'in_progress', label: 'قيد التنفيذ', labelEn: 'In Progress' },
    { value: 'review', label: 'مراجعة', labelEn: 'Review' },
    { value: 'revision', label: 'تعديل مطلوب', labelEn: 'Revision' },
    { value: 'client_review', label: 'مراجعة العميل', labelEn: 'Client Review' },
    { value: 'approved', label: 'معتمد', labelEn: 'Approved' },
    { value: 'rejected', label: 'مرفوض', labelEn: 'Rejected' },
    { value: 'completed', label: 'مكتمل', labelEn: 'Completed' },
] as const

// ============================================
// Priority Configuration
// ============================================

export interface PriorityStyleConfig {
    label: string
    labelEn: string
    style: string
    dotColor: string
}

export const PRIORITY_STYLE_CONFIG: Record<string, PriorityStyleConfig> = {
    urgent: { label: 'عاجل', labelEn: 'Urgent', style: 'bg-red-100 text-red-800 border-red-200', dotColor: 'bg-red-500' },
    high: { label: 'عالي', labelEn: 'High', style: 'bg-orange-100 text-orange-800 border-orange-200', dotColor: 'bg-orange-500' },
    medium: { label: 'متوسط', labelEn: 'Medium', style: 'bg-blue-100 text-blue-800 border-blue-200', dotColor: 'bg-blue-400' },
    low: { label: 'منخفض', labelEn: 'Low', style: 'bg-slate-100 text-slate-600 border-slate-200', dotColor: 'bg-slate-300' },
} as const

export const PRIORITY_OPTIONS = [
    { value: 'all', label: 'كل الأولويات', labelEn: 'All Priorities' },
    { value: 'urgent', label: 'عاجل', labelEn: 'Urgent' },
    { value: 'high', label: 'عالي', labelEn: 'High' },
    { value: 'medium', label: 'متوسط', labelEn: 'Medium' },
    { value: 'low', label: 'منخفض', labelEn: 'Low' },
] as const

// ============================================
// Task Type Options
// ============================================

export const TASK_TYPE_OPTIONS = [
    { value: 'all', label: 'كل الأنواع', labelEn: 'All Types' },
    { value: 'video', label: 'فيديو', labelEn: 'Video' },
    { value: 'photo', label: 'تصوير', labelEn: 'Photo' },
    { value: 'editing', label: 'مونتاج', labelEn: 'Editing' },
    { value: 'content', label: 'محتوى', labelEn: 'Content' },
    { value: 'general', label: 'عام', labelEn: 'General' },
] as const

// ============================================
// Department Badge Configuration
// ============================================

export const DEPARTMENT_BADGE_CONFIG: Record<string, { label: string; labelEn: string; className: string }> = {
    content: { label: 'محتوى', labelEn: 'Content', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    photography: { label: 'تصوير', labelEn: 'Photography', className: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
} as const

// ============================================
// Period Options (Dashboard)
// ============================================

export const PERIOD_OPTIONS = [
    { value: 'month', label: 'هذا الشهر', labelEn: 'This Month' },
    { value: 'week', label: 'هذا الأسبوع', labelEn: 'This Week' },
    { value: 'day', label: 'اليوم', labelEn: 'Today' },
    { value: 'year', label: 'هذا العام', labelEn: 'This Year' },
] as const

export type Period = 'day' | 'week' | 'month' | 'year'

// ============================================
// Locale-aware Formatters
// ============================================

const formatters = {
    ar: {
        currency: new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }),
        date: new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short' }),
    },
    en: {
        currency: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }),
        date: new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' }),
    },
}

export function getFormatters(locale: string = 'ar') {
    const key = locale === 'en' ? 'en' : 'ar'
    return {
        formatCurrency: (amount: number) => formatters[key].currency.format(amount),
        formatDate: (date: string) => formatters[key].date.format(new Date(date)),
    }
}

// ============================================
// Role Labels
// ============================================

/**
 * Get human-readable role label for display
 */
export function getRoleLabel(role: string, isAr: boolean): string {
    const labels: Record<string, { en: string; ar: string }> = {
        account_manager: { en: 'Content Manager', ar: 'مدير المحتوي' },
        designer: { en: 'Designer', ar: 'مصمم' },
        videographer: { en: 'Videographer', ar: 'مصور فيديو' },
        photographer: { en: 'Photographer', ar: 'مصور' },
        editor: { en: 'Editor', ar: 'محرر' },
        creator: { en: 'Creator', ar: 'صانع محتوى' },
        team_leader: { en: 'Team Leader', ar: 'قائد فريق' },
        admin: { en: 'Admin', ar: 'مسؤول' },
        accountant: { en: 'Accountant', ar: 'محاسب' },
        client: { en: 'Client', ar: 'عميل' },
    }
    return labels[role]?.[isAr ? 'ar' : 'en'] || role
}
