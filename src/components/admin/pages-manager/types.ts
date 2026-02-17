import type { Json } from '@/types/database'

// ─── Schema & Field Types ────────────────────────────────────

export type SchemaField = {
    key: string
    label: string
    type: 'text' | 'textarea'
}

export interface ItemFieldDef {
    key: string
    label: string
    type: 'text' | 'textarea' | 'image' | 'video' | 'media'
    /** default true for text/textarea */
    bilingual?: boolean
}

// ─── Content Item ────────────────────────────────────────────

export interface ContentItem {
    id: string
    [key: string]: string
}

// ─── Form Data ───────────────────────────────────────────────

export interface EditFormData {
    title_en: string
    title_ar: string
    content_en: string
    content_ar: string
    is_published: boolean
}

export interface CreateFormData {
    selectedSlug: string
    customSlug: string
    title_en: string
    title_ar: string
}
