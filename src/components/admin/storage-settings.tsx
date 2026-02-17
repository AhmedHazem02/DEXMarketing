'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useStorageSettings, useUpdateStorageSettings } from '@/hooks/use-cms'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Loader2, HardDrive, Save, Trash2, AlertTriangle } from 'lucide-react'
import { useState, useEffect } from 'react'

export function StorageSettingsCard() {
    const t = useTranslations('storageSettings')
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
            toast.success(t('saveSuccess'))
            setHasChanges(false)
        } catch (error) {
            toast.error(t('saveError'))
        }
    }

    const getDeleteLabel = () => {
        if (autoDeleteMonths === 0) return t('disabled')
        if (autoDeleteMonths === 1) return t('oneMonth')
        if (autoDeleteMonths === 2) return t('twoMonths')
        if (autoDeleteMonths <= 10) return t('months', { count: autoDeleteMonths })
        return t('monthsAlt', { count: autoDeleteMonths })
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
                    {t('title')}
                </CardTitle>
                <CardDescription>
                    {t('description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Warning */}
                {autoDeleteMonths > 0 && autoDeleteMonths <= 3 && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                            <p className="font-medium text-yellow-500">{t('warning')}</p>
                            <p className="text-sm text-muted-foreground">
                                {t('warningDesc')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Slider */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label>{t('deleteAfter')}</Label>
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
                        <span>{t('stop')}</span>
                        <span>{t('sixMonths')}</span>
                        <span>{t('twelveMonths')}</span>
                        <span>{t('twentyFourMonths')}</span>
                    </div>
                </div>

                {/* Info */}
                <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-sm">
                        <Trash2 className="h-4 w-4" />
                        <span>
                            {autoDeleteMonths === 0
                                ? t('noAutoDelete')
                                : t('autoDeleteInfo', { period: getDeleteLabel() })
                            }
                        </span>
                    </div>
                    {settings?.last_cleanup && (
                        <p className="text-xs text-muted-foreground mt-2">
                            {t('lastCleanup', { date: new Date(settings.last_cleanup).toLocaleDateString('ar-EG') })}
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
                        {t('saveSettings')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
