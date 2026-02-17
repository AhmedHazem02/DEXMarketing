'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getJsonValue } from './helpers'
import type { SchemaField } from './types'

interface SchemaFieldEditorProps {
    field: SchemaField
    contentEn: string
    contentAr: string
    onContentChange: (key: string, value: string, isEn: boolean) => void
}

export function SchemaFieldEditor({ field, contentEn, contentAr, onContentChange }: SchemaFieldEditorProps) {
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
