import { Navbar, HeroSection, ServicesSection, GalaxyPortfolio, TestimonialsSection, CTASection, Footer } from '@/components/landing'
import { CustomCursor } from '@/components/ui/custom-cursor'
import { SiteSettingsProvider } from '@/components/providers/site-settings-provider'
import { getSiteSettings } from '@/lib/actions/get-site-settings'
import { locales } from '@/i18n/config'
import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}



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
    // Always check DB for accurate role on the server
    const { data } = await supabase.from('users').select('role').eq('id', user.id).single()

    if (data) {
      role = (data as any).role
    } else {
      // Fallback to metadata if DB lookup fails
      role = user.user_metadata?.role || ''
    }
  }

  return (
    <SiteSettingsProvider settings={settings}>
      <main className="min-h-screen bg-background overflow-hidden">
        <Navbar initialUser={user} initialRole={role} />
        <CustomCursor />
        <HeroSection />
        <ServicesSection />
        <GalaxyPortfolio />
        <TestimonialsSection />
        <CTASection />
        <Footer initialUser={user} initialRole={role} />
      </main>
    </SiteSettingsProvider>
  )
}
