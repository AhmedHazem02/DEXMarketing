'use client'

import { HeroOverlay } from './hero-overlay'
import { CustomCursor } from './custom-cursor'

export function HeroSection() {
    return (
        <section className="relative min-h-[100dvh] w-full overflow-hidden bg-[#050505]">
            {/* Custom red-dot cursor — covers entire page via fixed positioning */}
            <CustomCursor />
            {/* Bottom fade to next section */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 z-[2] bg-gradient-to-t from-[#050505] to-transparent" />

            {/* Content — Hero3D canvas lives inside the right column of HeroOverlay */}
            <div className="relative z-10 w-full h-full">
                <HeroOverlay />
            </div>
        </section>
    )
}
