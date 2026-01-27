import { getTranslations } from 'next-intl/server'
import { setRequestLocale } from 'next-intl/server'
import { Navbar, Footer } from '@/components/landing'
import { PortfolioSection } from '@/components/landing/portfolio-section'
import { CTASection } from '@/components/landing/cta-section'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
    const params = await props.params;
    const { locale } = params;
    const t = await getTranslations({ locale, namespace: 'common' })
    return {
        title: t('portfolio') + ' - DEX ERP',
    }
}

export default async function PortfolioPage(props: { params: Promise<{ locale: string }> }) {
    const params = await props.params;
    const { locale } = params;
    setRequestLocale(locale)
    const isAr = locale === 'ar'

    return (
        <main className="min-h-screen bg-background overflow-hidden font-sans">
            <Navbar />

            {/* Page Header */}
            <div className="pt-32 pb-20 bg-[#020617] relative text-white text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-[#000000] via-[#0f172a] to-blue-900/20 opacity-90" />
                <div className="container relative z-10 px-6">
                    <h1 className="text-4xl md:text-6xl font-black mb-6">
                        {isAr ? 'أعمالنا' : 'Our Portfolio'}
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        {isAr
                            ? 'تشكيلة مختارة من المشاريع التي قمنا بتنفيذها لشركاء النجاح.'
                            : 'A curated selection of projects we delivered for our success partners.'}
                    </p>
                </div>
            </div>

            <PortfolioSection />

            <div className="py-20 bg-background text-center">
                <div className="container mx-auto px-6">
                    <p className="text-muted-foreground mb-8">
                        {isAr ? 'هل تريد رؤية المزيد؟ تواصل معنا لعرض ملف أعمالنا الكامل.' : 'Want to see more? Contact us for our full portfolio deck.'}
                    </p>
                </div>
            </div>

            <CTASection />
            <Footer />
        </main>
    )
}
