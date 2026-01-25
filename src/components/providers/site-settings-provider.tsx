'use client'

import { createContext, useContext, ReactNode } from 'react'
import type { SiteSettings } from '@/lib/actions/get-site-settings'

const SiteSettingsContext = createContext<SiteSettings>({})

export function SiteSettingsProvider({
    children,
    settings
}: {
    children: ReactNode
    settings: SiteSettings
}) {
    return (
        <SiteSettingsContext.Provider value={settings}>
            {children}
        </SiteSettingsContext.Provider>
    )
}

export function useSiteSettingsContext() {
    return useContext(SiteSettingsContext)
}
