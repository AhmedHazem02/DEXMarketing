'use client'

import { motion } from 'framer-motion'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ArrowRight, ArrowLeft, Play } from 'lucide-react'
import { usePage } from '@/hooks/use-cms'
import { useState } from 'react'

// Fallback data when CMS has no content
const FALLBACK_PROJECTS = [
    { titleAr: 'حملة إطلاق منتج', titleEn: 'Product Launch Campaign', category: 'Marketing', categoryAr: 'تسويق', color: 'from-red-500 to-orange-500' },
    { titleAr: 'هوية بصرية متكاملة', titleEn: 'Full Brand Identity', category: 'Branding', categoryAr: 'برندينج', color: 'from-purple-500 to-pink-500' },
    { titleAr: 'فيديو إعلاني', titleEn: 'Commercial Video', category: 'Video', categoryAr: 'فيديو', color: 'from-cyan-500 to-blue-500' },
    { titleAr: 'موقع تجاري', titleEn: 'E-commerce Website', category: 'Web', categoryAr: 'ويب', color: 'from-green-500 to-emerald-500' },
    { titleAr: 'حملة سوشيال ميديا', titleEn: 'Social Media Campaign', category: 'Social', categoryAr: 'سوشيال', color: 'from-yellow-500 to-primary' },
    { titleAr: 'تصوير منتجات', titleEn: 'Product Photography', category: 'Photo', categoryAr: 'تصوير', color: 'from-indigo-500 to-violet-500' },
]

const GRADIENT_COLORS = [
    'from-red-500 to-orange-500',
    'from-purple-500 to-pink-500',
    'from-cyan-500 to-blue-500',
    'from-green-500 to-emerald-500',
    'from-yellow-500 to-primary',
    'from-indigo-500 to-violet-500',
]

function isVideoUrl(url?: string): boolean {
    if (!url) return false
    return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || url.includes('/video/')
}

export function PortfolioSection() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const { data: page } = usePage('portfolio')
    const [playingVideo, setPlayingVideo] = useState<string | null>(null)

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
                        cmsItems.map((item, i) => {
                            const color = GRADIENT_COLORS[i % GRADIENT_COLORS.length]
                            const hasMedia = !!item.media
                            const isVideo = isVideoUrl(item.media)
                            const isPlaying = playingVideo === item.id

                            return (
                                <motion.div
                                    key={item.id || i}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    whileHover={{ y: -8 }}
                                    className="group relative aspect-[4/3] rounded-3xl overflow-hidden cursor-pointer"
                                    onClick={() => {
                                        if (item.link) window.open(item.link, '_blank')
                                    }}
                                >
                                    {/* Background: Image, Video, or Gradient fallback */}
                                    {hasMedia && isVideo ? (
                                        isPlaying ? (
                                            <video
                                                src={item.media}
                                                className="absolute inset-0 w-full h-full object-cover"
                                                autoPlay
                                                muted
                                                loop
                                                playsInline
                                            />
                                        ) : (
                                            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-80`}>
                                                <button
                                                    className="absolute inset-0 flex items-center justify-center z-10"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setPlayingVideo(item.id || String(i))
                                                    }}
                                                >
                                                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                                                        <Play className="h-8 w-8 text-white fill-white" />
                                                    </div>
                                                </button>
                                            </div>
                                        )
                                    ) : hasMedia ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={item.media}
                                            alt={item.title || ''}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-80`} />
                                    )}

                                    {/* Content Overlay */}
                                    <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent">
                                        {item.category && (
                                            <span className="text-xs font-semibold text-white/80 mb-2">{item.category}</span>
                                        )}
                                        <h3 className="text-xl font-bold text-white">{item.title || ''}</h3>
                                        {item.description && (
                                            <p className="text-sm text-white/70 mt-1 line-clamp-2">{item.description}</p>
                                        )}
                                    </div>

                                    {/* Hover Overlay */}
                                    {!isPlaying && (
                                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                <ArrowRight className="h-6 w-6 text-white" />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )
                        })
                    ) : (
                        FALLBACK_PROJECTS.map((project, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -8 }}
                                className="group relative aspect-[4/3] rounded-3xl overflow-hidden cursor-pointer"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-80`} />
                                <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent">
                                    <span className="text-xs font-semibold text-white/80 mb-2">
                                        {isAr ? project.categoryAr : project.category}
                                    </span>
                                    <h3 className="text-xl font-bold text-white">{isAr ? project.titleAr : project.titleEn}</h3>
                                </div>
                                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <ArrowRight className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </motion.div>
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
                    <Button variant="outline" size="lg" className="rounded-full px-8">
                        {isAr ? 'عرض جميع الأعمال' : 'View All Projects'}
                        {isAr ? <ArrowLeft className="ms-2 h-4 w-4" /> : <ArrowRight className="ms-2 h-4 w-4" />}
                    </Button>
                </motion.div>
            </div>
        </section>
    )
}
