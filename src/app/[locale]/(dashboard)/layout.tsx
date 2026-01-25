import { Sidebar } from '@/components/layout/sidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { locales } from '@/i18n/config'

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }))
}

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch role
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    // If no profile (first login?), assume client or handle error. 
    // For dev, if profile missing, maybe default to admin logic is dangerous.
    // We assume profile created on trigger. If not found, role is undefined.
    // Supabase text types might be inferred as string but typed strictly in our types
    // @ts-ignore
    const role = profile?.role || 'client'

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar role={role} />
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    )
}
