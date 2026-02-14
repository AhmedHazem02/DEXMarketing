'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useLocale } from 'next-intl'

const BRANDS = [
    'Royal Brands', 'TechVault', 'Bella Fashion', 'Urban Fitness', 'EatFresh',
    'Nova Events', 'Bloom Boutique', 'Arabica Coffee', 'LuxeHome', 'FitZone',
    'Skyline Dev', 'Pulse Media',
]

export function BrandsMarquee() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const prefersReducedMotion = useReducedMotion()

    const doubled = [...BRANDS, ...BRANDS]

    return (
        <section className="relative overflow-hidden border-y border-white/[0.04] py-16">
            <div className="container mx-auto px-6">
                <p className="mb-10 text-center text-xs font-bold uppercase tracking-[0.3em] text-white/20">
                    {isAr ? 'شركاء النجاح' : 'Trusted By Leading Brands'}
                </p>
            </div>

            {/* Fade edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#003E44] to-transparent md:w-40" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#003E44] to-transparent md:w-40" />

            <div className="overflow-hidden">
                <motion.div
                    className="flex items-center gap-16"
                    animate={prefersReducedMotion ? undefined : { x: isAr ? ['0%', '50%'] : ['0%', '-50%'] }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                >
                    {doubled.map((brand, i) => (
                        <span
                            key={`${brand}-${i}`}
                            className="flex-shrink-0 whitespace-nowrap text-2xl font-black tracking-tight text-white/[0.07] transition-colors duration-300 hover:text-white/20 md:text-3xl"
                        >
                            {brand}
                        </span>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
