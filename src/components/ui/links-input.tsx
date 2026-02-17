'use client'

import { useLocale } from 'next-intl'
import { Plus, X, Link as LinkIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { ScheduleLink } from '@/types/database'

export type LinkItem = ScheduleLink

interface LinksInputProps {
    value: LinkItem[]
    onChange: (value: LinkItem[]) => void
    maxLinks?: number
    className?: string
}

export function LinksInput({ value, onChange, maxLinks = 10, className }: LinksInputProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const addLink = () => {
        if (value.length >= maxLinks) return
        onChange([...value, { url: '', comment: '' }])
    }

    const removeLink = (index: number) => {
        onChange(value.filter((_, i) => i !== index))
    }

    const updateLink = (index: number, field: keyof LinkItem, val: string) => {
        const updated = value.map((link, i) =>
            i === index ? { ...link, [field]: val } : link
        )
        onChange(updated)
    }

    return (
        <div className={cn('space-y-3', className)}>
            <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <LinkIcon className="h-3.5 w-3.5" />
                    {isAr ? 'روابط' : 'Links'}
                    {value.length > 0 && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                            {value.length}
                        </span>
                    )}
                </Label>
            </div>

            {value.map((link, i) => (
                <div key={i} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-1.5">
                        <Input
                            type="url"
                            value={link.url}
                            onChange={e => updateLink(i, 'url', e.target.value)}
                            placeholder="https://..."
                            className="rounded-xl text-sm"
                            dir="ltr"
                        />
                        <Input
                            value={link.comment}
                            onChange={e => updateLink(i, 'comment', e.target.value)}
                            placeholder={isAr ? 'تعليق على الرابط...' : 'Link comment...'}
                            className="rounded-xl text-sm"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 mt-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 shrink-0"
                        onClick={() => removeLink(i)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full rounded-xl border-dashed border-primary/30 text-primary hover:bg-primary/10"
                onClick={addLink}
            >
                <Plus className="h-3.5 w-3.5 me-1.5" />
                {isAr ? 'إضافة لينك' : 'Add Link'}
            </Button>
        </div>
    )
}
