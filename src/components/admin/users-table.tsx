'use client'

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
import { useUsers, useUpdateUser, useDeleteUser } from '@/hooks'
import { MoreHorizontal, UserPlus, Shield, UserX, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { UserRole } from '@/types/database'
import { AddUserDialog } from '@/components/admin/add-user-dialog'

const roleColors: Record<UserRole, string> = {
    admin: 'bg-red-500/20 text-red-400 border-red-500/30',
    accountant: 'bg-green-500/20 text-green-400 border-green-500/30',
    team_leader: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    creator: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    client: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
}

const roleLabels: Record<UserRole, string> = {
    admin: 'مدير',
    accountant: 'محاسب',
    team_leader: 'قائد فريق',
    creator: 'مصمم',
    client: 'عميل',
}

export function UsersTable() {
    const { data: users, isLoading, error } = useUsers()
    const updateUser = useUpdateUser()
    const deleteUser = useDeleteUser()

    const handleRoleChange = async (userId: string, role: UserRole) => {
        try {
            await updateUser.mutateAsync({ id: userId, role })
            toast.success('تم تحديث الدور بنجاح')
        } catch (error) {
            toast.error('حدث خطأ أثناء تحديث الدور')
        }
    }

    const handleToggleActive = async (userId: string, isActive: boolean) => {
        try {
            await updateUser.mutateAsync({ id: userId, is_active: !isActive })
            toast.success(isActive ? 'تم تعطيل الحساب' : 'تم تفعيل الحساب')
        } catch (error) {
            toast.error('حدث خطأ')
        }
    }

    const handleDelete = async (userId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return
        try {
            await deleteUser.mutateAsync(userId)
            toast.success('تم حذف المستخدم')
        } catch (error) {
            toast.error('حدث خطأ أثناء الحذف')
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
                    حدث خطأ أثناء تحميل المستخدمين
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>إدارة المستخدمين</CardTitle>
                    <CardDescription>
                        {users?.length || 0} مستخدم مسجل
                    </CardDescription>
                </div>
                <AddUserDialog />
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>المستخدم</TableHead>
                            <TableHead>البريد الإلكتروني</TableHead>
                            <TableHead>الدور</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>تاريخ التسجيل</TableHead>
                            <TableHead className="text-left">إجراءات</TableHead>
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
                                        <span className="font-medium">{user.name || 'بدون اسم'}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={roleColors[user.role]}>
                                        {roleLabels[user.role]}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                                        {user.is_active ? 'نشط' : 'معطل'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {new Date(user.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                                                نسخ المعرف
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleToggleActive(user.id, user.is_active)}>
                                                {user.is_active ? (
                                                    <><Shield className="mr-2 h-4 w-4" /> تعطيل الحساب</>
                                                ) : (
                                                    <><Shield className="mr-2 h-4 w-4" /> تفعيل الحساب</>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuLabel>تغيير الدور</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}>مدير</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'team_leader')}>قائد فريق</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'accountant')}>محاسب</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'creator')}>مصمم</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'client')}>عميل</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(user.id)}>
                                                <UserX className="mr-2 h-4 w-4" />
                                                حذف المستخدم
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
