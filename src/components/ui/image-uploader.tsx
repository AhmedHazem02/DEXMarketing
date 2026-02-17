'use client'

import { useState, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { Plus, X, Loader2, ImageIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { toast } from 'sonner'

interface ImageUploaderProps {
    value: string[]
    onChange: (value: string[]) => void
    maxImages?: number
    className?: string
}

export function ImageUploader({ value, onChange, maxImages = 10, className }: ImageUploaderProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const [uploading, setUploading] = useState(false)

    const removeImage = (index: number) => {
        onChange(value.filter((_, i) => i !== index))
    }

    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        const remaining = maxImages - value.length
        if (remaining <= 0) {
            toast.error(isAr ? `الحد الأقصى ${maxImages} صور` : `Maximum ${maxImages} images`)
            return
        }

        const toUpload = files.slice(0, remaining)
        setUploading(true)

        try {
            const uploadPromises = toUpload.map(file =>
                uploadToCloudinary(file, 'schedules')
            )
            const urls = await Promise.all(uploadPromises)
            onChange([...value, ...urls])
            toast.success(isAr ? `تم رفع ${urls.length} صورة` : `${urls.length} image(s) uploaded`)
        } catch {
            toast.error(isAr ? 'فشل رفع الصور' : 'Failed to upload images')
        } finally {
            setUploading(false)
            // Reset input
            e.target.value = ''
        }
    }, [value, maxImages, onChange, isAr])

    return (
        <div className={cn('space-y-2', className)}>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                {isAr ? 'الصور' : 'Images'}
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    {value.length}/{maxImages}
                </span>
            </Label>

            <div className="grid grid-cols-5 gap-2">
                {value.map((url, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden border border-border">
                        <img
                            src={url}
                            alt={`${i + 1}`}
                            className="w-full aspect-square object-cover"
                        />
                        <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-1 end-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                            <X className="h-3 w-3 text-white" />
                        </button>
                    </div>
                ))}

                {value.length < maxImages && (
                    <label className={cn(
                        'border-2 border-dashed rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer transition-colors',
                        uploading
                            ? 'border-primary/50 bg-primary/5'
                            : 'border-border/50 hover:border-primary/30 hover:bg-muted/30'
                    )}>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            hidden
                            onChange={handleImageUpload}
                            disabled={uploading}
                        />
                        {uploading ? (
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        ) : (
                            <>
                                <Plus className="h-5 w-5 text-muted-foreground" />
                                <span className="text-[9px] text-muted-foreground mt-1">
                                    {isAr ? 'رفع' : 'Upload'}
                                </span>
                            </>
                        )}
                    </label>
                )}
            </div>
        </div>
    )
}
