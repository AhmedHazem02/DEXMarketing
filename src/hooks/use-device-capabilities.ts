'use client'

import { useSyncExternalStore } from 'react'

type GPUTier = 'high' | 'mid' | 'low' | 'potato'

interface DeviceCapabilities {
    tier: GPUTier
    isMobile: boolean
}

const DEFAULT_CAPS: DeviceCapabilities = { tier: 'mid', isMobile: false }

// Compute once at module level — device capabilities never change at runtime
let _cached: DeviceCapabilities | null = null

function getCapabilities(): DeviceCapabilities {
    if (_cached) return _cached

    if (typeof window === 'undefined') {
        return DEFAULT_CAPS // SSR fallback
    }

    // WebGL check
    let hasWebGL = true
    try {
        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
        if (!gl) hasWebGL = false
    } catch {
        hasWebGL = false
    }

    if (!hasWebGL) {
        _cached = { tier: 'potato', isMobile: false }
        return _cached
    }

    const cores = navigator.hardwareConcurrency || 2
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const memory = (navigator as any).deviceMemory || 4
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

    let tier: GPUTier = 'mid'
    if (isMobile && memory < 4) {
        tier = 'potato'
    } else if (cores <= 2 && memory <= 4) {
        tier = 'low'
    } else if (cores <= 4 && memory <= 8) {
        tier = 'mid'
    } else {
        tier = 'high'
    }

    _cached = { tier, isMobile }
    return _cached
}

// No-op subscribe — capabilities are static, never change
const subscribe = () => () => {}

export function useDeviceCapabilities(): DeviceCapabilities {
    return useSyncExternalStore(
        subscribe,
        getCapabilities,
        () => DEFAULT_CAPS // Server snapshot
    )
}
