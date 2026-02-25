'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
    Settings as SettingsIcon, 
    Bell, 
    Lock, 
    Globe, 
    Save,
    Loader2,
    Sun,
    Moon,
    Monitor
} from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'

interface UserSettings {
    language: 'ar' | 'en'
    theme: 'light' | 'dark' | 'system'
    emailNotifications: boolean
    pushNotifications: boolean
    taskNotifications: boolean
    messageNotifications: boolean
    showProfile: boolean
    showEmail: boolean
    showPhone: boolean
}

export function SettingsClient() {
    const t = useTranslations('settings')
    const router = useRouter()
    const pathname = usePathname()
    const currentLocale = useLocale()
    const { theme, setTheme } = useTheme()
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    // Load settings from localStorage
    const [settings, setSettings] = useState<UserSettings>(() => {
        if (typeof window === 'undefined') {
            return {
                language: currentLocale as 'ar' | 'en',
                theme: 'system',
                emailNotifications: true,
                pushNotifications: true,
                taskNotifications: true,
                messageNotifications: true,
                showProfile: true,
                showEmail: true,
                showPhone: true,
            }
        }

        const saved = localStorage.getItem('user-settings')
        if (saved) {
            return JSON.parse(saved)
        }

        return {
            language: currentLocale as 'ar' | 'en',
            theme: (theme as 'light' | 'dark' | 'system') || 'system',
            emailNotifications: true,
            pushNotifications: true,
            taskNotifications: true,
            messageNotifications: true,
            showProfile: true,
            showEmail: true,
            showPhone: true,
        }
    })

    // Sync settings with localStorage
    useEffect(() => {
        if (hasChanges) {
            localStorage.setItem('user-settings', JSON.stringify(settings))
        }
    }, [settings, hasChanges])

    const handleLanguageChange = (lang: 'ar' | 'en') => {
        setSettings({ ...settings, language: lang })
        setHasChanges(true)
        
        // Change locale in URL
        const segments = pathname.split('/')
        segments[1] = lang
        router.push(segments.join('/'))
        
        toast.success(t('settingsSaved'))
    }

    const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
        setTheme(newTheme)
        setSettings({ ...settings, theme: newTheme })
        setHasChanges(true)
    }

    const updateSetting = <K extends keyof UserSettings>(
        key: K,
        value: UserSettings[K]
    ) => {
        setSettings({ ...settings, [key]: value })
        setHasChanges(true)
    }

    const handleSave = async () => {
        setIsSaving(true)
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500))
        
        localStorage.setItem('user-settings', JSON.stringify(settings))
        setHasChanges(false)
        toast.success(t('settingsSaved'))
        setIsSaving(false)
    }

    return (
        <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general" className="gap-2">
                        <SettingsIcon className="h-4 w-4" />
                        {t('general')}
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4" />
                        {t('notifications')}
                    </TabsTrigger>
                    <TabsTrigger value="privacy" className="gap-2">
                        <Lock className="h-4 w-4" />
                        {t('privacy')}
                    </TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5" />
                                {t('language')}
                            </CardTitle>
                            <CardDescription>{t('languageDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant={settings.language === 'ar' ? 'default' : 'outline'}
                                    className="w-full justify-start"
                                    onClick={() => handleLanguageChange('ar')}
                                >
                                    {t('arabic')}
                                </Button>
                                <Button
                                    variant={settings.language === 'en' ? 'default' : 'outline'}
                                    className="w-full justify-start"
                                    onClick={() => handleLanguageChange('en')}
                                >
                                    {t('english')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sun className="h-5 w-5" />
                                {t('theme')}
                            </CardTitle>
                            <CardDescription>{t('themeDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                <Button
                                    variant={settings.theme === 'light' ? 'default' : 'outline'}
                                    className="w-full flex-col gap-2 h-auto py-3"
                                    onClick={() => handleThemeChange('light')}
                                >
                                    <Sun className="h-5 w-5" />
                                    {t('light')}
                                </Button>
                                <Button
                                    variant={settings.theme === 'dark' ? 'default' : 'outline'}
                                    className="w-full flex-col gap-2 h-auto py-3"
                                    onClick={() => handleThemeChange('dark')}
                                >
                                    <Moon className="h-5 w-5" />
                                    {t('dark')}
                                </Button>
                                <Button
                                    variant={settings.theme === 'system' ? 'default' : 'outline'}
                                    className="w-full flex-col gap-2 h-auto py-3"
                                    onClick={() => handleThemeChange('system')}
                                >
                                    <Monitor className="h-5 w-5" />
                                    {t('system')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notification Settings */}
                <TabsContent value="notifications" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                {t('notifications')}
                            </CardTitle>
                            <CardDescription>
                                إدارة تفضيلات الإشعارات الخاصة بك
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="email-notifications" className="text-base">
                                        {t('emailNotifications')}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t('emailNotificationsDesc')}
                                    </p>
                                </div>
                                <Switch
                                    id="email-notifications"
                                    checked={settings.emailNotifications}
                                    onCheckedChange={(checked) =>
                                        updateSetting('emailNotifications', checked)
                                    }
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="push-notifications" className="text-base">
                                        {t('pushNotifications')}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t('pushNotificationsDesc')}
                                    </p>
                                </div>
                                <Switch
                                    id="push-notifications"
                                    checked={settings.pushNotifications}
                                    onCheckedChange={(checked) =>
                                        updateSetting('pushNotifications', checked)
                                    }
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="task-notifications" className="text-base">
                                        {t('taskNotifications')}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t('taskNotificationsDesc')}
                                    </p>
                                </div>
                                <Switch
                                    id="task-notifications"
                                    checked={settings.taskNotifications}
                                    onCheckedChange={(checked) =>
                                        updateSetting('taskNotifications', checked)
                                    }
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="message-notifications" className="text-base">
                                        {t('messageNotifications')}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t('messageNotificationsDesc')}
                                    </p>
                                </div>
                                <Switch
                                    id="message-notifications"
                                    checked={settings.messageNotifications}
                                    onCheckedChange={(checked) =>
                                        updateSetting('messageNotifications', checked)
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Privacy Settings */}
                <TabsContent value="privacy" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5" />
                                {t('privacy')}
                            </CardTitle>
                            <CardDescription>
                                تحكم في من يمكنه رؤية معلوماتك
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="show-profile" className="text-base">
                                        {t('showProfile')}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t('showProfileDesc')}
                                    </p>
                                </div>
                                <Switch
                                    id="show-profile"
                                    checked={settings.showProfile}
                                    onCheckedChange={(checked) =>
                                        updateSetting('showProfile', checked)
                                    }
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="show-email" className="text-base">
                                        {t('showEmail')}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t('showEmailDesc')}
                                    </p>
                                </div>
                                <Switch
                                    id="show-email"
                                    checked={settings.showEmail}
                                    onCheckedChange={(checked) =>
                                        updateSetting('showEmail', checked)
                                    }
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="show-phone" className="text-base">
                                        {t('showPhone')}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t('showPhoneDesc')}
                                    </p>
                                </div>
                                <Switch
                                    id="show-phone"
                                    checked={settings.showPhone}
                                    onCheckedChange={(checked) =>
                                        updateSetting('showPhone', checked)
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Save Button - Fixed at bottom */}
            {hasChanges && (
                <div className="sticky bottom-6 mt-6">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full shadow-lg"
                        size="lg"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="me-2 h-5 w-5 animate-spin" />
                                جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <Save className="me-2 h-5 w-5" />
                                {t('saveSettings')}
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
