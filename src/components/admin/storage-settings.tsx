'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useStorageSettings, useUpdateStorageSettings } from '@/hooks/use-cms'
import { toast } from 'sonner'
import { Loader2, HardDrive, Save, Trash2, AlertTriangle } from 'lucide-react'
import { useState, useEffect } from 'react'

export function StorageSettingsCard() {
    const { data: settings, isLoading } = useStorageSettings()
    const updateSettings = useUpdateStorageSettings()

    const [autoDeleteMonths, setAutoDeleteMonths] = useState(0)
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        if (settings) {
            setAutoDeleteMonths(settings.auto_delete_months)
        }
    }, [settings])

    const handleSliderChange = (value: number[]) => {
        setAutoDeleteMonths(value[0])
        setHasChanges(true)
    }

    const handleSave = async () => {
        try {
            await updateSettings.mutateAsync({ auto_delete_months: autoDeleteMonths })
            toast.success('تم حفظ الإعدادات')
            setHasChanges(false)
        } catch (error) {
            toast.error('حدث خطأ أثناء الحفظ')
        }
    }

    const getDeleteLabel = () => {
        if (autoDeleteMonths === 0) return 'إيقاف الحذف التلقائي'
        if (autoDeleteMonths === 1) return 'شهر واحد'
        if (autoDeleteMonths === 2) return 'شهرين'
        if (autoDeleteMonths <= 10) return `${autoDeleteMonths} أشهر`
        return `${autoDeleteMonths} شهر`
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    إعدادات التخزين
                </CardTitle>
                <CardDescription>
                    التحكم في الحذف التلقائي للملفات القديمة
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Warning */}
                {autoDeleteMonths > 0 && autoDeleteMonths <= 3 && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                            <p className="font-medium text-yellow-500">تحذير</p>
                            <p className="text-sm text-muted-foreground">
                                الحذف التلقائي السريع قد يؤدي لفقدان ملفات مهمة. ننصح بفترة 6 أشهر على الأقل.
                            </p>
                        </div>
                    </div>
                )}

                {/* Slider */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label>حذف الملفات تلقائياً بعد:</Label>
                        <span className="text-lg font-bold text-primary">{getDeleteLabel()}</span>
                    </div>

                    <Slider
                        value={[autoDeleteMonths]}
                        onValueChange={handleSliderChange}
                        max={24}
                        step={1}
                        className="w-full"
                    />

                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>إيقاف</span>
                        <span>6 أشهر</span>
                        <span>12 شهر</span>
                        <span>24 شهر</span>
                    </div>
                </div>

                {/* Info */}
                <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-sm">
                        <Trash2 className="h-4 w-4" />
                        <span>
                            {autoDeleteMonths === 0
                                ? 'لن يتم حذف أي ملفات تلقائياً'
                                : `سيتم حذف الملفات التي مضى عليها ${getDeleteLabel()} تلقائياً`
                            }
                        </span>
                    </div>
                    {settings?.last_cleanup && (
                        <p className="text-xs text-muted-foreground mt-2">
                            آخر تنظيف: {new Date(settings.last_cleanup).toLocaleDateString('ar-EG')}
                        </p>
                    )}
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={!hasChanges || updateSettings.isPending}>
                        {updateSettings.isPending ? (
                            <Loader2 className="h-4 w-4 me-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 me-2" />
                        )}
                        حفظ الإعدادات
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
