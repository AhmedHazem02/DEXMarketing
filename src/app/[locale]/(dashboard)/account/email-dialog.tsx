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
import { updateEmail } from '@/lib/actions/users'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface EmailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentEmail: string
    userId: string
}

export function EmailDialog({ open, onOpenChange, currentEmail, userId }: EmailDialogProps) {
    const t = useTranslations('account')
    const router = useRouter()
    const [newEmail, setNewEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!newEmail || newEmail === currentEmail) {
            toast.error(t('updateError'))
            return
        }

        setIsLoading(true)
        try {
            const result = await updateEmail(userId, newEmail)
            
            if (result.success) {
                toast.success(t('updateSuccess'))
                onOpenChange(false)
                setNewEmail('')
                router.refresh()
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
                        <DialogTitle>{t('changeEmail')}</DialogTitle>
                        <DialogDescription>
                            {t('emailDesc')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{t('email')}</Label>
                            <Input 
                                value={currentEmail} 
                                disabled 
                                className="bg-muted"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-email">{t('newEmail')}</Label>
                            <Input
                                id="new-email"
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="new@example.com"
                                required
                                disabled={isLoading}
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
                            {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                            {t('save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
