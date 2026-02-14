'use client'

import { motion } from 'framer-motion'
import { useLocale } from 'next-intl'
import { ArrowUpRight, Layers } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { PROJECTS } from '@/lib/constants/landing'
import { ProjectCard } from '@/components/shared/project-card'

export function GalaxyPortfolio() {
    const locale = useLocale()
    const isAr = locale === 'ar'

    return (
        <section id="portfolio" className="relative overflow-hidden py-40">
            {/* Background */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-0 h-[1px] w-[60%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="absolute right-0 top-1/3 h-[600px] w-[600px] rounded-full bg-purple-500/[0.03] blur-[150px]" />
            </div>

            <div className="container relative z-10 mx-auto px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    className="mb-20 text-center"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]"
                    >
                        <Layers className="h-7 w-7 text-primary" />
                    </motion.div>
                    <span className="mb-4 inline-block text-sm font-bold uppercase tracking-[0.25em] text-primary">
                        {isAr ? 'سجل المهام' : 'Mission Log'}
                    </span>
                    <h2 className="text-4xl font-black md:text-6xl lg:text-7xl">
                        {isAr ? 'أعمال ' : 'Work That '}
                        <span className="bg-gradient-to-r from-primary via-yellow-300 to-orange-500 bg-clip-text text-transparent">
                            {isAr ? 'تتحدث' : 'Speaks'}
                        </span>
                    </h2>
                </motion.div>

                {/* Portfolio Grid -- Masonry-like bento */}
                <div className="grid gap-4 md:grid-cols-3 md:auto-rows-[200px] lg:auto-rows-[240px]">
                    {PROJECTS.map((project, i) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            index={i}
                            locale={locale as 'ar' | 'en'}
                            variant="galaxy"
                        />
                    ))}
                </div>

                {/* View all link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-12 text-center"
                >
                    <Link
                        href="/portfolio"
                        className="group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/40 transition-colors hover:text-primary"
                    >
                        {isAr ? 'عرض جميع الأعمال' : 'View all projects'}
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </Link>
                </motion.div>
            </div>
        </section>
    )
}
