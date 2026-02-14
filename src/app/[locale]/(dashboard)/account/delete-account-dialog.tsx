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
import { deleteAccount } from '@/lib/actions/users'
import { toast } from 'sonner'
import { Loader2, AlertTriangle } from 'lucide-react'

interface DeleteAccountDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userId: string
    userName: string
}

export function DeleteAccountDialog({ open, onOpenChange, userId, userName }: DeleteAccountDialogProps) {
    const t = useTranslations('account')
    const router = useRouter()
    const [confirmText, setConfirmText] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (confirmText !== 'DELETE') {
            toast.error(t('typeDeleteError'))
            return
        }

        setIsLoading(true)
        try {
            const result = await deleteAccount(userId)
            
            if (result.success) {
                toast.success(t('accountDeletedSuccess'))
                router.push('/auth/login')
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
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            <DialogTitle>{t('deleteAccount')}</DialogTitle>
                        </div>
                        <DialogDescription className="text-left">
                            {t('deleteAccountWarning')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="rounded-lg bg-destructive/10 p-4 space-y-2">
                            <p className="text-sm font-medium">
                                {t('accountWillBeDeleted')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {userName}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-delete">
                                {t('typeDeleteToConfirm')}
                            </Label>
                            <Input
                                id="confirm-delete"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="DELETE"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false)
                                setConfirmText('')
                            }}
                            disabled={isLoading}
                        >
                            {t('cancel')}
                        </Button>
                        <Button 
                            type="submit" 
                            variant="destructive"
                            disabled={isLoading || confirmText !== 'DELETE'}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('deleteAccountPermanently')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
