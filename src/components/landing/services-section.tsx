'use client'

import { motion } from 'framer-motion'
import { useLocale } from 'next-intl'
import { Megaphone, Palette, Video, TrendingUp, Camera, PenTool } from 'lucide-react'

export function ServicesSection() {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const services = [
        { icon: Megaphone, titleAr: 'إدارة الحملات الإعلانية', titleEn: 'Ad Campaigns', descAr: 'حملات إعلانية مستهدفة لتحقيق أعلى عائد استثمار', descEn: 'Targeted campaigns for maximum ROI', color: 'from-red-500 to-orange-500' },
        { icon: Palette, titleAr: 'التصميم الإبداعي', titleEn: 'Creative Design', descAr: 'تصاميم مبتكرة تعكس هوية علامتك', descEn: 'Designs that reflect your brand', color: 'from-purple-500 to-pink-500' },
        { icon: Video, titleAr: 'إنتاج الفيديو', titleEn: 'Video Production', descAr: 'فيديوهات احترافية تروي قصتك', descEn: 'Professional videos that tell your story', color: 'from-cyan-500 to-blue-500' },
        { icon: TrendingUp, titleAr: 'تحسين SEO', titleEn: 'SEO Optimization', descAr: 'استراتيجيات لتصدر نتائج البحث', descEn: 'Strategies to dominate search', color: 'from-green-500 to-emerald-500' },
        { icon: Camera, titleAr: 'التصوير الاحترافي', titleEn: 'Photography', descAr: 'صور عالية الجودة لمنتجاتك', descEn: 'High-quality product photos', color: 'from-yellow-500 to-primary' },
        { icon: PenTool, titleAr: 'كتابة المحتوى', titleEn: 'Content Writing', descAr: 'محتوى إبداعي يحوّل الزوار لعملاء', descEn: 'Content that converts', color: 'from-indigo-500 to-violet-500' }
    ]

    return (
        <section id="services" className="py-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

            <div className="container mx-auto px-6 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                        {isAr ? 'خدماتنا' : 'Our Services'}
                    </span>
                    <h2 className="text-4xl md:text-6xl font-black mb-6">
                        {isAr ? 'حلول تسويقية ' : 'Solutions That '}
                        <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                            {isAr ? 'متكاملة' : 'Deliver'}
                        </span>
                    </h2>
                </motion.div>

                {/* Services Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="group relative p-8 rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300"
                        >
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                                <service.icon className="h-7 w-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{isAr ? service.titleAr : service.titleEn}</h3>
                            <p className="text-muted-foreground text-sm">{isAr ? service.descAr : service.descEn}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
