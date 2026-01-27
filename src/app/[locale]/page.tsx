import { Navbar, HeroSection, ServicesSection, PortfolioSection, TestimonialsSection, CTASection, Footer } from '@/components/landing'
import { SiteSettingsProvider } from '@/components/providers/site-settings-provider'
import { getSiteSettings } from '@/lib/actions/get-site-settings'
import { locales } from '@/i18n/config'
import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export const dynamic = 'force-dynamic'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  // Fetch site settings from database
  const settings = await getSiteSettings()

  // Fetch User & Role Server-Side to prevent flicker
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role = ''
  if (user) {
    // Check metadata first
    role = user.user_metadata?.role
    if (!role) {
      // Check DB
      const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
      // @ts-ignore
      if (data) role = data.role
    }
  }

  return (
    <SiteSettingsProvider settings={settings}>
      <main className="min-h-screen bg-background overflow-hidden">
        <Navbar initialUser={user} initialRole={role} />
        <HeroSection />
        <ServicesSection />
        <PortfolioSection />
        <TestimonialsSection />
        <CTASection />
        <Footer initialUser={user} initialRole={role} />
      </main>
    </SiteSettingsProvider>
  )
}
