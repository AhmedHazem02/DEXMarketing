'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSiteSettings, useUpdateSiteSetting } from '@/hooks/use-cms'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Loader2, Palette, Save, RotateCcw } from 'lucide-react'

interface ThemeColors {
    primary: string
    background: string
    accent: string
}

const defaultTheme: ThemeColors = {
    primary: '#FFD700',
    background: '#0A1628',
    accent: '#00D4FF',
}

export function ThemeEditor() {
    const t = useTranslations('themeEditor')
    const { data: settings, isLoading } = useSiteSettings()
    const updateSetting = useUpdateSiteSetting()

    const [colors, setColors] = useState<ThemeColors>(defaultTheme)
    const [hasChanges, setHasChanges] = useState(false)

    // Sync colors state when settings data loads from server
    useEffect(() => {
        if (settings?.theme) {
            setColors(settings.theme as ThemeColors)
        }
    }, [settings])

    const isValidHex = (hex: string) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)

    const handleColorChange = (key: keyof ThemeColors, value: string) => {
        setColors(prev => ({ ...prev, [key]: value }))
        setHasChanges(true)
    }

    const handleSave = async () => {
        // Validate all color values are valid hex
        for (const [key, value] of Object.entries(colors)) {
            if (!isValidHex(value)) {
                toast.error(t('invalidColor') ?? `Invalid hex color for ${key}: ${value}`)
                return
            }
        }

        try {
            await updateSetting.mutateAsync({ key: 'theme', value: colors })
            toast.success(t('saveSuccess'))
            setHasChanges(false)
        } catch (error) {
            toast.error(t('saveError'))
        }
    }

    const handleReset = () => {
        setColors(defaultTheme)
        setHasChanges(true)
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    {t('title')}
                </CardTitle>
                <CardDescription>
                    {t('description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Preview */}
                <div
                    className="rounded-lg p-6 border"
                    style={{ backgroundColor: colors.background }}
                >
                    <h3 className="text-lg font-bold mb-4" style={{ color: colors.primary }}>
                        {t('preview')}
                    </h3>
                    <div className="flex gap-4">
                        <div
                            className="px-4 py-2 rounded-lg font-medium"
                            style={{ backgroundColor: colors.primary, color: colors.background }}
                        >
                            {t('primaryButton')}
                        </div>
                        <div
                            className="px-4 py-2 rounded-lg font-medium border"
                            style={{ borderColor: colors.accent, color: colors.accent }}
                        >
                            {t('secondaryButton')}
                        </div>
                    </div>
                    <p className="mt-4 text-sm" style={{ color: colors.accent }}>
                        {t('accentText')}
                    </p>
                </div>

                {/* Color Inputs */}
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="primary">{t('primaryColor')}</Label>
                        <div className="flex gap-2">
                            <Input
                                id="primary"
                                type="color"
                                value={colors.primary}
                                onChange={(e) => handleColorChange('primary', e.target.value)}
                                className="w-16 h-10 p-1 cursor-pointer"
                            />
                            <Input
                                type="text"
                                value={colors.primary}
                                onChange={(e) => handleColorChange('primary', e.target.value)}
                                className="flex-1 font-mono"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="background">{t('backgroundColor')}</Label>
                        <div className="flex gap-2">
                            <Input
                                id="background"
                                type="color"
                                value={colors.background}
                                onChange={(e) => handleColorChange('background', e.target.value)}
                                className="w-16 h-10 p-1 cursor-pointer"
                            />
                            <Input
                                type="text"
                                value={colors.background}
                                onChange={(e) => handleColorChange('background', e.target.value)}
                                className="flex-1 font-mono"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="accent">{t('accentColor')}</Label>
                        <div className="flex gap-2">
                            <Input
                                id="accent"
                                type="color"
                                value={colors.accent}
                                onChange={(e) => handleColorChange('accent', e.target.value)}
                                className="w-16 h-10 p-1 cursor-pointer"
                            />
                            <Input
                                type="text"
                                value={colors.accent}
                                onChange={(e) => handleColorChange('accent', e.target.value)}
                                className="flex-1 font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleReset}>
                        <RotateCcw className="h-4 w-4 me-2" />
                        {t('resetDefault')}
                    </Button>
                    <Button onClick={handleSave} disabled={!hasChanges || updateSetting.isPending}>
                        {updateSetting.isPending ? (
                            <Loader2 className="h-4 w-4 me-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 me-2" />
                        )}
                        {t('saveChanges')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
