import { PackagesManager } from '@/components/treasury/packages-manager'

export const dynamic = 'force-dynamic'

export default function PackagesPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <PackagesManager />
        </div>
    )
}
