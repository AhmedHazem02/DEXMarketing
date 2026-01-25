import { Navbar, Footer } from '@/components/landing'
import { SiteSettingsProvider } from '@/components/providers/site-settings-provider'
import { getSiteSettings } from '@/lib/actions/get-site-settings'
import { setRequestLocale } from 'next-intl/server'

export default async function WebsiteLayout({
    children,
    params
}: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    setRequestLocale(locale)

    const settings = await getSiteSettings()

    return (
        <SiteSettingsProvider settings={settings}>
            <main className="min-h-screen bg-background overflow-hidden">
                <Navbar />
                {children}
                <Footer />
            </main>
        </SiteSettingsProvider>
    )
}
