'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { GripVertical, ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { MediaUpload } from '@/components/admin/media-upload'
import type { ContentItem, ItemFieldDef } from './types'

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

export function ItemEditor({ item, index, total, fields, slug, onUpdate, onRemove, onMove }: ItemEditorProps) {
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
