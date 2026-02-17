import {
  HeroSection,
  AboutSection,
  ServicesSection,
  StatsSection,
  PortfolioSection,
  TestimonialsSection,
  ContactSection,
  CTASection,
} from '@/components/landing'
import { Navbar, Footer } from '@/components/landing'
import { SiteSettingsProvider } from '@/components/providers/site-settings-provider'
import { getSiteSettings } from '@/lib/actions/get-site-settings'
import { locales } from '@/i18n/config'
import { setRequestLocale } from 'next-intl/server'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const settings = await getSiteSettings()

  return (
    <SiteSettingsProvider settings={settings}>
      <main className="min-h-screen bg-[#022026] text-white overflow-x-hidden">
        <Navbar />
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <StatsSection />
        <PortfolioSection />
        <TestimonialsSection />
        <ContactSection />
        <CTASection />
        <Footer />
      </main>
    </SiteSettingsProvider>
  )
}
