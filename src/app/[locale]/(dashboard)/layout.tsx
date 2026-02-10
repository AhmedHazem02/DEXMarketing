import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { locales } from '@/i18n/config'

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }))
}

/** Map each role to its allowed URL prefix(es) */
const ROLE_PATH_MAP: Record<string, string[]> = {
    admin: ['/admin'],
    client: ['/client'],
    team_leader: ['/team-leader'],
    creator: ['/creator'],
    accountant: ['/accountant'],
    videographer: ['/videographer'],
    editor: ['/editor'],
    photographer: ['/photographer'],
}

/** The default landing path for each role */
const ROLE_HOME: Record<string, string> = {
    admin: '/admin',
    client: '/client',
    team_leader: '/team-leader',
    creator: '/creator',
    accountant: '/accountant',
    videographer: '/videographer',
    editor: '/editor',
    photographer: '/photographer',
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

    // Fetch role & department
    const { data: profile } = await supabase
        .from('users')
        .select('role, department')
        .eq('id', user.id)
        .single()

    const role = ((profile as any)?.role || 'client') as string
    const department = (profile as any)?.department || null
    const normalizedRole = role.toLowerCase().trim()

    // Get current path for route protection
    const headersList = await headers()
    const pathname = headersList.get('x-pathname') || ''

    // Strip locale prefix to get the logical path
    const logicalPath = pathname.replace(/^\/(en|ar)/, '') || '/'

    // Admin can access everything
    if (normalizedRole !== 'admin') {
        const allowedPrefixes = ROLE_PATH_MAP[normalizedRole] || []
        const isAllowed = allowedPrefixes.some(prefix => logicalPath.startsWith(prefix))

        if (!isAllowed) {
            redirect(ROLE_HOME[normalizedRole] || '/client')
        }
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar role={role} department={department} />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header user={user} role={role} department={department} />
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
