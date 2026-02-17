'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Loader2, Users as UsersIcon } from 'lucide-react'
import { ReadOnlyScheduleView } from '@/components/schedule'
import { useClientProfile } from '@/hooks/use-client-portal'
import { useCurrentUser } from '@/hooks/use-users'
import { useClients } from '@/hooks/use-clients'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export default function ClientSchedulePage() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const { data: user, isLoading: userLoading } = useCurrentUser()
    const { data: clientProfile, isLoading: profileLoading } = useClientProfile(user?.id || '')
    const { data: clients, isLoading: clientsLoading } = useClients()

    const [selectedClientId, setSelectedClientId] = useState<string>('')

    const isLoading = userLoading || profileLoading

    if (isLoading || !clientProfile) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // Use selected client or default to current client profile
    const displayClientId = selectedClientId || clientProfile.id

    return (
        <div className="p-4 sm:p-6 space-y-4">
            {/* Client Filter */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex items-center gap-2 min-w-fit">
                    <UsersIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">
                        {isAr ? 'العميل:' : 'Client:'}
                    </span>
                </div>
                <Select
                    value={displayClientId}
                    onValueChange={setSelectedClientId}
                >
                    <SelectTrigger className="w-full sm:w-[280px]">
                        <SelectValue placeholder={isAr ? 'اختر عميل' : 'Select client'} />
                    </SelectTrigger>
                    <SelectContent>
                        {/* Current client as default */}
                        <SelectItem value={clientProfile.id}>
                            {clientProfile.company || clientProfile.name || (isAr ? 'الحساب الحالي' : 'Current Account')}
                        </SelectItem>
                        
                        {clientsLoading ? (
                            <div className="flex items-center justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        ) : (
                            clients
                                ?.filter(c => c.id !== clientProfile.id)
                                .map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.company || client.name}
                                    </SelectItem>
                                ))
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* Schedule View */}
            <ReadOnlyScheduleView
                clientId={displayClientId}
                title={isAr ? 'جدول المواعيد' : 'Appointments Schedule'}
            />
        </div>
    )
}
