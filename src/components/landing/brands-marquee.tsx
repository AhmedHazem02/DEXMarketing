'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useLocale } from 'next-intl'

const BRANDS = [
    { name: 'Royal Brands',   nameAr: 'رويال براندز',   color: '#fbbf24' },
    { name: 'TechVault',      nameAr: 'تك فولت',        color: '#38bdf8' },
    { name: 'Bella Fashion',  nameAr: 'بيلا فاشون',     color: '#ec4899' },
    { name: 'Urban Fitness',  nameAr: 'أوربان فيتنس',   color: '#4ade80' },
    { name: 'EatFresh',       nameAr: 'إيت فريش',       color: '#f97316' },
    { name: 'Nova Events',    nameAr: 'نوفا إيفنتس',    color: '#a78bfa' },
    { name: 'Bloom Boutique', nameAr: 'بلوم بوتيك',     color: '#fb7185' },
    { name: 'Arabica Coffee', nameAr: 'أرابيكا كوفي',   color: '#d97706' },
    { name: 'LuxeHome',       nameAr: 'لوكس هوم',       color: '#34d399' },
    { name: 'FitZone',        nameAr: 'فت زون',         color: '#60a5fa' },
    { name: 'Skyline Dev',    nameAr: 'سكاي لاين ديف',  color: '#c084fc' },
    { name: 'Pulse Media',    nameAr: 'بالس ميديا',     color: '#f43f5e' },
]

export function BrandsMarquee() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const prefersReducedMotion = useReducedMotion()

    const loopItems = [...BRANDS, ...BRANDS]

    return (
        <section
            className="relative overflow-hidden py-8 md:py-12 lg:py-14 bg-[#022026]"
            aria-label={isAr ? 'شركاء النجاح' : 'Trusted brands'}
        >
            {/* Top & bottom lines */}
            <div className="section-divider absolute top-0 left-0 right-0" />
            <div className="section-divider absolute bottom-0 left-0 right-0" />

            <div className="container relative z-10 mx-auto px-4 sm:px-6 mb-4 md:mb-5">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <span className="section-label text-xs sm:text-sm">
                        {isAr ? 'شركاء النجاح' : 'Trusted By Leading Brands'}
                    </span>
                </motion.div>
            </div>

            {/* Fade edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 sm:w-20 md:w-36 bg-gradient-to-r from-[#022026] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 sm:w-20 md:w-36 bg-gradient-to-l from-[#022026] to-transparent" />

            <div className="overflow-hidden">
                <div
                    className={`flex items-center w-max${prefersReducedMotion ? '' : ' marquee-track'}`}
                >
                    {loopItems.map((brand, i) => (
                        <div
                            key={`${brand.name}-${i}`}
                            className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 md:gap-3 mr-2 sm:mr-3 md:mr-4 px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 rounded-full border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:border-white/[0.12] hover:bg-white/[0.04] transition-colors duration-300 cursor-default"
                        >
                            <span
                                className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full flex-shrink-0"
                                style={{
                                    backgroundColor: brand.color,
                                    boxShadow: `0 0 6px ${brand.color}70`,
                                }}
                            />
                            <span className="whitespace-nowrap text-[10px] sm:text-xs md:text-sm font-bold tracking-wide text-white/50">
                                {isAr ? brand.nameAr : brand.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
