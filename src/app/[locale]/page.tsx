import { Navbar, HeroSection, ServicesSection, PortfolioSection, TestimonialsSection, CTASection, Footer } from '@/components/landing'
import { SiteSettingsProvider } from '@/components/providers/site-settings-provider'
import { getSiteSettings } from '@/lib/actions/get-site-settings'
import { locales } from '@/i18n/config'
import { setRequestLocale } from 'next-intl/server'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export const dynamic = 'force-dynamic'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  // Fetch site settings from database
  const settings = await getSiteSettings()

  return (
    <SiteSettingsProvider settings={settings}>
      <main className="min-h-screen bg-background overflow-hidden">
        <Navbar />
        <HeroSection />
        <ServicesSection />
        <PortfolioSection />
        <TestimonialsSection />
        <CTASection />
        <Footer />
      </main>
    </SiteSettingsProvider>
  )
}
