'use client'

import dynamic from 'next/dynamic'

const SceneCanvas = dynamic(() => import('@/components/scene/SceneCanvas'), {
    ssr: false,
})

export function GlobalBackground() {
    return (
        <div className="fixed inset-0 z-[-1] pointer-events-none">
            <SceneCanvas />
        </div>
    )
}
