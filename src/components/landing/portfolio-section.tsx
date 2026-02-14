'use client'

import { motion } from 'framer-motion'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { PortfolioItem, FallbackPortfolioItem } from './PortfolioCards'
import { usePage } from '@/hooks/use-cms'
import { useState, useCallback } from 'react'
import { GRADIENT_COLORS } from '@/lib/constants/landing'

import { Link } from '@/i18n/navigation'

// Fallback data when CMS has no content
const FALLBACK_PROJECTS = [
    { titleAr: 'حملة إطلاق منتج', titleEn: 'Product Launch Campaign', category: 'Marketing', categoryAr: 'تسويق', color: 'from-red-500 to-orange-500' },
    { titleAr: 'هوية بصرية متكاملة', titleEn: 'Full Brand Identity', category: 'Branding', categoryAr: 'برندينج', color: 'from-purple-500 to-pink-500' },
    { titleAr: 'فيديو إعلاني', titleEn: 'Commercial Video', category: 'Video', categoryAr: 'فيديو', color: 'from-cyan-500 to-blue-500' },
    { titleAr: 'موقع تجاري', titleEn: 'E-commerce Website', category: 'Web', categoryAr: 'ويب', color: 'from-green-500 to-emerald-500' },
    { titleAr: 'حملة سوشيال ميديا', titleEn: 'Social Media Campaign', category: 'Social', categoryAr: 'سوشيال', color: 'from-yellow-500 to-primary' },
    { titleAr: 'تصوير منتجات', titleEn: 'Product Photography', category: 'Photo', categoryAr: 'تصوير', color: 'from-indigo-500 to-violet-500' },
] as const

export function PortfolioSection() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const { data: page } = usePage('portfolio')
    const [playingVideo, setPlayingVideo] = useState<string | null>(null)

    const handlePlayVideo = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setPlayingVideo(id)
    }, [])

    // Try to read CMS items
    const content = isAr ? page?.content_ar : page?.content_en
    const cmsItems = (content && typeof content === 'object' && 'items' in (content as Record<string, unknown>))
        ? ((content as Record<string, unknown>).items as Array<Record<string, string>>)
        : null

    const hasCmsData = cmsItems && cmsItems.length > 0

    return (
        <section id="portfolio" className="py-32 relative overflow-hidden bg-gradient-to-b from-background to-primary/5">
            <div className="container mx-auto px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                        {isAr ? 'أعمالنا' : 'Our Work'}
                    </span>
                    <h2 className="text-4xl md:text-6xl font-black mb-6">
                        {isAr ? 'مشاريع ' : 'Projects '}
                        <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                            {isAr ? 'ملهمة' : 'That Inspire'}
                        </span>
                    </h2>
                </motion.div>

                {/* Portfolio Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {hasCmsData ? (
                        cmsItems.map((item, i) => (
                            <PortfolioItem
                                key={item.id || i}
                                item={item}
                                index={i}

                                isPlaying={playingVideo === item.id}
                                onPlay={(e) => handlePlayVideo(item.id || String(i), e)}
                                gradientColor={GRADIENT_COLORS[i % GRADIENT_COLORS.length]}
                            />
                        ))
                    ) : (
                        FALLBACK_PROJECTS.map((project, i) => (
                            <FallbackPortfolioItem
                                key={i}
                                project={project}
                                index={i}
                                isAr={isAr}
                            />
                        ))
                    )}
                </div>

                {/* View All Button */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center mt-12"
                >
                    <Link href="/portfolio">
                        <Button variant="outline" size="lg" className="rounded-full px-8">
                            {isAr ? 'عرض جميع الأعمال' : 'View All Projects'}
                            {isAr ? <ArrowLeft className="ms-2 h-4 w-4" /> : <ArrowRight className="ms-2 h-4 w-4" />}
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    )
}
