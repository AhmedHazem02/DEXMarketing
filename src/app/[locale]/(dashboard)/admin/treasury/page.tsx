import nextDynamic from 'next/dynamic'

const TreasuryPageClient = nextDynamic(
    () => import('@/components/treasury/treasury-page-client').then(mod => ({ default: mod.TreasuryPageClient })),
    { loading: () => <div className="animate-pulse space-y-4"><div className="h-10 bg-muted rounded" /><div className="h-96 bg-muted rounded" /></div> }
)

export const dynamic = 'force-dynamic'

export default function TreasuryPage() {
    return <TreasuryPageClient />
}
