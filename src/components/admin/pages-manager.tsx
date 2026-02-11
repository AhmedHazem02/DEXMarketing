'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { usePages, useUpdatePage, useDeletePage, useCreatePage } from '@/hooks/use-cms'
import { toast } from 'sonner'
import { Loader2, FileText, Edit, Eye, EyeOff, Save, Trash2, Plus, FileQuestion, GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
import { useLocale } from 'next-intl'
import { MediaUpload } from '@/components/admin/media-upload'
import type { Page, Json } from '@/types/database'

// ─── Constants ───────────────────────────────────────────────

const PREDEFINED_PAGES = [
    { value: 'home', label: 'الرئيسية (Home)' },
    { value: 'about', label: 'من نحن (About Us)' },
    { value: 'services', label: 'الخدمات (Services)' },
    { value: 'portfolio', label: 'أعمالنا (Portfolio)' },
    { value: 'contact', label: 'تواصل معنا (Contact Us)' },
    { value: 'terms', label: 'الشروط والأحكام (Terms)' },
    { value: 'privacy', label: 'سياسة الخصوصية (Privacy)' },
] as const

type SchemaField = { key: string; label: string; type: 'text' | 'textarea' }

/** Pages that use an items-array editor (services, portfolio) */
const ITEMS_PAGES = new Set(['services', 'portfolio'])

/** Item field definitions per page type */
interface ItemFieldDef {
    key: string
    label: string
    type: 'text' | 'textarea' | 'image' | 'video' | 'media'
    bilingual?: boolean // default true for text/textarea
}

const ITEMS_FIELDS: Record<string, ItemFieldDef[]> = {
    services: [
        { key: 'title', label: 'اسم الخدمة (Title)', type: 'text' },
        { key: 'description', label: 'الوصف (Description)', type: 'textarea' },
        { key: 'image', label: 'صورة / أيقونة (Image)', type: 'image', bilingual: false },
    ],
    portfolio: [
        { key: 'title', label: 'اسم المشروع (Title)', type: 'text' },
        { key: 'category', label: 'التصنيف (Category)', type: 'text' },
        { key: 'description', label: 'الوصف (Description)', type: 'textarea' },
        { key: 'media', label: 'صورة / فيديو (Media)', type: 'media', bilingual: false },
        { key: 'link', label: 'رابط المشروع (Link)', type: 'text', bilingual: false },
    ],
}

/** Simple-field schemas (non-items pages) */
const PAGE_SCHEMAS: Record<string, SchemaField[]> = {
    home: [
        { key: 'hero_title', label: 'عنوان الهيرو (Hero Title)', type: 'text' },
        { key: 'hero_subtitle', label: 'وصف الهيرو (Hero Subtitle)', type: 'textarea' },
        { key: 'cta_text', label: 'نص زر الدعوة (CTA Button)', type: 'text' },
    ],
    about: [
        { key: 'mission', label: 'المهمة (Mission)', type: 'textarea' },
        { key: 'vision', label: 'الرؤية (Vision)', type: 'textarea' },
        { key: 'story', label: 'قصتنا (Our Story)', type: 'textarea' },
    ],
    contact: [
        { key: 'email', label: 'البريد الإلكتروني', type: 'text' },
        { key: 'phone', label: 'رقم الهاتف', type: 'text' },
        { key: 'address', label: 'العنوان', type: 'textarea' },
        { key: 'whatsapp', label: 'رقم الواتساب', type: 'text' },
    ],
    terms: [
        { key: 'title', label: 'عنوان الصفحة (Page Title)', type: 'text' },
        { key: 'content', label: 'نص الشروط والأحكام (Content)', type: 'textarea' },
        { key: 'last_updated', label: 'تاريخ آخر تحديث', type: 'text' },
    ],
    privacy: [
        { key: 'title', label: 'عنوان الصفحة (Page Title)', type: 'text' },
        { key: 'content', label: 'نص سياسة الخصوصية (Content)', type: 'textarea' },
        { key: 'last_updated', label: 'تاريخ آخر تحديث', type: 'text' },
    ],
}

// ─── Item Types ──────────────────────────────────────────────

interface ContentItem {
    id: string
    [key: string]: string
}

function generateItemId(): string {
    return Math.random().toString(36).substring(2, 9)
}

function createEmptyItem(fields: ItemFieldDef[]): ContentItem {
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

// ─── Pure Helpers ────────────────────────────────────────────

function toJsonString(value: unknown): string {
    if (typeof value === 'object' && value !== null) {
        try { return JSON.stringify(value, null, 2) } catch { return '' }
    }
    return String(value ?? '')
}

function parseJsonSafe(jsonStr: string): Record<string, unknown> {
    try {
        const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr
        return typeof parsed === 'object' && parsed !== null ? parsed : {}
    } catch {
        return {}
    }
}

function getJsonValue(jsonStr: string, key: string): string {
    const obj = parseJsonSafe(jsonStr)
    return String(obj[key] ?? '')
}

function setJsonValue(jsonStr: string, key: string, newVal: string): string {
    const obj = parseJsonSafe(jsonStr)
    obj[key] = newVal
    return JSON.stringify(obj, null, 2)
}

function tryParseContent(raw: string): { data: Json; error: boolean } {
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

/** Extract items array from content JSON */
function extractItems(contentStr: string): ContentItem[] {
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
function setItemsInContent(contentStr: string, items: ContentItem[]): string {
    const obj = parseJsonSafe(contentStr)
    obj.items = items
    return JSON.stringify(obj, null, 2)
}

// ─── Types ───────────────────────────────────────────────────

interface EditFormData {
    title_en: string
    title_ar: string
    content_en: string
    content_ar: string
    is_published: boolean
}

interface CreateFormData {
    selectedSlug: string
    customSlug: string
    title_en: string
    title_ar: string
}

const INITIAL_CREATE_DATA: CreateFormData = {
    selectedSlug: '',
    customSlug: '',
    title_en: '',
    title_ar: '',
}

// ─── Component ───────────────────────────────────────────────

export function PagesManager() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const { data: pages, isLoading } = usePages()
    const updatePage = useUpdatePage()
    const deletePage = useDeletePage()
    const createPage = useCreatePage()

    // Dialog states
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [deletingPage, setDeletingPage] = useState<Page | null>(null)

    // Current page being edited
    const [editingPage, setEditingPage] = useState<Page | null>(null)

    // Form states
    const [formData, setFormData] = useState<EditFormData>({
        title_en: '',
        title_ar: '',
        content_en: '',
        content_ar: '',
        is_published: true,
    })

    // Items state for services/portfolio
    const [items, setItems] = useState<ContentItem[]>([])

    const [createData, setCreateData] = useState<CreateFormData>(INITIAL_CREATE_DATA)

    // Derived
    const resolvedCreateSlug = createData.selectedSlug === 'custom'
        ? createData.customSlug.trim()
        : createData.selectedSlug

    const isItemsPage = editingPage ? ITEMS_PAGES.has(editingPage.slug) : false
    const itemFields = editingPage ? ITEMS_FIELDS[editingPage.slug] ?? null : null

    const editSchema = useMemo(
        () => (editingPage && !isItemsPage ? PAGE_SCHEMAS[editingPage.slug] ?? null : null),
        [editingPage, isItemsPage]
    )

    // ─── Handlers ────────────────────────────────────────────

    const handleCreate = useCallback(async () => {
        if (!resolvedCreateSlug || !createData.title_en.trim()) {
            toast.error('يرجى ملء الحقول المطلوبة (Slug, Title)')
            return
        }

        const isItemsSlug = ITEMS_PAGES.has(resolvedCreateSlug)
        const initialContent = isItemsSlug ? { items: [] } : {}

        try {
            await createPage.mutateAsync({
                slug: resolvedCreateSlug,
                title_en: createData.title_en.trim(),
                title_ar: createData.title_ar.trim(),
                content_en: initialContent,
                content_ar: initialContent,
                is_published: false,
            })
            toast.success('تم إنشاء الصفحة بنجاح')
            setIsCreateOpen(false)
            setCreateData(INITIAL_CREATE_DATA)
        } catch {
            toast.error('حدث خطأ أثناء الإنشاء، ربما الـ Slug مستخدم بالفعل')
        }
    }, [resolvedCreateSlug, createData, createPage])

    const handleEdit = useCallback((page: Page) => {
        setEditingPage(page)
        const contentEnStr = toJsonString(page.content_en)
        const contentArStr = toJsonString(page.content_ar)

        setFormData({
            title_en: page.title_en || '',
            title_ar: page.title_ar || '',
            content_en: contentEnStr,
            content_ar: contentArStr,
            is_published: page.is_published,
        })

        // Initialize items for items-based pages — merge en + ar into bilingual items
        if (ITEMS_PAGES.has(page.slug)) {
            const enItems = extractItems(contentEnStr)
            const arItems = extractItems(contentArStr)
            const fields = ITEMS_FIELDS[page.slug] || []

            const mergedItems: ContentItem[] = enItems.map((enItem, i) => {
                const arItem = arItems[i] || {}
                const merged: ContentItem = { id: enItem.id || generateItemId() }

                for (const f of fields) {
                    if (f.bilingual === false) {
                        // Non-bilingual (media, link): take from en
                        merged[f.key] = enItem[f.key] || arItem[f.key] || ''
                    } else {
                        // Bilingual: en version → _en, ar version → _ar
                        merged[`${f.key}_en`] = enItem[f.key] || ''
                        merged[`${f.key}_ar`] = arItem[f.key] || ''
                    }
                }
                return merged
            })

            // Also include any extra ar items not matched with en
            if (arItems.length > enItems.length) {
                for (let i = enItems.length; i < arItems.length; i++) {
                    const arItem = arItems[i]
                    const merged: ContentItem = { id: arItem.id || generateItemId() }
                    for (const f of fields) {
                        if (f.bilingual === false) {
                            merged[f.key] = arItem[f.key] || ''
                        } else {
                            merged[`${f.key}_en`] = ''
                            merged[`${f.key}_ar`] = arItem[f.key] || ''
                        }
                    }
                    mergedItems.push(merged)
                }
            }

            setItems(mergedItems)
        }

        setIsEditOpen(true)
    }, [])

    const handleSave = useCallback(async () => {
        if (!editingPage) return

        if (!formData.title_en.trim() && !formData.title_ar.trim()) {
            toast.error('يجب إدخال عنوان واحد على الأقل')
            return
        }

        let finalContentEn: Json
        let finalContentAr: Json

        if (ITEMS_PAGES.has(editingPage.slug)) {
            // For items pages: build en/ar content from items
            const enItems = items.map(item => {
                const enItem: Record<string, string> = {}
                const fields = ITEMS_FIELDS[editingPage.slug] || []
                for (const f of fields) {
                    if (f.bilingual === false) {
                        enItem[f.key] = item[f.key] || ''
                    } else {
                        enItem[f.key] = item[`${f.key}_en`] || ''
                    }
                }
                enItem.id = item.id
                return enItem
            })

            const arItems = items.map(item => {
                const arItem: Record<string, string> = {}
                const fields = ITEMS_FIELDS[editingPage.slug] || []
                for (const f of fields) {
                    if (f.bilingual === false) {
                        arItem[f.key] = item[f.key] || ''
                    } else {
                        arItem[f.key] = item[`${f.key}_ar`] || ''
                    }
                }
                arItem.id = item.id
                return arItem
            })

            finalContentEn = { items: enItems }
            finalContentAr = { items: arItems }
        } else {
            const enResult = tryParseContent(formData.content_en)
            if (enResult.error) {
                toast.error('خطأ في تنسيق JSON (المحتوى الإنجليزي)')
                return
            }
            const arResult = tryParseContent(formData.content_ar)
            if (arResult.error) {
                toast.error('خطأ في تنسيق JSON (المحتوى العربي)')
                return
            }
            finalContentEn = enResult.data
            finalContentAr = arResult.data
        }

        try {
            await updatePage.mutateAsync({
                id: editingPage.id,
                title_en: formData.title_en.trim(),
                title_ar: formData.title_ar.trim(),
                content_en: finalContentEn,
                content_ar: finalContentAr,
                is_published: formData.is_published,
            })
            toast.success('تم حفظ الصفحة بنجاح')
            setIsEditOpen(false)
            setEditingPage(null)
            setItems([])
        } catch {
            toast.error('حدث خطأ أثناء الحفظ')
        }
    }, [editingPage, formData, items, updatePage])

    const handleConfirmDelete = useCallback(async () => {
        if (!deletingPage) return
        try {
            await deletePage.mutateAsync(deletingPage.id)
            toast.success('تم حذف الصفحة بنجاح')
        } catch {
            toast.error('حدث خطأ أثناء الحذف')
        } finally {
            setDeletingPage(null)
        }
    }, [deletingPage, deletePage])

    const handleTogglePublish = useCallback(async (page: Page) => {
        try {
            await updatePage.mutateAsync({
                id: page.id,
                is_published: !page.is_published,
            })
            toast.success(page.is_published ? 'تم إخفاء الصفحة' : 'تم نشر الصفحة')
        } catch {
            toast.error('حدث خطأ')
        }
    }, [updatePage])

    const handleEditDialogClose = useCallback((open: boolean) => {
        setIsEditOpen(open)
        if (!open) {
            setEditingPage(null)
            setItems([])
        }
    }, [])

    const handleCreateSlugChange = useCallback((val: string) => {
        const selected = PREDEFINED_PAGES.find(p => p.value === val)
        setCreateData(prev => ({
            ...prev,
            selectedSlug: val,
            customSlug: '',
            title_en: !prev.title_en && selected
                ? (selected.label.split(' (')[1]?.replace(')', '') || val)
                : prev.title_en,
            title_ar: !prev.title_ar && selected
                ? (selected.label.split(' (')[0] || val)
                : prev.title_ar,
        }))
    }, [])

    const updateContentField = useCallback((key: string, value: string, isEn: boolean) => {
        setFormData(prev => ({
            ...prev,
            [isEn ? 'content_en' : 'content_ar']: setJsonValue(
                isEn ? prev.content_en : prev.content_ar,
                key,
                value
            ),
        }))
    }, [])

    // ─── Items Handlers ──────────────────────────────────────

    const addItem = useCallback(() => {
        if (!editingPage || !itemFields) return
        setItems(prev => [...prev, createEmptyItem(itemFields)])
    }, [editingPage, itemFields])

    const removeItem = useCallback((id: string) => {
        setItems(prev => prev.filter(item => item.id !== id))
    }, [])

    const updateItem = useCallback((id: string, key: string, value: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, [key]: value } : item
        ))
    }, [])

    const moveItem = useCallback((index: number, direction: 'up' | 'down') => {
        setItems(prev => {
            const arr = [...prev]
            const newIndex = direction === 'up' ? index - 1 : index + 1
            if (newIndex < 0 || newIndex >= arr.length) return prev
            ;[arr[index], arr[newIndex]] = [arr[newIndex], arr[index]]
            return arr
        })
    }, [])

    // ─── Loading State ───────────────────────────────────────

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        )
    }

    // ─── Render ──────────────────────────────────────────────

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            إدارة الصفحات
                        </CardTitle>
                        <CardDescription>
                            تعديل محتوى صفحات الموقع العامة
                        </CardDescription>
                    </div>

                    {/* ── Create Dialog Trigger ── */}
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 me-2" />
                                إضافة صفحة
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>إضافة صفحة جديدة</DialogTitle>
                                <DialogDescription>
                                    اختر صفحة من الصفحات المعروفة في النظام لإضافتها
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>الصفحة (Slug)</Label>
                                    <Select
                                        value={createData.selectedSlug}
                                        onValueChange={handleCreateSlugChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر صفحة..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PREDEFINED_PAGES.map((p) => (
                                                <SelectItem key={p.value} value={p.value}>
                                                    {p.label}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="custom">صفحة مخصصة (Custom)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {createData.selectedSlug === 'custom' && (
                                    <div className="space-y-2">
                                        <Label>معرف الصفحة (Custom Slug)</Label>
                                        <Input
                                            value={createData.customSlug}
                                            onChange={(e) => setCreateData(prev => ({
                                                ...prev,
                                                customSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                                            }))}
                                            placeholder="e.g. landing-page-2"
                                            dir="ltr"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>العنوان (English)</Label>
                                    <Input
                                        value={createData.title_en}
                                        onChange={(e) => setCreateData(prev => ({ ...prev, title_en: e.target.value }))}
                                        dir="ltr"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>العنوان (عربي)</Label>
                                    <Input
                                        value={createData.title_ar}
                                        onChange={(e) => setCreateData(prev => ({ ...prev, title_ar: e.target.value }))}
                                        dir="rtl"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={handleCreate}
                                    disabled={createPage.isPending || !resolvedCreateSlug}
                                >
                                    {createPage.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                                    إنشاء
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>

                <CardContent>
                    {/* ── Empty State ── */}
                    {(!pages || pages.length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground gap-3">
                            <FileQuestion className="h-12 w-12 opacity-40" />
                            <p className="text-lg font-medium">لا توجد صفحات حتى الآن</p>
                            <p className="text-sm">اضغط على &quot;إضافة صفحة&quot; لإنشاء أول صفحة</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pages.map((page) => (
                                <div
                                    key={page.id}
                                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border bg-card gap-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium">
                                                {page.title_ar || page.title_en || page.slug}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">/{page.slug}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Badge variant={page.is_published ? 'default' : 'secondary'}>
                                            {page.is_published ? 'منشور' : 'مخفي'}
                                        </Badge>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleTogglePublish(page)}
                                            title={page.is_published ? 'إخفاء' : 'نشر'}
                                        >
                                            {page.is_published ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeletingPage(page)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            title="حذف"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(page)}
                                        >
                                            <Edit className="h-4 w-4 me-2" />
                                            تعديل
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Single Edit Dialog (outside the loop) ── */}
            <Dialog open={isEditOpen} onOpenChange={handleEditDialogClose}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    {editingPage && (
                        <>
                            <DialogHeader>
                                <DialogTitle>تعديل صفحة: {editingPage.slug}</DialogTitle>
                                <DialogDescription>
                                    تعديل محتوى الصفحة باللغتين العربية والإنجليزية
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>العنوان (إنجليزي)</Label>
                                        <Input
                                            value={formData.title_en}
                                            onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
                                            dir="ltr"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>العنوان (عربي)</Label>
                                        <Input
                                            value={formData.title_ar}
                                            onChange={(e) => setFormData(prev => ({ ...prev, title_ar: e.target.value }))}
                                            dir="rtl"
                                        />
                                    </div>
                                </div>

                                {/* ── Items Editor (Services / Portfolio) ── */}
                                {isItemsPage && itemFields ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="bg-primary/10 text-primary border-0">
                                                {editingPage.slug === 'services'
                                                    ? (isAr ? 'إدارة الخدمات' : 'Manage Services')
                                                    : (isAr ? 'إدارة الأعمال' : 'Manage Projects')}
                                            </Badge>
                                            <Button type="button" size="sm" variant="outline" onClick={addItem}>
                                                <Plus className="h-4 w-4 me-1" />
                                                {isAr ? 'إضافة عنصر' : 'Add Item'}
                                            </Button>
                                        </div>

                                        {items.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                                                <FileQuestion className="h-10 w-10 mx-auto mb-2 opacity-40" />
                                                <p>{isAr ? 'لا توجد عناصر بعد' : 'No items yet'}</p>
                                                <p className="text-xs mt-1">{isAr ? 'اضغط "إضافة عنصر" للبدء' : 'Click "Add Item" to start'}</p>
                                            </div>
                                        )}

                                        {items.map((item, index) => (
                                            <ItemEditor
                                                key={item.id}
                                                item={item}
                                                index={index}
                                                total={items.length}
                                                fields={itemFields}
                                                slug={editingPage.slug}
                                                onUpdate={updateItem}
                                                onRemove={removeItem}
                                                onMove={moveItem}
                                            />
                                        ))}
                                    </div>

                                ) : editSchema ? (
                                    /* ── Simple Fields (Visual Editor) ── */
                                    <div className="space-y-6 border rounded-xl p-4 bg-muted/20">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Badge variant="outline" className="bg-primary/10 text-primary border-0">
                                                {isAr ? 'محرر الحقول المخصص' : 'Visual Editor'}
                                            </Badge>
                                        </div>

                                        {editSchema.map((field) => (
                                            <SchemaFieldEditor
                                                key={field.key}
                                                field={field}
                                                contentEn={formData.content_en}
                                                contentAr={formData.content_ar}
                                                onContentChange={updateContentField}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    /* ── Fallback: JSON Editor ── */
                                    <>
                                        <div className="space-y-2">
                                            <Label>المحتوى (إنجليزي - JSON)</Label>
                                            <Textarea
                                                value={formData.content_en}
                                                onChange={(e) => setFormData(prev => ({ ...prev, content_en: e.target.value }))}
                                                rows={6}
                                                dir="ltr"
                                                className="font-mono text-xs"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>المحتوى (عربي - JSON)</Label>
                                            <Textarea
                                                value={formData.content_ar}
                                                onChange={(e) => setFormData(prev => ({ ...prev, content_ar: e.target.value }))}
                                                rows={6}
                                                dir="rtl"
                                                className="font-mono text-xs"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="flex items-center gap-2 pt-4 border-t">
                                    <Switch
                                        checked={formData.is_published}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                                    />
                                    <Label>حالة النشر (Published)</Label>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button onClick={handleSave} disabled={updatePage.isPending}>
                                    {updatePage.isPending ? (
                                        <Loader2 className="h-4 w-4 me-2 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4 me-2" />
                                    )}
                                    حفظ التغييرات
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation (AlertDialog) ── */}
            <AlertDialog open={!!deletingPage} onOpenChange={(open) => !open && setDeletingPage(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد من حذف هذه الصفحة؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم حذف صفحة &quot;{deletingPage?.title_ar || deletingPage?.slug}&quot; نهائياً. لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deletePage.isPending}
                        >
                            {deletePage.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                            حذف نهائي
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

// ─── Extracted Sub-Component (avoids re-defining getVal/setVal per render) ───

interface SchemaFieldEditorProps {
    field: SchemaField
    contentEn: string
    contentAr: string
    onContentChange: (key: string, value: string, isEn: boolean) => void
}

function SchemaFieldEditor({ field, contentEn, contentAr, onContentChange }: SchemaFieldEditorProps) {
    const enValue = getJsonValue(contentEn, field.key)
    const arValue = getJsonValue(contentAr, field.key)

    const FieldComponent = field.type === 'textarea' ? Textarea : Input

    return (
        <div className="space-y-3 p-3 border rounded-lg bg-background">
            <Label className="text-base font-semibold text-primary">{field.label}</Label>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">English</Label>
                    <FieldComponent
                        className="bg-muted/30"
                        value={enValue}
                        onChange={(e) => onContentChange(field.key, e.target.value, true)}
                        dir="ltr"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">العربية</Label>
                    <FieldComponent
                        className="bg-muted/30"
                        value={arValue}
                        onChange={(e) => onContentChange(field.key, e.target.value, false)}
                        dir="rtl"
                    />
                </div>
            </div>
        </div>
    )
}

// ─── Item Editor (Services / Portfolio items) ────────────────

interface ItemEditorProps {
    item: ContentItem
    index: number
    total: number
    fields: ItemFieldDef[]
    slug: string
    onUpdate: (id: string, key: string, value: string) => void
    onRemove: (id: string) => void
    onMove: (index: number, direction: 'up' | 'down') => void
}

function ItemEditor({ item, index, total, fields, slug, onUpdate, onRemove, onMove }: ItemEditorProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'

    return (
        <div className="border rounded-xl p-4 bg-background space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-muted-foreground">
                        #{index + 1}
                    </span>
                    {item.title_en || item.title_ar ? (
                        <span className="text-sm font-medium truncate max-w-[200px]">
                            — {item.title_ar || item.title_en}
                        </span>
                    ) : null}
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === 0}
                        onClick={() => onMove(index, 'up')}
                    >
                        <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === total - 1}
                        onClick={() => onMove(index, 'down')}
                    >
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => onRemove(item.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Fields */}
            {fields.map((field) => {
                const isBilingual = field.bilingual !== false
                const isMedia = field.type === 'image' || field.type === 'video' || field.type === 'media'

                if (isMedia) {
                    return (
                        <div key={field.key} className="space-y-2">
                            <Label className="text-sm font-medium">{field.label}</Label>
                            <MediaUpload
                                value={item[field.key] || ''}
                                onChange={(url) => onUpdate(item.id, field.key, url)}
                                folder={`dex-erp/cms/${slug}`}
                                accept={field.type === 'image' ? 'image' : field.type === 'video' ? 'video' : 'both'}
                            />
                        </div>
                    )
                }

                if (!isBilingual) {
                    return (
                        <div key={field.key} className="space-y-2">
                            <Label className="text-sm font-medium">{field.label}</Label>
                            {field.type === 'textarea' ? (
                                <Textarea
                                    className="bg-muted/30"
                                    value={item[field.key] || ''}
                                    onChange={(e) => onUpdate(item.id, field.key, e.target.value)}
                                    dir="ltr"
                                />
                            ) : (
                                <Input
                                    className="bg-muted/30"
                                    value={item[field.key] || ''}
                                    onChange={(e) => onUpdate(item.id, field.key, e.target.value)}
                                    dir="ltr"
                                />
                            )}
                        </div>
                    )
                }

                // Bilingual text/textarea
                const FieldComponent = field.type === 'textarea' ? Textarea : Input
                return (
                    <div key={field.key} className="space-y-2">
                        <Label className="text-sm font-medium">{field.label}</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">English</Label>
                                <FieldComponent
                                    className="bg-muted/30"
                                    value={item[`${field.key}_en`] || ''}
                                    onChange={(e) => onUpdate(item.id, `${field.key}_en`, e.target.value)}
                                    dir="ltr"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">العربية</Label>
                                <FieldComponent
                                    className="bg-muted/30"
                                    value={item[`${field.key}_ar`] || ''}
                                    onChange={(e) => onUpdate(item.id, `${field.key}_ar`, e.target.value)}
                                    dir="rtl"
                                />
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
