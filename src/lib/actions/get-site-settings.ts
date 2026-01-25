export interface SiteSettings {
    theme?: {
        primary: string
        background: string
        accent: string
    }
    site_name?: string
    site_logo?: string
    contact_phone?: string
    contact_email?: string
    contact_address_ar?: string
    contact_address_en?: string
    social_facebook?: string
    social_instagram?: string
    social_twitter?: string
    social_linkedin?: string
}

// Default settings - will be used until DB connection is fixed
const defaultSettings: SiteSettings = {
    site_name: 'DEX Advertising',
    contact_phone: '+20 123 456 7890',
    contact_email: 'info@dex-advertising.com',
    contact_address_ar: 'القاهرة، مصر',
    contact_address_en: 'Cairo, Egypt',
    social_facebook: 'https://facebook.com/dexadvertising',
    social_instagram: 'https://instagram.com/dexadvertising',
    social_twitter: 'https://twitter.com/dexadvertising',
    social_linkedin: 'https://linkedin.com/company/dexadvertising',
    theme: {
        primary: '#FFD700',
        background: '#0A1628',
        accent: '#00D4FF'
    }
}

export async function getSiteSettings(): Promise<SiteSettings> {
    // Return default settings for now
    // TODO: Fix RLS policy infinite recursion in Supabase dashboard
    // The issue is in the "users" table RLS policy that references itself
    return defaultSettings
}

// Export defaults for components that need immediate access
export { defaultSettings }
