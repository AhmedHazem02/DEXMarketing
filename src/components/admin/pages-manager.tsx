'use client'

import { useState } from 'react'
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { usePages, useUpdatePage, useDeletePage, useCreatePage } from '@/hooks/use-cms'
import { toast } from 'sonner'
import { Loader2, FileText, Edit, Eye, EyeOff, Save, Trash2, Plus } from 'lucide-react'
import { useLocale } from 'next-intl'
import type { Page } from '@/types/database'

// Predefined Pages for Dropdown
const PREDEFINED_PAGES = [
    { value: 'home', label: 'الرئيسية (Home)' },
    { value: 'about', label: 'من نحن (About Us)' },
    { value: 'services', label: 'الخدمات (Services)' },
    { value: 'portfolio', label: 'أعمالنا (Portfolio)' },
    { value: 'contact', label: 'تواصل معنا (Contact Us)' },
    { value: 'terms', label: 'الشروط والأحكام (Terms)' },
    { value: 'privacy', label: 'سياسة الخصوصية (Privacy)' },
]

// Schema Definitions
const PAGE_SCHEMAS: Record<string, { key: string; label: string; type: 'text' | 'textarea' }[]> = {
    'home': [
        { key: 'hero_title', label: 'عنوان الهيرو (Hero Title)', type: 'text' },
        { key: 'hero_subtitle', label: 'وصف الهيرو (Hero Subtitle)', type: 'textarea' },
        { key: 'cta_text', label: 'نص زر الدعوة (CTA Button)', type: 'text' },
    ],
    'about': [
        { key: 'mission', label: 'المهمة (Mission)', type: 'textarea' },
        { key: 'vision', label: 'الرؤية (Vision)', type: 'textarea' },
        { key: 'story', label: 'قصتنا (Our Story)', type: 'textarea' },
    ],
    'contact': [
        { key: 'email', label: 'البريد الإلكتروني', type: 'text' },
        { key: 'phone', label: 'رقم الهاتف', type: 'text' },
        { key: 'address', label: 'العنوان', type: 'textarea' },
        { key: 'whatsapp', label: 'رقم الواتساب', type: 'text' },
    ],
    'services': [
        { key: 'title', label: 'عنوان القسم', type: 'text' },
        { key: 'description', label: 'وصف القسم', type: 'textarea' },
    ],
    'terms': [
        { key: 'title', label: 'عنوان الصفحة (Page Title)', type: 'text' },
        { key: 'content', label: 'نص الشروط والأحكام (Content)', type: 'textarea' },
        { key: 'last_updated', label: 'تاريخ آخر تحديث', type: 'text' },
    ],
    'privacy': [
        { key: 'title', label: 'عنوان الصفحة (Page Title)', type: 'text' },
        { key: 'content', label: 'نص سياسة الخصوصية (Content)', type: 'textarea' },
        { key: 'last_updated', label: 'تاريخ آخر تحديث', type: 'text' },
    ]
}

const getPageSchema = (slug: string) => {
    // Return schema if exact match, or try to match start (e.g. services-1) if needed
    return PAGE_SCHEMAS[slug] || null
}

export function PagesManager() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const { data: pages, isLoading } = usePages()
    const updatePage = useUpdatePage()
    const deletePage = useDeletePage()
    const createPage = useCreatePage()

    const [editingPage, setEditingPage] = useState<Page | null>(null)
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    // Edit Form State
    const [formData, setFormData] = useState({
        title_en: '',
        title_ar: '',
        content_en: '',
        content_ar: '',
        is_published: true,
    })

    // Create Form State
    const [createData, setCreateData] = useState({
        slug: '',
        title_en: '',
        title_ar: '',
    })

    const handleCreate = async () => {
        if (!createData.slug || !createData.title_en) {
            toast.error('يرجى ملء الحقول المطلوبة (Slug, Title)')
            return
        }

        try {
            await createPage.mutateAsync({
                slug: createData.slug,
                title_en: createData.title_en,
                title_ar: createData.title_ar,
                content_en: {},
                content_ar: {},
                is_published: false
            })
            toast.success('تم إنشاء الصفحة بنجاح')
            setIsCreateOpen(false)
            setCreateData({ slug: '', title_en: '', title_ar: '' })
        } catch (error) {
            toast.error('حدث خطأ أثناء الإنشاء، ربما الـ Slug مستخدم بالفعل')
        }
    }

    const handleEdit = (page: Page) => {
        setEditingPage(page)

        let contentEn = ''
        let contentAr = ''

        try {
            contentEn = typeof page.content_en === 'object' && page.content_en !== null
                ? JSON.stringify(page.content_en, null, 2)
                : String(page.content_en ?? '')
        } catch (e) { contentEn = '' }

        try {
            contentAr = typeof page.content_ar === 'object' && page.content_ar !== null
                ? JSON.stringify(page.content_ar, null, 2)
                : String(page.content_ar ?? '')
        } catch (e) { contentAr = '' }

        setFormData({
            title_en: page.title_en || '',
            title_ar: page.title_ar || '',
            content_en: contentEn,
            content_ar: contentAr,
            is_published: page.is_published,
        })
    }

    const handleSave = async () => {
        if (!editingPage) return

        let finalContentEn: any = formData.content_en
        let finalContentAr: any = formData.content_ar

        // Try to parse JSON if it looks like JSON
        try {
            if (formData.content_en.trim().startsWith('{') || formData.content_en.trim().startsWith('[')) {
                finalContentEn = JSON.parse(formData.content_en)
            }
        } catch (e) {
            toast.error('خطأ في تنسيق JSON (المحتوى الإنجليزي)')
            return
        }

        try {
            if (formData.content_ar.trim().startsWith('{') || formData.content_ar.trim().startsWith('[')) {
                finalContentAr = JSON.parse(formData.content_ar)
            }
        } catch (e) {
            toast.error('خطأ في تنسيق JSON (المحتوى العربي)')
            return
        }

        try {
            await updatePage.mutateAsync({
                id: editingPage.id,
                title_en: formData.title_en,
                title_ar: formData.title_ar,
                content_en: finalContentEn,
                content_ar: finalContentAr,
                is_published: formData.is_published,
            })
            toast.success('تم حفظ الصفحة بنجاح')
            setEditingPage(null)
        } catch (error) {
            toast.error('حدث خطأ أثناء الحفظ')
        }
    }

    const handleDelete = async (page: Page) => {
        if (confirm('هل أنت متأكد من حذف هذه الصفحة؟ لا يمكن استرجاعها.')) {
            try {
                await deletePage.mutateAsync(page.id)
                toast.success('تم حذف الصفحة بنجاح')
            } catch (error) {
                toast.error('حدث خطأ أثناء الحذف')
            }
        }
    }

    const handleTogglePublish = async (page: Page) => {
        try {
            await updatePage.mutateAsync({
                id: page.id,
                is_published: !page.is_published,
            })
            toast.success(page.is_published ? 'تم إخفاء الصفحة' : 'تم نشر الصفحة')
        } catch (error) {
            toast.error('حدث خطأ')
        }
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        )
    }

    return (
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
                                    value={createData.slug}
                                    onValueChange={(val) => {
                                        const selected = PREDEFINED_PAGES.find(p => p.value === val)
                                        setCreateData(prev => ({
                                            ...prev,
                                            slug: val,
                                            // Auto-fill title based on selection if empty
                                            title_en: !prev.title_en ? (selected?.label.split(' (')[1]?.replace(')', '') || val) : prev.title_en,
                                            title_ar: !prev.title_ar ? (selected?.label.split(' (')[0] || val) : prev.title_ar
                                        }))
                                    }}
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

                            {createData.slug === 'custom' && (
                                <div className="space-y-2">
                                    <Label>معرف الصفحة (Custom Slug)</Label>
                                    <Input
                                        value={createData.slug === 'custom' ? '' : createData.slug} // This logic is tricky, better use separate state for custom slug or handle text input if select is custom
                                        onChange={(e) => setCreateData(prev => ({ ...prev, slug: e.target.value }))}
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
                            <Button onClick={handleCreate} disabled={createPage.isPending}>
                                {createPage.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                                إنشاء
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {pages?.map((page) => (
                        <div
                            key={page.id}
                            className="flex items-center justify-between p-4 rounded-lg border bg-card"
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
                                    onClick={() => handleDelete(page)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    title="حذف"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>

                                <Dialog onOpenChange={(open) => !open && setEditingPage(null)}>
                                    <DialogTrigger asChild>

                                        <Button variant="outline" size="sm" onClick={() => handleEdit(page)}>
                                            <Edit className="h-4 w-4 me-2" />
                                            تعديل
                                        </Button>
                                    </DialogTrigger>
                                    {editingPage?.id === page.id && ( /* Only render content if editing THIS page */
                                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>تعديل صفحة: {page.slug}</DialogTitle>
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

                                                {/* Dynamic Fields Generator */}
                                                {getPageSchema(page.slug) ? (
                                                    <div className="space-y-6 border rounded-xl p-4 bg-muted/20">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <Badge variant="outline" className="bg-primary/10 text-primary border-0">
                                                                {isAr ? 'محرر الحقول المخصص' : 'Visual Editor'}
                                                            </Badge>
                                                        </div>

                                                        {getPageSchema(page.slug).map((field) => {
                                                            // Helper to get nested value safely
                                                            const getVal = (jsonStr: string | any, key: string) => {
                                                                try {
                                                                    const obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr
                                                                    return obj?.[key] || ''
                                                                } catch { return '' }
                                                            }

                                                            // Helper to set value in JSON string
                                                            const setVal = (currentJsonStr: string | any, key: string, newVal: string, isEn: boolean) => {
                                                                try {
                                                                    const obj = typeof currentJsonStr === 'string'
                                                                        ? (JSON.parse(currentJsonStr) || {})
                                                                        : (currentJsonStr || {})

                                                                    obj[key] = newVal

                                                                    const newJsonStr = JSON.stringify(obj, null, 2)

                                                                    if (isEn) {
                                                                        setFormData(prev => ({ ...prev, content_en: newJsonStr }))
                                                                    } else {
                                                                        setFormData(prev => ({ ...prev, content_ar: newJsonStr }))
                                                                    }
                                                                } catch (e) {
                                                                    // On error (e.g. empty string), init object
                                                                    const obj = { [key]: newVal }
                                                                    const newJsonStr = JSON.stringify(obj, null, 2)
                                                                    if (isEn) {
                                                                        setFormData(prev => ({ ...prev, content_en: newJsonStr }))
                                                                    } else {
                                                                        setFormData(prev => ({ ...prev, content_ar: newJsonStr }))
                                                                    }
                                                                }
                                                            }

                                                            return (
                                                                <div key={field.key} className="space-y-3 p-3 border rounded-lg bg-background">
                                                                    <Label className="text-base font-semibold text-primary">{field.label}</Label>
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div className="space-y-2">
                                                                            <Label className="text-xs text-muted-foreground">English</Label>
                                                                            {field.type === 'textarea' ? (
                                                                                <Textarea
                                                                                    className="bg-muted/30"
                                                                                    value={getVal(formData.content_en, field.key)}
                                                                                    onChange={(e) => setVal(formData.content_en, field.key, e.target.value, true)}
                                                                                    dir="ltr"
                                                                                />
                                                                            ) : (
                                                                                <Input
                                                                                    className="bg-muted/30"
                                                                                    value={getVal(formData.content_en, field.key)}
                                                                                    onChange={(e) => setVal(formData.content_en, field.key, e.target.value, true)}
                                                                                    dir="ltr"
                                                                                />
                                                                            )}
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label className="text-xs text-muted-foreground">العربية</Label>
                                                                            {field.type === 'textarea' ? (
                                                                                <Textarea
                                                                                    className="bg-muted/30"
                                                                                    value={getVal(formData.content_ar, field.key)}
                                                                                    onChange={(e) => setVal(formData.content_ar, field.key, e.target.value, false)}
                                                                                    dir="rtl"
                                                                                />
                                                                            ) : (
                                                                                <Input
                                                                                    className="bg-muted/30"
                                                                                    value={getVal(formData.content_ar, field.key)}
                                                                                    onChange={(e) => setVal(formData.content_ar, field.key, e.target.value, false)}
                                                                                    dir="rtl"
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                ) : (
                                                    /* Fallback to JSON Editor for unknown pages */
                                                    <>
                                                        <div className="space-y-2">
                                                            <Label>المحتوى (إنجليزي - JSON)</Label>
                                                            <Textarea
                                                                value={typeof formData.content_en === 'string' ? formData.content_en : JSON.stringify(formData.content_en, null, 2)}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, content_en: e.target.value }))}
                                                                rows={6}
                                                                dir="ltr"
                                                                className="font-mono text-xs"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label>المحتوى (عربي - JSON)</Label>
                                                            <Textarea
                                                                value={typeof formData.content_ar === 'string' ? formData.content_ar : JSON.stringify(formData.content_ar, null, 2)}
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
                                        </DialogContent>
                                    )}
                                </Dialog>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
