import { getTranslations } from 'next-intl/server'
import { setRequestLocale } from 'next-intl/server'
import { Navbar, Footer } from '@/components/landing'
import { createClient } from '@/lib/supabase/server'
import { Target, Eye, BookOpen } from 'lucide-react'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
    const params = await props.params;
    const { locale } = params;
    const t = await getTranslations({ locale, namespace: 'common' })
    return {
        title: (locale === 'ar' ? 'من نحن' : 'About Us') + ' - DEX ERP',
    }
}

export default async function AboutPage(props: { params: Promise<{ locale: string }> }) {
    const params = await props.params;
    const { locale } = params;
    setRequestLocale(locale)
    const isAr = locale === 'ar'

    // Fetch dynamic content
    const supabase = await createClient()
    const { data: pageData } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', 'about')
        .single()

    const data: any = pageData
    const content = isAr ? data?.content_ar : data?.content_en

    // Default Fallbacks
    const aboutContent = {
        mission: content?.mission || (isAr ? 'نحن نسعى لتقديم أفضل الحلول البرمجية...' : 'We strive to provide the best software solutions...'),
        vision: content?.vision || (isAr ? 'أن نكون الشركة الرائدة في مجال التكنولوجيا...' : 'To be the leading technology company...'),
        story: content?.story || (isAr ? 'بدأت رحلتنا بطموح صغير...' : 'Our journey started with a small ambition...'),
    }

    return (
        <main className="min-h-screen bg-background overflow-hidden font-sans">
            <Navbar />

            {/* Page Header */}
            <div className="pt-32 pb-20 bg-[#020617] relative text-white text-center">
                <div className="absolute inset-0 bg-gradient-to-bl from-[#0f172a] via-[#000000] to-primary/20 opacity-90" />
                <div className="container relative z-10 px-6">
                    <h1 className="text-4xl md:text-6xl font-black mb-6">
                        {isAr ? 'من نحن' : 'About Us'}
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        {isAr
                            ? 'تعرف على قصتنا ورؤيتنا للمستقبل.'
                            : 'Learn about our story and our vision for the future.'}
                    </p>
                </div>
            </div>

            <section className="py-24 bg-background">
                <div className="container mx-auto px-6">
                    <div className="space-y-24">

                        {/* Our Story */}
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="order-2 lg:order-1 space-y-6">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold">
                                    <BookOpen className="w-5 h-5" />
                                    {isAr ? 'قصتنا' : 'Our Story'}
                                </div>
                                <h2 className="text-3xl font-bold leading-tight">
                                    {isAr ? 'سنوات من الخبرة والابتكار' : 'Years of Experience and Innovation'}
                                </h2>
                                <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {aboutContent.story}
                                </p>
                            </div>
                            <div className="order-1 lg:order-2 bg-gradient-to-br from-primary/20 to-orange-500/20 rounded-3xl h-[400px] flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
                                {/* Placeholder Graphic */}
                                <div className="text-9xl opacity-20 select-none">DEX</div>
                            </div>
                        </div>

                        {/* Mission & Vision */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-card p-8 rounded-3xl border border-border hover:border-primary/50 transition-colors">
                                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6">
                                    <Target className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{isAr ? 'مهمتنا' : 'Our Mission'}</h3>
                                <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-wrap">
                                    {aboutContent.mission}
                                </p>
                            </div>

                            <div className="bg-card p-8 rounded-3xl border border-border hover:border-primary/50 transition-colors">
                                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-6">
                                    <Eye className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{isAr ? 'رؤيتنا' : 'Our Vision'}</h3>
                                <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-wrap">
                                    {aboutContent.vision}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
