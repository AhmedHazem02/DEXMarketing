'use client'

import { useLocale } from 'next-intl'
import { Search, AlertCircle, CheckCircle2, Database, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function DebugSchedulesPage() {
    const locale = useLocale()
    const isAr = locale === 'ar'

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold">
                        {isAr ? 'أداة تشخيص الجدولات' : 'Schedule Debug Tool'}
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        {isAr ? 'اكتشف لماذا لا تظهر الجدولات للعميل' : 'Find why schedules don\'t show for client'}
                    </p>
                </div>
            </div>

            {/* Coming Soon Notice */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                            <Lock className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">
                                {isAr ? 'سيتم تفعيل هذه الميزة قريباً' : 'Coming Soon'}
                            </h2>
                            <p className="text-muted-foreground max-w-md">
                                {isAr 
                                    ? 'نعمل حالياً على تطوير أداة التشخيص المتقدمة. سيتم إطلاقها قريباً!' 
                                    : 'We are currently developing this advanced debugging tool. It will be launched soon!'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Search (Disabled) */}
            <Card className="opacity-60">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        {isAr ? 'ابحث بالبريد الإلكتروني' : 'Search by Email'}
                    </CardTitle>
                    <CardDescription>
                        {isAr ? 'أدخل البريد الإلكتروني للعميل لفحص حسابه وجدولاته' : 'Enter client email to check their account and schedules'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            type="email"
                            placeholder="client@example.com"
                            disabled
                            className="rounded-xl"
                        />
                        <Button
                            disabled
                            className="rounded-xl"
                        >
                            {isAr ? 'فحص' : 'Debug'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Preview Cards (Disabled) */}
            <div className="space-y-4 opacity-60">
                {/* Success Messages Preview */}
                <Card className="border-emerald-500/30 bg-emerald-500/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            {isAr ? 'نجح ✅' : 'Success ✅'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-emerald-700 dark:text-emerald-300 font-mono bg-emerald-500/10 px-3 py-2 rounded-lg">
                            {isAr ? '✅ سيظهر هنا نتائج الفحص الناجحة' : '✅ Successful checks will appear here'}
                        </div>
                    </CardContent>
                </Card>

                {/* Problems Preview */}
                <Card className="border-red-500/30 bg-red-500/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertCircle className="h-4 w-4" />
                            {isAr ? 'مشاكل وجدناها ❌' : 'Problems Found ❌'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-red-700 dark:text-red-300 font-mono bg-red-500/10 px-3 py-2 rounded-lg">
                            {isAr ? '❌ ستظهر هنا المشاكل المكتشفة والحلول المقترحة' : '❌ Detected problems and solutions will appear here'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Instructions */}
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className="text-base">
                        {isAr ? '📖 كيف تستخدم الأداة' : '📖 How to Use'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2 text-muted-foreground">
                    <p>1. {isAr ? 'أدخل البريد الإلكتروني للعميل' : 'Enter the client\'s email address'}</p>
                    <p>2. {isAr ? 'اضغط "فحص" لتشغيل التشخيص' : 'Click "Debug" to run diagnostics'}</p>
                    <p>3. {isAr ? 'راجع النتائج والحلول المقترحة' : 'Review results and suggested solutions'}</p>
                    <p className="pt-2 text-xs font-mono bg-muted px-2 py-1 rounded">
                        {isAr ? '💡 نصيحة: الأداة تفحص user_id، client_id، والجدولات المرتبطة' : '💡 Tip: Tool checks user_id, client_id, and related schedules'}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
