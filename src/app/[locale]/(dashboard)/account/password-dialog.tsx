'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslations } from 'next-intl'
import { updatePassword } from '@/lib/actions/users'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff } from 'lucide-react'

interface PasswordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userId: string
}

export function PasswordDialog({ open, onOpenChange, userId }: PasswordDialogProps) {
    const t = useTranslations('account')
    const router = useRouter()
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (newPassword.length < 6) {
            toast.error(t('passwordMinLength'))
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error(t('passwordsDontMatch'))
            return
        }

        setIsLoading(true)
        try {
            const result = await updatePassword(userId, newPassword)
            
            if (result.success) {
                toast.success(t('updateSuccess'))
                onOpenChange(false)
                setNewPassword('')
                setConfirmPassword('')
            } else {
                toast.error(result.error || t('updateError'))
            }
        } catch (error) {
            toast.error(t('updateError'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{t('changePassword')}</DialogTitle>
                        <DialogDescription>
                            {t('enterNewPassword')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">{t('newPassword')}</Label>
                            <div className="relative">
                                <Input
                                    id="new-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    disabled={isLoading}
                                    minLength={6}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">{t('confirmNewPassword')}</Label>
                            <Input
                                id="confirm-password"
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                                minLength={6}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            {t('cancel')}
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
