'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Save, Phone, Mail, MapPin, Globe, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ContactSettings {
    contact_phone: string
    contact_email: string
    contact_address_ar: string
    contact_address_en: string
    social_facebook: string
    social_instagram: string
    social_twitter: string
    social_linkedin: string
}

export function ContactSettings() {
    const [settings, setSettings] = useState<ContactSettings>({
        contact_phone: '',
        contact_email: '',
        contact_address_ar: '',
        contact_address_en: '',
        social_facebook: '',
        social_instagram: '',
        social_twitter: '',
        social_linkedin: '',
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        loadSettings()
    }, [])

    async function loadSettings() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('site_settings')
            .select('key, value')
            .in('key', [
                'contact_phone', 'contact_email', 'contact_address_ar', 'contact_address_en',
                'social_facebook', 'social_instagram', 'social_twitter', 'social_linkedin'
            ])

        if (!error && data) {
            const loaded: Partial<ContactSettings> = {}
            data.forEach((item: { key: string; value: string }) => {
                loaded[item.key as keyof ContactSettings] = item.value
            })
            setSettings(prev => ({ ...prev, ...loaded }))
        }
        setIsLoading(false)
    }

    async function saveSettings() {
        setIsSaving(true)
        const supabase = createClient()

        try {
            for (const [key, value] of Object.entries(settings)) {
                await supabase
                    .from('site_settings')
                    .upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() } as any, { onConflict: 'key' })
            }
            toast.success('تم حفظ إعدادات التواصل بنجاح')
        } catch (error) {
            toast.error('حدث خطأ أثناء حفظ الإعدادات')
        }

        setIsSaving(false)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* بيانات التواصل الأساسية */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        بيانات التواصل
                    </CardTitle>
                    <CardDescription>
                        هذه البيانات ستظهر في الصفحة الرئيسية والـ Footer
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">رقم الهاتف</Label>
                            <Input
                                id="phone"
                                value={settings.contact_phone}
                                onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                                placeholder="+20 123 456 7890"
                                dir="ltr"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">البريد الإلكتروني</Label>
                            <Input
                                id="email"
                                type="email"
                                value={settings.contact_email}
                                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                                placeholder="info@company.com"
                                dir="ltr"
                            />
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="address_ar">العنوان (عربي)</Label>
                            <Input
                                id="address_ar"
                                value={settings.contact_address_ar}
                                onChange={(e) => setSettings({ ...settings, contact_address_ar: e.target.value })}
                                placeholder="القاهرة، مصر"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address_en">العنوان (إنجليزي)</Label>
                            <Input
                                id="address_en"
                                value={settings.contact_address_en}
                                onChange={(e) => setSettings({ ...settings, contact_address_en: e.target.value })}
                                placeholder="Cairo, Egypt"
                                dir="ltr"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* روابط السوشيال ميديا */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        روابط السوشيال ميديا
                    </CardTitle>
                    <CardDescription>
                        روابط حسابات التواصل الاجتماعي الخاصة بالشركة
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="facebook">Facebook</Label>
                            <Input
                                id="facebook"
                                value={settings.social_facebook}
                                onChange={(e) => setSettings({ ...settings, social_facebook: e.target.value })}
                                placeholder="https://facebook.com/..."
                                dir="ltr"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instagram">Instagram</Label>
                            <Input
                                id="instagram"
                                value={settings.social_instagram}
                                onChange={(e) => setSettings({ ...settings, social_instagram: e.target.value })}
                                placeholder="https://instagram.com/..."
                                dir="ltr"
                            />
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="twitter">Twitter / X</Label>
                            <Input
                                id="twitter"
                                value={settings.social_twitter}
                                onChange={(e) => setSettings({ ...settings, social_twitter: e.target.value })}
                                placeholder="https://twitter.com/..."
                                dir="ltr"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="linkedin">LinkedIn</Label>
                            <Input
                                id="linkedin"
                                value={settings.social_linkedin}
                                onChange={(e) => setSettings({ ...settings, social_linkedin: e.target.value })}
                                placeholder="https://linkedin.com/company/..."
                                dir="ltr"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* زر الحفظ */}
            <div className="flex justify-end">
                <Button onClick={saveSettings} disabled={isSaving} size="lg">
                    {isSaving ? (
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="me-2 h-4 w-4" />
                    )}
                    حفظ الإعدادات
                </Button>
            </div>
        </div>
    )
}
