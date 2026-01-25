import { StorageSettingsCard, ActivityLogViewer } from '@/components/admin'
import { ContactSettings } from '@/components/admin/contact-settings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Phone, Database, Activity } from 'lucide-react'
import { locales } from '@/i18n/config'

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }))
}

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">الإعدادات</h1>
                <p className="text-muted-foreground">
                    إعدادات النظام والموقع
                </p>
            </div>

            <Tabs defaultValue="contact" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
                    <TabsTrigger value="contact" className="gap-2">
                        <Phone className="h-4 w-4" />
                        بيانات التواصل
                    </TabsTrigger>
                    <TabsTrigger value="storage" className="gap-2">
                        <Database className="h-4 w-4" />
                        التخزين
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="gap-2">
                        <Activity className="h-4 w-4" />
                        سجل النشاط
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="contact">
                    <ContactSettings />
                </TabsContent>

                <TabsContent value="storage">
                    <StorageSettingsCard />
                </TabsContent>

                <TabsContent value="activity">
                    <ActivityLogViewer />
                </TabsContent>
            </Tabs>
        </div>
    )
}
