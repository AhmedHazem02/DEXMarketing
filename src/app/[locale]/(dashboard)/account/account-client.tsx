'use client'

import { useCurrentUser, getRoleLabel } from '@/hooks/use-users'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
    Mail, 
    Shield, 
    Briefcase, 
    Calendar, 
    Clock,
    CheckCircle2,
    XCircle,
    KeyRound,
    Trash2,
    AlertTriangle
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { useState } from 'react'

// Dialog imports
import { EmailDialog } from '@/app/[locale]/(dashboard)/account/email-dialog'
import { PasswordDialog } from '@/app/[locale]/(dashboard)/account/password-dialog'
import { DeleteAccountDialog } from '@/app/[locale]/(dashboard)/account/delete-account-dialog'

export function AccountClient() {
    const t = useTranslations('account')
    const tRoles = useTranslations('roles')
    const tDepartments = useTranslations('departments')
    const locale = useLocale()
    const isAr = locale === 'ar'
    const dateLocale = isAr ? ar : enUS

    const { data: user, isLoading } = useCurrentUser()
    const [emailDialogOpen, setEmailDialogOpen] = useState(false)
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-32 bg-muted rounded-lg" />
                <div className="h-48 bg-muted rounded-lg" />
            </div>
        )
    }

    if (!user) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    {t('updateError')}
                </CardContent>
            </Card>
        )
    }

    const roleLabel = user.role ? tRoles(user.role) : user.role
    const departmentLabel = user.department ? tDepartments(user.department) : '-'

    return (
        <>
            <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {t('personalInfo')}
                        </CardTitle>
                        <CardDescription>{t('description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Avatar & Name */}
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={user.avatar_url || undefined} alt={user.name || ''} />
                                <AvatarFallback className="text-2xl">
                                    {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold">{user.name || '-'}</h3>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                        </div>

                        <Separator />

                        {/* Info Items */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{t('email')}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{t('role')}</p>
                                    <Badge variant="secondary" className="mt-1">
                                        {roleLabel}
                                    </Badge>
                                </div>
                            </div>

                            {user.department && (
                                <div className="flex items-start gap-3">
                                    <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{t('department')}</p>
                                        <Badge variant="outline" className="mt-1">
                                            {departmentLabel}
                                        </Badge>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-3">
                                {user.is_active ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{t('accountStatus')}</p>
                                    <Badge 
                                        variant={user.is_active ? 'default' : 'destructive'} 
                                        className="mt-1"
                                    >
                                        {user.is_active ? t('active') : t('inactive')}
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{t('memberSince')}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(user.created_at), 'PPP', { locale: dateLocale })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Settings Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('accountSettings')}</CardTitle>
                        <CardDescription>
                            {t('description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => setEmailDialogOpen(true)}
                        >
                            <Mail className="h-4 w-4 mr-2" />
                            {t('changeEmail')}
                        </Button>

                        <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => setPasswordDialogOpen(true)}
                        >
                            <KeyRound className="h-4 w-4 mr-2" />
                            {t('changePassword')}
                        </Button>

                        <Separator className="my-4" />

                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                            <div className="flex items-start gap-3 mb-3">
                                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sm mb-1">{t('deleteAccount')}</h4>
                                    <p className="text-xs text-muted-foreground">
                                        {t('deleteAccountWarning')}
                                    </p>
                                </div>
                            </div>
                            <Button 
                                variant="destructive" 
                                size="sm"
                                className="w-full"
                                onClick={() => setDeleteDialogOpen(true)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('deleteAccount')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dialogs */}
            <EmailDialog 
                open={emailDialogOpen}
                onOpenChange={setEmailDialogOpen}
                currentEmail={user.email}
                userId={user.id}
            />
            <PasswordDialog 
                open={passwordDialogOpen}
                onOpenChange={setPasswordDialogOpen}
                userId={user.id}
            />
            <DeleteAccountDialog 
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                userId={user.id}
                userName={user.name || ''}
            />
        </>
    )
}
