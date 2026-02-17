'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Plus, Edit, Trash2, PowerOff, Power } from 'lucide-react'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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

import { usePackages, useDeletePackage, useTogglePackageStatus } from '@/hooks'
import { PackageFormDialog } from './package-form-dialog'
import type { Package } from '@/types/database'

export function PackagesManager() {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const { data: packages, isLoading } = usePackages()
    const deletePackage = useDeletePackage()
    const toggleStatus = useTogglePackageStatus()

    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingPackage, setEditingPackage] = useState<Package | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [packageToDelete, setPackageToDelete] = useState<Package | null>(null)

    const handleEdit = (pkg: Package) => {
        setEditingPackage(pkg)
        setDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setDialogOpen(false)
        setEditingPackage(null)
    }

    const handleDelete = (pkg: Package) => {
        setPackageToDelete(pkg)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!packageToDelete) return

        try {
            await deletePackage.mutateAsync(packageToDelete.id)
            setDeleteDialogOpen(false)
            setPackageToDelete(null)
        } catch (error) {
            console.error('Delete failed:', error)
        }
    }

    const handleToggleStatus = async (pkg: Package) => {
        try {
            await toggleStatus.mutateAsync({
                id: pkg.id,
                isActive: !pkg.is_active
            })
        } catch (error) {
            console.error('Toggle status failed:', error)
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {isAr ? 'إدارة الباقات' : 'Packages Management'}
                    </h2>
                    <p className="text-muted-foreground">
                        {isAr ? 'إضافة وتعديل وإدارة باقات الاشتراكات' : 'Add, edit and manage subscription packages'}
                    </p>
                </div>
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {isAr ? 'إضافة باقة' : 'Add Package'}
                </Button>
            </div>

            {/* Packages Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>{isAr ? 'اسم الباقة' : 'Package Name'}</TableHead>
                            <TableHead>{isAr ? 'السعر' : 'Price'}</TableHead>
                            <TableHead>{isAr ? 'المدة' : 'Duration'}</TableHead>
                            <TableHead>{isAr ? 'الحالة' : 'Status'}</TableHead>
                            <TableHead>{isAr ? 'تاريخ الإنشاء' : 'Created'}</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!packages || packages.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-muted-foreground">
                                            {isAr ? 'لا توجد باقات' : 'No packages found'}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setDialogOpen(true)}
                                            className="gap-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            {isAr ? 'إضافة الباقة الأولى' : 'Add First Package'}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            packages.map((pkg) => (
                                <TableRow key={pkg.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">
                                                {isAr ? (pkg.name_ar || pkg.name) : pkg.name}
                                            </div>
                                            {pkg.description && (
                                                <div className="text-sm text-muted-foreground line-clamp-1">
                                                    {isAr ? (pkg.description_ar || pkg.description) : pkg.description}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-semibold">{pkg.price.toLocaleString()} ج.م</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">
                                            {pkg.duration_days} {isAr ? 'يوم' : 'days'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                                            {pkg.is_active
                                                ? (isAr ? 'نشط' : 'Active')
                                                : (isAr ? 'غير نشط' : 'Inactive')
                                            }
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {format(new Date(pkg.created_at), 'PPP', {
                                                locale: isAr ? ar : enUS
                                            })}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <span className="sr-only">Open menu</span>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <circle cx="12" cy="12" r="1" />
                                                        <circle cx="12" cy="5" r="1" />
                                                        <circle cx="12" cy="19" r="1" />
                                                    </svg>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>
                                                    {isAr ? 'الإجراءات' : 'Actions'}
                                                </DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleEdit(pkg)} className="gap-2">
                                                    <Edit className="h-4 w-4" />
                                                    {isAr ? 'تعديل' : 'Edit'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleToggleStatus(pkg)}
                                                    className="gap-2"
                                                >
                                                    {pkg.is_active ? (
                                                        <>
                                                            <PowerOff className="h-4 w-4" />
                                                            {isAr ? 'إلغاء التفعيل' : 'Deactivate'}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Power className="h-4 w-4" />
                                                            {isAr ? 'تفعيل' : 'Activate'}
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(pkg)}
                                                    className="gap-2 text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    {isAr ? 'حذف' : 'Delete'}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Add/Edit Package Dialog */}
            <PackageFormDialog
                open={dialogOpen}
                onOpenChange={handleCloseDialog}
                package={editingPackage}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {isAr ? 'هل أنت متأكد؟' : 'Are you sure?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {isAr
                                ? `سيتم حذف الباقة "${packageToDelete ? (isAr ? (packageToDelete.name_ar || packageToDelete.name) : packageToDelete.name) : ''}" بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.`
                                : `This will permanently delete the package "${packageToDelete?.name}". This action cannot be undone.`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletePackage.isPending}>
                            {isAr ? 'إلغاء' : 'Cancel'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={deletePackage.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deletePackage.isPending ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {isAr ? 'جاري الحذف...' : 'Deleting...'}
                                </span>
                            ) : (
                                isAr ? 'حذف' : 'Delete'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
