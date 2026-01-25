import { HeroSection, ServicesSection, PortfolioSection, TestimonialsSection, CTASection } from '@/components/landing'
import { locales } from '@/i18n/config'
import { setRequestLocale } from 'next-intl/server'

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }))
}

export const dynamic = 'force-dynamic'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    setRequestLocale(locale)

    return (
        <>
            <HeroSection />
            <ServicesSection />
            <PortfolioSection />
            <TestimonialsSection />
            <CTASection />
        </>
    )
}
