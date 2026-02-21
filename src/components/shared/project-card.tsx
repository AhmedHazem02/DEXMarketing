'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Project } from '@/lib/constants/landing'

interface ProjectCardProps {
    project: Project
    index: number
    locale: 'ar' | 'en'
    variant?: 'galaxy' | 'grid'
}

export function ProjectCard({ project, index, locale, variant = 'galaxy' }: ProjectCardProps) {
    const isAr = locale === 'ar'
    const prefersReducedMotion = useReducedMotion()

    const title = isAr ? project.titleAr : project.titleEn
    const category = isAr ? project.categoryAr : project.categoryEn

    // Galaxy variant - for bento-style grid with different sizes
    if (variant === 'galaxy') {
        const content = (
            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: index * 0.1, duration: 0.6, type: 'spring', stiffness: 100 }}
                whileHover={prefersReducedMotion ? undefined : { y: -8 }}
                className={`group relative overflow-hidden rounded-3xl glass-card ${project.span || ''}`}
            >
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-60 transition-opacity duration-500 group-hover:opacity-90`} />

                {/* Noise/texture overlay */}
                <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

                {/* Hover shine */}
                <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-12 translate-x-[-200%] transition-transform duration-700 group-hover:translate-x-[200%] pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 flex h-full flex-col justify-end p-8">
                    <div className="translate-y-4 transition-transform duration-500 group-hover:translate-y-0">
                        <span className="mb-2 inline-block rounded-full border border-white/25 bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm shadow-sm">
                            {category}
                        </span>
                        <h3 className="text-2xl font-bold text-white lg:text-3xl">
                            {title}
                        </h3>
                    </div>

                    {/* Arrow indicator */}
                    <motion.div
                        className="absolute end-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/12 text-white opacity-0 backdrop-blur-md shadow-[0_0_16px_rgba(251,191,36,0.25)] transition-all duration-300 group-hover:opacity-100 group-hover:scale-110"
                    >
                        <ArrowUpRight className="h-5 w-5" />
                    </motion.div>
                </div>
            </motion.div>
        )

        // If project has a link, wrap in Link component, otherwise just div
        return project.link ? (
            <Link href={project.link} className="block h-full">
                {content}
            </Link>
        ) : (
            content
        )
    }

    // Grid variant - for standard grid layout
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={prefersReducedMotion ? undefined : { y: -8 }}
            className="group relative aspect-[4/3] rounded-3xl overflow-hidden glass-card"
        >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-80`} />

            {/* Content Overlay */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent">
                <span className="text-xs font-semibold text-white/80 mb-2">{category}</span>
                <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <ArrowUpRight className="h-6 w-6 text-white" />
                </div>
            </div>

            {/* Link wrapper if project has a link */}
            {project.link && (
                <Link href={project.link} className="absolute inset-0 z-10">
                    <span className="sr-only">{title}</span>
                </Link>
            )}
        </motion.div>
    )
}
