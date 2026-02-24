import nextDynamic from 'next/dynamic'

const AdvancesPageClient = nextDynamic(
    () => import('@/components/admin/advances-page').then(mod => ({ default: mod.AdvancesPageClient })),
    { loading: () => <div className="animate-pulse space-y-4"><div className="h-10 bg-muted rounded" /><div className="h-96 bg-muted rounded" /></div> }
)

export const dynamic = 'force-dynamic'

export default function AdvancesPage() {
    return <AdvancesPageClient />
}
