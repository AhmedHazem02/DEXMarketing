'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSiteSettings, useUpdateSiteSetting } from '@/hooks/use-cms'
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
    const { data: settings, isLoading } = useSiteSettings()
    const updateSetting = useUpdateSiteSetting()

    const currentTheme = (settings?.theme as ThemeColors) || defaultTheme

    const [colors, setColors] = useState<ThemeColors>(currentTheme)
    const [hasChanges, setHasChanges] = useState(false)

    const handleColorChange = (key: keyof ThemeColors, value: string) => {
        setColors(prev => ({ ...prev, [key]: value }))
        setHasChanges(true)
    }

    const handleSave = async () => {
        try {
            await updateSetting.mutateAsync({ key: 'theme', value: colors })
            toast.success('تم حفظ الألوان بنجاح')
            setHasChanges(false)
        } catch (error) {
            toast.error('حدث خطأ أثناء الحفظ')
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
                    محرر الثيم
                </CardTitle>
                <CardDescription>
                    تخصيص ألوان النظام الرئيسية
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Preview */}
                <div
                    className="rounded-lg p-6 border"
                    style={{ backgroundColor: colors.background }}
                >
                    <h3 className="text-lg font-bold mb-4" style={{ color: colors.primary }}>
                        معاينة الألوان
                    </h3>
                    <div className="flex gap-4">
                        <div
                            className="px-4 py-2 rounded-lg font-medium"
                            style={{ backgroundColor: colors.primary, color: colors.background }}
                        >
                            زر رئيسي
                        </div>
                        <div
                            className="px-4 py-2 rounded-lg font-medium border"
                            style={{ borderColor: colors.accent, color: colors.accent }}
                        >
                            زر ثانوي
                        </div>
                    </div>
                    <p className="mt-4 text-sm" style={{ color: colors.accent }}>
                        هذا نص بلون التمييز (Accent)
                    </p>
                </div>

                {/* Color Inputs */}
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="primary">اللون الرئيسي (Primary)</Label>
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
                        <Label htmlFor="background">لون الخلفية (Background)</Label>
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
                        <Label htmlFor="accent">لون التمييز (Accent)</Label>
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
                        إعادة للافتراضي
                    </Button>
                    <Button onClick={handleSave} disabled={!hasChanges || updateSetting.isPending}>
                        {updateSetting.isPending ? (
                            <Loader2 className="h-4 w-4 me-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 me-2" />
                        )}
                        حفظ التغييرات
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
