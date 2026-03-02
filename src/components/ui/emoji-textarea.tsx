'use client'

import { useState, useRef, useCallback, lazy, Suspense } from 'react'
import { useLocale } from 'next-intl'
import { Smile, Loader2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// Lazy-load emoji picker — saves ~1.4MB from initial bundle
const LazyEmojiPicker = lazy(() => import('@emoji-mart/react').then(mod => ({ default: mod.default })))
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let emojiData: any = null
const loadEmojiData = () => import('@emoji-mart/data').then(mod => { emojiData = mod.default; return emojiData })

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
    const [dataLoaded, setDataLoaded] = useState(false)

    const handleOpenChange = useCallback((open: boolean) => {
        setEmojiOpen(open)
        if (open && !dataLoaded) {
            loadEmojiData().then(() => setDataLoaded(true))
        }
    }, [dataLoaded])

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
            <Popover open={emojiOpen} onOpenChange={handleOpenChange}>
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
                        <Smile className="size-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto p-0 border-none shadow-xl"
                    side="top"
                    align={isAr ? 'start' : 'end'}
                >
                    <Suspense fallback={
                        <div className="flex items-center justify-center h-[350px] w-[350px]">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        </div>
                    }>
                        {dataLoaded && emojiData && (
                            <LazyEmojiPicker
                                data={emojiData}
                                onEmojiSelect={handleEmojiSelect}
                                theme="dark"
                                locale={isAr ? 'ar' : 'en'}
                                previewPosition="none"
                                skinTonePosition="search"
                                set="native"
                                maxFrequentRows={2}
                            />
                        )}
                    </Suspense>
                </PopoverContent>
            </Popover>
        </div>
    )
}
