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
import { usePages, useUpdatePage } from '@/hooks/use-cms'
import { toast } from 'sonner'
import { Loader2, FileText, Edit, Eye, EyeOff, Save } from 'lucide-react'
import type { Page } from '@/types/database'

export function PagesManager() {
    const { data: pages, isLoading } = usePages()
    const updatePage = useUpdatePage()

    const [editingPage, setEditingPage] = useState<Page | null>(null)
    const [formData, setFormData] = useState({
        title_en: '',
        title_ar: '',
        content_en: '',
        content_ar: '',
        is_published: true,
    })

    const handleEdit = (page: Page) => {
        setEditingPage(page)
        setFormData({
            title_en: page.title_en || '',
            title_ar: page.title_ar || '',
            content_en: typeof page.content_en === 'string' ? page.content_en : JSON.stringify(page.content_en || ''),
            content_ar: typeof page.content_ar === 'string' ? page.content_ar : JSON.stringify(page.content_ar || ''),
            is_published: page.is_published,
        })
    }

    const handleSave = async () => {
        if (!editingPage) return

        try {
            await updatePage.mutateAsync({
                id: editingPage.id,
                title_en: formData.title_en,
                title_ar: formData.title_ar,
                content_en: formData.content_en,
                content_ar: formData.content_ar,
                is_published: formData.is_published,
            })
            toast.success('تم حفظ الصفحة بنجاح')
            setEditingPage(null)
        } catch (error) {
            toast.error('حدث خطأ أثناء الحفظ')
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
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    إدارة الصفحات
                </CardTitle>
                <CardDescription>
                    تعديل محتوى صفحات الموقع العامة
                </CardDescription>
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
                                >
                                    {page.is_published ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(page)}>
                                            <Edit className="h-4 w-4 me-2" />
                                            تعديل
                                        </Button>
                                    </DialogTrigger>
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

                                            <div className="space-y-2">
                                                <Label>المحتوى (إنجليزي)</Label>
                                                <Textarea
                                                    value={formData.content_en}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, content_en: e.target.value }))}
                                                    rows={6}
                                                    dir="ltr"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>المحتوى (عربي)</Label>
                                                <Textarea
                                                    value={formData.content_ar}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, content_ar: e.target.value }))}
                                                    rows={6}
                                                    dir="rtl"
                                                />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={formData.is_published}
                                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                                                />
                                                <Label>منشور</Label>
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
                                </Dialog>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
