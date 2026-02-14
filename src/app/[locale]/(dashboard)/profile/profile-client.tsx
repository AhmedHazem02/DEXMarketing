'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/use-users'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTranslations } from 'next-intl'
import { updateProfile } from '@/lib/actions/users'
import { toast } from 'sonner'
import { Loader2, Camera, X, Upload } from 'lucide-react'
import { uploadToCloudinary } from '@/lib/cloudinary'

export function ProfileClient() {
    const t = useTranslations('profile')
    const router = useRouter()
    const { data: user, isLoading } = useCurrentUser()
    
    const [name, setName] = useState(user?.name || '')
    const [phone, setPhone] = useState(user?.phone || '')
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    // Update local state when user data loads
    useState(() => {
        if (user) {
            setName(user.name || '')
            setPhone(user.phone || '')
            setAvatarUrl(user.avatar_url || '')
        }
    })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            toast.error(t('fileSizeError'))
            return
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error(t('fileTypeError'))
            return
        }

        setAvatarFile(file)
        
        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleUploadAvatar = async () => {
        if (!avatarFile || !user) return

        setIsUploading(true)
        try {
            const uploadedUrl = await uploadToCloudinary(avatarFile, 'avatars')
            setAvatarUrl(uploadedUrl)
            setPreviewUrl(null)
            setAvatarFile(null)
            toast.success(t('uploadSuccess'))
        } catch (error) {
            console.error('Upload error:', error)
            toast.error(t('uploadError'))
        } finally {
            setIsUploading(false)
        }
    }

    const handleRemoveAvatar = () => {
        setAvatarUrl('')
        setPreviewUrl(null)
        setAvatarFile(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!user) return

        // Upload avatar first if there's a pending file
        if (avatarFile) {
            await handleUploadAvatar()
        }

        setIsSubmitting(true)
        try {
            const result = await updateProfile({
                userId: user.id,
                name: name || undefined,
                phone: phone || undefined,
                avatar_url: avatarUrl || undefined,
            })

            if (result.success) {
                toast.success(t('updateSuccess'))
                router.refresh()
            } else {
                toast.error(result.error || t('updateError'))
            }
        } catch (error) {
            toast.error(t('updateError'))
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading || !user) {
        return (
            <Card>
                <CardContent className="py-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-32 bg-muted rounded-lg" />
                        <div className="h-12 bg-muted rounded-lg" />
                        <div className="h-12 bg-muted rounded-lg" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    const displayAvatar = previewUrl || avatarUrl || user.avatar_url

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>{t('editProfile')}</CardTitle>
                <CardDescription>{t('description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-4 pb-6 border-b">
                        <Avatar className="h-32 w-32">
                            <AvatarImage src={displayAvatar || undefined} alt={name} />
                            <AvatarFallback className="text-4xl">
                                {name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex flex-wrap gap-2 justify-center">
                            <Label htmlFor="avatar-upload" className="cursor-pointer">
                                <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                                    <Camera className="h-4 w-4 mr-2" />
                                    {avatarUrl ? t('changePhoto') : t('uploadPhoto')}
                                </div>
                                <Input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={isUploading || isSubmitting}
                                />
                            </Label>

                            {avatarFile && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleUploadAvatar}
                                    disabled={isUploading || isSubmitting}
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            {t('uploading')}
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4 mr-2" />
                                            {t('uploadNow')}
                                        </>
                                    )}
                                </Button>
                            )}

                            {(avatarUrl || previewUrl) && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRemoveAvatar}
                                    disabled={isUploading || isSubmitting}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    {t('removePhoto')}
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            {t('photoRequirements')}
                        </p>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                {t('fullName')} <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="أحمد محمد"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">{t('phone')}</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+20 123 456 7890"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('email')}</Label>
                            <Input
                                value={user.email}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                {t('emailChangeNote')}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-6 border-t">
                        <Button
                            type="submit"
                            disabled={isSubmitting || isUploading}
                            className="flex-1"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('saving')}
                                </>
                            ) : (
                                t('saveChanges')
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={isSubmitting || isUploading}
                        >
                            {t('cancel')}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
