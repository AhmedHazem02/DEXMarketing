
import { motion, useReducedMotion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import Image from 'next/image'

interface ServiceCardProps {
    item: Record<string, string>
    index: number
    isAr: boolean
    gradient: string
    accent: string
    span: string
    IconComponent: LucideIcon
}

export function ServiceCard({ item, index, isAr, gradient, accent, span, IconComponent }: ServiceCardProps) {
    const prefersReducedMotion = useReducedMotion()

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: index * 0.08, duration: 0.5 }}
            whileHover={prefersReducedMotion ? undefined : { y: -6, scale: 1.02 }}
            className={`group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm transition-colors duration-500 hover:border-white/[0.12] hover:bg-white/[0.04] ${span}`}
        >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />

            <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                    {item.image ? (
                        <div className="relative mb-5 h-12 w-12 overflow-hidden rounded-xl">
                            <Image src={item.image} alt={item.title || ''} fill className="object-cover" sizes="48px" loading="lazy" />
                        </div>
                    ) : (
                        <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] ${accent} transition-transform duration-300 group-hover:scale-110`}>
                            <IconComponent className="h-6 w-6" />
                        </div>
                    )}
                    <h3 className="mb-2 text-xl font-bold text-white">{item.title || ''}</h3>
                    <p className="text-sm leading-relaxed text-white/50">{item.description || ''}</p>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/30 transition-colors group-hover:text-primary">
                    <span>{isAr ? 'اعرف المزيد' : 'Learn more'}</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
            </div>
        </motion.div>
    )
}

interface FallbackService {
    icon: LucideIcon
    titleAr: string
    titleEn: string
    descAr: string
    descEn: string
    gradient: string
    accent: string
    span: string
}

interface FallbackServiceCardProps {
    service: FallbackService
    isAr: boolean
    index: number
}

export function FallbackServiceCard({ service, isAr, index }: FallbackServiceCardProps) {
    const prefersReducedMotion = useReducedMotion()

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: index * 0.08, duration: 0.5 }}
            whileHover={prefersReducedMotion ? undefined : { y: -6, scale: 1.02 }}
            className={`group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm transition-colors duration-500 hover:border-white/[0.12] hover:bg-white/[0.04] ${service.span}`}
        >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />

            {/* Corner glow */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-0" />

            <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                    <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] ${service.accent} transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]`}>
                        <service.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-white lg:text-2xl">
                        {isAr ? service.titleAr : service.titleEn}
                    </h3>
                    <p className="text-sm leading-relaxed text-white/50 lg:text-base">
                        {isAr ? service.descAr : service.descEn}
                    </p>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/30 transition-colors group-hover:text-primary">
                    <span>{isAr ? 'اعرف المزيد' : 'Learn more'}</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
            </div>
        </motion.div>
    )
}
