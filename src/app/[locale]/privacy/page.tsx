import { getTranslations } from 'next-intl/server'
import { setRequestLocale } from 'next-intl/server'
import { Navbar, Footer } from '@/components/landing'
import { createClient } from '@/lib/supabase/server'
import { ShieldCheck, Calendar } from 'lucide-react'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
    const params = await props.params;
    const { locale } = params;

    // Fetch dynamic title if needed, or stick to static for SEO consistency
    const isAr = locale === 'ar'
    return {
        title: (isAr ? 'سياسة الخصوصية' : 'Privacy Policy') + ' - DEX ERP',
        description: isAr ? 'سياسة الخصوصية وكيفية تعاملنا مع بياناتك في DEX ERP' : 'Privacy Policy and how we handle your data at DEX ERP',
    }
}

export default async function PrivacyPage(props: { params: Promise<{ locale: string }> }) {
    const params = await props.params;
    const { locale } = params;
    setRequestLocale(locale)
    const isAr = locale === 'ar'

    // Fetch dynamic content
    const supabase = await createClient()
    const { data: pageData } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', 'privacy')
        .single()

    const data: any = pageData
    const content = isAr ? data?.content_ar : data?.content_en
    const title = isAr ? 'سياسة الخصوصية' : 'Privacy Policy'

    // Default Fallback Content
    const pageContent = {
        title: content?.title || title,
        body: content?.content || (isAr
            ? 'خصوصيتك مهمة جداً بالنسبة لنا. توضح هذه السياسة كيفية جمع واستخدام وحماية بياناتك...\n\n(هذا المحتوى افتراضي، يرجى تحديثه من لوحة التحكم)'
            : 'Your privacy is critically important to us. This policy explains how we collect, use, and protect your data...\n\n(This is default content, please update from admin panel)'),
        lastUpdated: content?.last_updated || new Date().getFullYear().toString()
    }

    return (
        <main className="min-h-screen bg-background font-sans">
            <Navbar />

            {/* Page Header */}
            <div className="pt-32 pb-16 bg-[#020617] relative text-white text-center">
                <div className="absolute inset-0 bg-gradient-to-bl from-[#0f172a] via-[#000000] to-primary/20 opacity-90" />
                <div className="container relative z-10 px-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-primary/30">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black mb-4">
                        {pageContent.title}
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{isAr ? 'آخر تحديث:' : 'Last Updated:'} {pageContent.lastUpdated}</span>
                    </div>
                </div>
            </div>

            <section className="py-20 bg-background">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-sm">
                        <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {pageContent.body}
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
