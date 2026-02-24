'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useUsers, useUpdateUser, useDeleteUser } from '@/hooks'
import { MoreHorizontal, Shield, UserX, Loader2, Key } from 'lucide-react'
import { toast } from 'sonner'
import type { UserRole } from '@/types/database'
import { AddUserDialog } from '@/components/admin/add-user-dialog'
import { ChangePasswordDialog } from '@/components/admin/change-password-dialog'

const roleColors: Record<UserRole, string> = {
    admin: 'bg-red-500/20 text-red-400 border-red-500/30',
    accountant: 'bg-green-500/20 text-green-400 border-green-500/30',
    team_leader: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    creator: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    client: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    videographer: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    editor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    photographer: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    account_manager: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    designer: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
}

const ROLE_I18N_KEYS: Record<UserRole, string> = {
    admin: 'roleAdmin',
    accountant: 'roleAccountant',
    team_leader: 'roleTeamLeader',
    creator: 'roleCreator',
    client: 'roleClient',
    videographer: 'roleVideographer',
    editor: 'roleEditor',
    photographer: 'rolePhotographer',
    account_manager: 'roleAccountManager',
    designer: 'roleDesigner',
}

export function UsersTable() {
    const t = useTranslations('usersTable')
    const { data: users, isLoading, error } = useUsers()
    const updateUser = useUpdateUser()
    const deleteUser = useDeleteUser()
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
    const [passwordChangeTarget, setPasswordChangeTarget] = useState<{ id: string; name: string } | null>(null)

    const handleRoleChange = async (userId: string, role: UserRole) => {
        try {
            await updateUser.mutateAsync({ id: userId, role })
            toast.success(t('roleUpdateSuccess'))
        } catch (error) {
            toast.error(t('roleUpdateError'))
        }
    }

    const handleToggleActive = async (userId: string, isActive: boolean) => {
        try {
            await updateUser.mutateAsync({ id: userId, is_active: !isActive })
            toast.success(isActive ? t('accountDeactivated') : t('accountActivated'))
        } catch (error) {
            toast.error(t('genericError'))
        }
    }

    const handleDelete = async (userId: string) => {
        try {
            await deleteUser.mutateAsync(userId)
            toast.success(t('userDeleted'))
        } catch (error) {
            toast.error(t('deleteError'))
        } finally {
            setDeleteTarget(null)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <Card className="border-destructive">
                <CardContent className="p-6 text-center text-destructive">
                    {t('loadError')}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>{t('manageUsers')}</CardTitle>
                    <CardDescription>
                        {t('registeredUsers', { count: users?.length || 0 })}
                    </CardDescription>
                </div>
                <AddUserDialog />
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>{t('columnUser')}</TableHead>
                            <TableHead className="hidden md:table-cell">{t('columnEmail')}</TableHead>
                            <TableHead>{t('columnRole')}</TableHead>
                            <TableHead>{t('columnStatus')}</TableHead>
                            <TableHead className="hidden md:table-cell">{t('columnRegistrationDate')}</TableHead>
                            <TableHead className="text-left">{t('columnActions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users?.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.avatar_url || ''} />
                                            <AvatarFallback className="bg-primary/20 text-primary">
                                                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{user.name || t('noName')}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground hidden md:table-cell">{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={roleColors[user.role]}>
                                        {t(ROLE_I18N_KEYS[user.role])}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                                        {user.is_active ? t('statusActive') : t('statusInactive')}
                                    </Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {new Date(user.created_at).toLocaleDateString('ar-EG')}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0" aria-label={t('userOptions')}>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                                                {t('copyId')}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleToggleActive(user.id, user.is_active)}>
                                                {user.is_active ? (
                                                    <><Shield className="me-2 h-4 w-4" /> {t('deactivateAccount')}</>
                                                ) : (
                                                    <><Shield className="me-2 h-4 w-4" /> {t('activateAccount')}</>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setPasswordChangeTarget({ id: user.id, name: user.name || user.email })}>
                                                <Key className="me-2 h-4 w-4" /> {t('changePassword')}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuLabel>{t('changeRole')}</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}>{t('roleAdmin')}</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'account_manager')}>{t('roleAccountManager')}</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'team_leader')}>{t('roleTeamLeader')}</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'accountant')}>{t('roleAccountant')}</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'creator')}>{t('roleCreator')}</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'designer')}>{t('roleDesigner')}</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'videographer')}>{t('roleVideographer')}</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'editor')}>{t('roleEditor')}</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'photographer')}>{t('rolePhotographer')}</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'client')}>{t('roleClient')}</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(user.id)}>
                                                <UserX className="me-2 h-4 w-4" />
                                                {t('deleteUser')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>

            <ChangePasswordDialog
                open={!!passwordChangeTarget}
                onOpenChange={(open) => !open && setPasswordChangeTarget(null)}
                userId={passwordChangeTarget?.id || ''}
                userName={passwordChangeTarget?.name || ''}
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('confirmDeleteDescription')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteTarget && handleDelete(deleteTarget)}
                        >
                            {t('deleteUser')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}
