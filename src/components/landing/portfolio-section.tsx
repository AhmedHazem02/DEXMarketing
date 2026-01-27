'use client'

import { motion } from 'framer-motion'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ArrowRight, ArrowLeft } from 'lucide-react'

export function PortfolioSection() {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const projects = [
        { titleAr: 'حملة إطلاق منتج', titleEn: 'Product Launch Campaign', category: isAr ? 'تسويق' : 'Marketing', color: 'from-red-500 to-orange-500' },
        { titleAr: 'هوية بصرية متكاملة', titleEn: 'Full Brand Identity', category: isAr ? 'برندينج' : 'Branding', color: 'from-purple-500 to-pink-500' },
        { titleAr: 'فيديو إعلاني', titleEn: 'Commercial Video', category: isAr ? 'فيديو' : 'Video', color: 'from-cyan-500 to-blue-500' },
        { titleAr: 'موقع تجاري', titleEn: 'E-commerce Website', category: isAr ? 'ويب' : 'Web', color: 'from-green-500 to-emerald-500' },
        { titleAr: 'حملة سوشيال ميديا', titleEn: 'Social Media Campaign', category: isAr ? 'سوشيال' : 'Social', color: 'from-yellow-500 to-primary' },
        { titleAr: 'تصوير منتجات', titleEn: 'Product Photography', category: isAr ? 'تصوير' : 'Photo', color: 'from-indigo-500 to-violet-500' },
    ]

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
                    {projects.map((project, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -8 }}
                            className="group relative aspect-[4/3] rounded-3xl overflow-hidden cursor-pointer"
                        >
                            {/* Background Gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-80`} />

                            {/* Content */}
                            <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent">
                                <span className="text-xs font-semibold text-white/80 mb-2">{project.category}</span>
                                <h3 className="text-xl font-bold text-white">{isAr ? project.titleAr : project.titleEn}</h3>
                            </div>

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <ArrowRight className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
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
