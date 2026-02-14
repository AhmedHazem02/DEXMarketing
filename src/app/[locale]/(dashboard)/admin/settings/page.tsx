import { StorageSettingsCard, ActivityLogViewer, PageHeader } from '@/components/admin'
import { ContactSettings } from '@/components/admin/contact-settings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Phone, Database, Activity } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="الإعدادات"
                description="إعدادات النظام والموقع"
            />

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
