import type { Metadata } from 'next'
import {
    HeroSection,
    AboutSection,
    ServicesSection,
    StatsSection,
    PortfolioSection,
    TestimonialsSection,
    ContactSection,
    CTASection,
    BrandsMarquee,
    ProcessSection,
} from '@/components/landing'
import { setRequestLocale } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'DEX Marketing - Digital Marketing & Content Production Agency',
    description: 'Digital marketing and content production agency',
    alternates: {
        canonical: '/',
    },
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    setRequestLocale(locale)

    return (
        <>
            <HeroSection />
            <BrandsMarquee />
            <StatsSection />
            <AboutSection />
            <ServicesSection />
            <ProcessSection />
            <PortfolioSection />
            <TestimonialsSection />
            <CTASection />
            <ContactSection />
        </>
    )
}
