'use client'

import { useState, useRef, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { Smile } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

interface EmojiTextareaProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    rows?: number
    className?: string
    dir?: 'rtl' | 'ltr'
}

export function EmojiTextarea({ value, onChange, placeholder, rows = 3, className, dir }: EmojiTextareaProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [emojiOpen, setEmojiOpen] = useState(false)

    const handleEmojiSelect = useCallback((emoji: { native: string }) => {
        const textarea = textareaRef.current
        if (textarea) {
            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const newValue = value.slice(0, start) + emoji.native + value.slice(end)
            onChange(newValue)
            // Restore cursor position after emoji
            requestAnimationFrame(() => {
                textarea.selectionStart = textarea.selectionEnd = start + emoji.native.length
                textarea.focus()
            })
        } else {
            onChange(value + emoji.native)
        }
    }, [value, onChange])

    return (
        <div className="relative">
            <Textarea
                ref={textareaRef}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                dir={dir || (isAr ? 'rtl' : 'ltr')}
                className={cn(
                    'rounded-xl resize-none pe-12',
                    className
                )}
            />
            <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                            'absolute top-2 h-8 w-8 text-muted-foreground hover:text-primary',
                            isAr ? 'left-2' : 'right-2'
                        )}
                    >
                        <Smile className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto p-0 border-none shadow-xl"
                    side="top"
                    align={isAr ? 'start' : 'end'}
                >
                    <Picker
                        data={data}
                        onEmojiSelect={handleEmojiSelect}
                        theme="dark"
                        locale={isAr ? 'ar' : 'en'}
                        previewPosition="none"
                        skinTonePosition="search"
                        set="native"
                        maxFrequentRows={2}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
