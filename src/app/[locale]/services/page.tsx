import { getTranslations } from 'next-intl/server'
import { setRequestLocale } from 'next-intl/server'
import { Navbar, Footer } from '@/components/landing'
import { ServicesSection } from '@/components/landing/services-section'
import { CTASection } from '@/components/landing/cta-section'
import { Check } from 'lucide-react'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
    const params = await props.params;
    const { locale } = params;
    const t = await getTranslations({ locale, namespace: 'common' })
    return {
        title: t('services') + ' - DEX ERP',
    }
}

export default async function ServicesPage(props: { params: Promise<{ locale: string }> }) {
    const params = await props.params;
    const { locale } = params;
    setRequestLocale(locale)
    const isAr = locale === 'ar'

    // Additional detailed content for services page
    // This could come from CMS later
    const features = [
        { title: isAr ? 'تحليل السوق' : 'Market Analysis', desc: isAr ? 'ندرس منافسيك وجمهورك المستهدف بدقة.' : 'We analyze your competitors and target audience.' },
        { title: isAr ? 'استراتيجية مخصصة' : 'Custom Strategy', desc: isAr ? 'نصمم خطة عمل تناسب أهدافك وميزانيتك.' : 'We tailor a plan to fit your goals and budget.' },
        { title: isAr ? 'تنفيذ احترافي' : 'Pro Execution', desc: isAr ? 'فريق من الخبراء ينفذ كل خطوة بإتقان.' : 'Expert team executing every step flawlessly.' },
        { title: isAr ? 'قياس النتائج' : 'Result Tracking', desc: isAr ? 'تقارير دورية وشفافة عن الأداء.' : 'Regular transparent performance reports.' },
    ]

    return (
        <main className="min-h-screen bg-background overflow-hidden font-sans">
            <Navbar />

            {/* Page Header */}
            <div className="pt-32 pb-20 bg-[#020617] relative text-white text-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#000000] via-[#0f172a] to-[#1e293b] opacity-90" />
                <div className="container relative z-10 px-6">
                    <h1 className="text-4xl md:text-6xl font-black mb-6">
                        {isAr ? 'خدماتنا' : 'Our Services'}
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        {isAr
                            ? 'نقدم مجموعة متكاملة من الحلول الرقمية لمساعدة عملك على النمو والتوسع.'
                            : 'We provide a comprehensive suite of digital solutions to help your business grow and scale.'}
                    </p>
                </div>
            </div>

            <ServicesSection />

            {/* Why Choose Us */}
            <section className="py-24 bg-card">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">{isAr ? 'لماذا تختار DEX؟' : 'Why Choose DEX?'}</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feat, i) => (
                            <div key={i} className="bg-background p-6 rounded-2xl border border-border/50 hover:border-primary/50 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                    <Check className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{feat.title}</h3>
                                <p className="text-muted-foreground">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <CTASection />
            <Footer />
        </main>
    )
}
