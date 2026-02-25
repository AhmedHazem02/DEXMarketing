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
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Organization',
                        name: 'DEX Marketing',
                        url: 'https://dex-erp.com',
                        description: 'Digital marketing and content production agency',
                        contactPoint: {
                            '@type': 'ContactPoint',
                            contactType: 'customer service',
                            email: settings.contact_email || 'info@dex-advertising.com',
                            telephone: settings.contact_phone || '+20 123 456 7890',
                        },
                        sameAs: [
                            settings.social_facebook,
                            settings.social_instagram,
                            settings.social_twitter,
                            settings.social_linkedin,
                        ].filter(Boolean),
                    }),
                }}
            />
            <main className="min-h-screen bg-background overflow-x-hidden">
                <Navbar />
                {children}
                <Footer />
            </main>
        </SiteSettingsProvider>
    )
}
