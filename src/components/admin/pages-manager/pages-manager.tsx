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
import { Loader2, FileText, Edit, Eye, EyeOff, Save, Trash2, Plus, FileQuestion } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { Page, Json } from '@/types/database'

import type { ContentItem, EditFormData, CreateFormData } from './types'
import {
    PREDEFINED_PAGES,
    ITEMS_PAGES,
    ITEMS_FIELDS,
    PAGE_SCHEMAS,
    INITIAL_CREATE_DATA,
} from './constants'
import {
    generateItemId,
    createEmptyItem,
    toJsonString,
    setJsonValue,
    tryParseContent,
    extractItems,
} from './helpers'
import { SchemaFieldEditor } from './schema-field-editor'
import { ItemEditor } from './item-editor'

// ─── Component ───────────────────────────────────────────────

export function PagesManager() {
    const locale = useLocale()
    const t = useTranslations('pagesManager')
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
            toast.error(t('requiredFields'))
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
            toast.success(t('createSuccess'))
            setIsCreateOpen(false)
            setCreateData(INITIAL_CREATE_DATA)
        } catch {
            toast.error(t('createError'))
        }
    }, [resolvedCreateSlug, createData, createPage, t])

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

        // Initialize items for items-based pages
        if (ITEMS_PAGES.has(page.slug)) {
            const enItems = extractItems(contentEnStr)
            const arItems = extractItems(contentArStr)
            const fields = ITEMS_FIELDS[page.slug] || []

            const mergedItems: ContentItem[] = enItems.map((enItem, i) => {
                const arItem = arItems[i] || {}
                const merged: ContentItem = { id: enItem.id || generateItemId() }
                for (const f of fields) {
                    if (f.bilingual === false) {
                        merged[f.key] = enItem[f.key] || arItem[f.key] || ''
                    } else {
                        merged[`${f.key}_en`] = enItem[f.key] || ''
                        merged[`${f.key}_ar`] = arItem[f.key] || ''
                    }
                }
                return merged
            })

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
            toast.error(t('titleRequired'))
            return
        }

        let finalContentEn: Json
        let finalContentAr: Json

        if (ITEMS_PAGES.has(editingPage.slug)) {
            const fields = ITEMS_FIELDS[editingPage.slug] || []
            const enItems = items.map(item => {
                const enItem: Record<string, string> = {}
                for (const f of fields) {
                    enItem[f.key] = f.bilingual === false ? (item[f.key] || '') : (item[`${f.key}_en`] || '')
                }
                enItem.id = item.id
                return enItem
            })
            const arItems = items.map(item => {
                const arItem: Record<string, string> = {}
                for (const f of fields) {
                    arItem[f.key] = f.bilingual === false ? (item[f.key] || '') : (item[`${f.key}_ar`] || '')
                }
                arItem.id = item.id
                return arItem
            })
            finalContentEn = { items: enItems }
            finalContentAr = { items: arItems }
        } else {
            const enResult = tryParseContent(formData.content_en)
            if (enResult.error) { toast.error(t('jsonErrorEn')); return }
            const arResult = tryParseContent(formData.content_ar)
            if (arResult.error) { toast.error(t('jsonErrorAr')); return }
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
            toast.success(t('saveSuccess'))
            setIsEditOpen(false)
            setEditingPage(null)
            setItems([])
        } catch {
            toast.error(t('saveError'))
        }
    }, [editingPage, formData, items, updatePage, t])

    const handleConfirmDelete = useCallback(async () => {
        if (!deletingPage) return
        try {
            await deletePage.mutateAsync(deletingPage.id)
            toast.success(t('deleteSuccess'))
        } catch {
            toast.error(t('deleteError'))
        } finally {
            setDeletingPage(null)
        }
    }, [deletingPage, deletePage, t])

    const handleTogglePublish = useCallback(async (page: Page) => {
        try {
            await updatePage.mutateAsync({
                id: page.id,
                is_published: !page.is_published,
            })
            toast.success(page.is_published ? t('hideSuccess') : t('publishSuccess'))
        } catch {
            toast.error(t('toggleError'))
        }
    }, [updatePage, t])

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
                            {t('title')}
                        </CardTitle>
                        <CardDescription>
                            {t('description')}
                        </CardDescription>
                    </div>

                    {/* ── Create Dialog Trigger ── */}
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 me-2" />
                                {t('addPage')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t('addPageTitle')}</DialogTitle>
                                <DialogDescription>
                                    {t('addPageDesc')}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>{t('pageSlug')}</Label>
                                    <Select
                                        value={createData.selectedSlug}
                                        onValueChange={handleCreateSlugChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('selectPage')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PREDEFINED_PAGES.map((p) => (
                                                <SelectItem key={p.value} value={p.value}>
                                                    {p.label}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="custom">{t('customPage')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {createData.selectedSlug === 'custom' && (
                                    <div className="space-y-2">
                                        <Label>{t('customSlug')}</Label>
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
                                    <Label>{t('titleEn')}</Label>
                                    <Input
                                        value={createData.title_en}
                                        onChange={(e) => setCreateData(prev => ({ ...prev, title_en: e.target.value }))}
                                        dir="ltr"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('titleAr')}</Label>
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
                                    {t('create')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>

                <CardContent>
                    {(!pages || pages.length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground gap-3">
                            <FileQuestion className="h-12 w-12 opacity-40" />
                            <p className="text-lg font-medium">{t('noPagesYet')}</p>
                            <p className="text-sm">{t('noPagesDesc')}</p>
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
                                            {page.is_published ? t('published') : t('hidden')}
                                        </Badge>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleTogglePublish(page)}
                                            title={page.is_published ? t('hide') : t('publish')}
                                        >
                                            {page.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeletingPage(page)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            title={t('delete')}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>

                                        <Button variant="outline" size="sm" onClick={() => handleEdit(page)}>
                                            <Edit className="h-4 w-4 me-2" />
                                            {t('edit')}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Edit Dialog ── */}
            <Dialog open={isEditOpen} onOpenChange={handleEditDialogClose}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    {editingPage && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{t('editPageTitle', { slug: editingPage.slug })}</DialogTitle>
                                <DialogDescription>{t('editPageDesc')}</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t('titleEnLabel')}</Label>
                                        <Input
                                            value={formData.title_en}
                                            onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
                                            dir="ltr"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('titleArLabel')}</Label>
                                        <Input
                                            value={formData.title_ar}
                                            onChange={(e) => setFormData(prev => ({ ...prev, title_ar: e.target.value }))}
                                            dir="rtl"
                                        />
                                    </div>
                                </div>

                                {/* Items Editor (Services / Portfolio) */}
                                {isItemsPage && itemFields ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="bg-primary/10 text-primary border-0">
                                                {editingPage.slug === 'services' ? t('manageServices') : t('manageProjects')}
                                            </Badge>
                                            <Button type="button" size="sm" variant="outline" onClick={addItem}>
                                                <Plus className="h-4 w-4 me-1" />
                                                {t('addItem')}
                                            </Button>
                                        </div>

                                        {items.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                                                <FileQuestion className="h-10 w-10 mx-auto mb-2 opacity-40" />
                                                <p>{t('noItemsYet')}</p>
                                                <p className="text-xs mt-1">{t('noItemsDesc')}</p>
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
                                    <div className="space-y-6 border rounded-xl p-4 bg-muted/20">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Badge variant="outline" className="bg-primary/10 text-primary border-0">
                                                {t('visualEditor')}
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
                                    <>
                                        <div className="space-y-2">
                                            <Label>{t('contentEnJson')}</Label>
                                            <Textarea
                                                value={formData.content_en}
                                                onChange={(e) => setFormData(prev => ({ ...prev, content_en: e.target.value }))}
                                                rows={6}
                                                dir="ltr"
                                                className="font-mono text-xs"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('contentArJson')}</Label>
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
                                    <Label>{t('publishStatus')}</Label>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button onClick={handleSave} disabled={updatePage.isPending}>
                                    {updatePage.isPending ? (
                                        <Loader2 className="h-4 w-4 me-2 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4 me-2" />
                                    )}
                                    {t('saveChanges')}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation ── */}
            <AlertDialog open={!!deletingPage} onOpenChange={(open) => !open && setDeletingPage(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('confirmDeleteDesc', { page: deletingPage?.title_ar || deletingPage?.slug || '' })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deletePage.isPending}
                        >
                            {deletePage.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                            {t('deletePermanent')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
