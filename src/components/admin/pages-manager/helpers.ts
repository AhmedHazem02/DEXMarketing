import type { Json } from '@/types/database'
import type { ContentItem, ItemFieldDef } from './types'

// ─── ID Generation ───────────────────────────────────────────

export function generateItemId(): string {
    return crypto.randomUUID()
}

export function createEmptyItem(fields: ItemFieldDef[]): ContentItem {
    const item: ContentItem = { id: generateItemId() }
    for (const f of fields) {
        if (f.bilingual === false) {
            item[f.key] = ''
        } else {
            item[`${f.key}_en`] = ''
            item[`${f.key}_ar`] = ''
        }
    }
    return item
}

// ─── JSON Helpers ────────────────────────────────────────────

export function toJsonString(value: unknown): string {
    if (typeof value === 'object' && value !== null) {
        try { return JSON.stringify(value, null, 2) } catch { return '' }
    }
    return String(value ?? '')
}

export function parseJsonSafe(jsonStr: string): Record<string, unknown> {
    try {
        const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr
        return typeof parsed === 'object' && parsed !== null ? parsed : {}
    } catch {
        return {}
    }
}

export function getJsonValue(jsonStr: string, key: string): string {
    const obj = parseJsonSafe(jsonStr)
    return String(obj[key] ?? '')
}

export function setJsonValue(jsonStr: string, key: string, newVal: string): string {
    const obj = parseJsonSafe(jsonStr)
    obj[key] = newVal
    return JSON.stringify(obj, null, 2)
}

export function tryParseContent(raw: string): { data: Json; error: boolean } {
    const trimmed = raw.trim()
    if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) {
        return { data: raw, error: false }
    }
    try {
        return { data: JSON.parse(trimmed), error: false }
    } catch {
        return { data: null, error: true }
    }
}

// ─── Items Helpers ───────────────────────────────────────────

/** Extract items array from content JSON */
export function extractItems(contentStr: string): ContentItem[] {
    const obj = parseJsonSafe(contentStr)
    const items = obj.items
    if (Array.isArray(items)) {
        return items.map(item => ({
            ...item,
            id: item.id || generateItemId(),
        }))
    }
    return []
}

/** Set items back into content JSON (preserving top-level fields) */
export function setItemsInContent(contentStr: string, items: ContentItem[]): string {
    const obj = parseJsonSafe(contentStr)
    obj.items = items
    return JSON.stringify(obj, null, 2)
}
