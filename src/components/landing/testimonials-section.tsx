'use client'

import { motion } from 'framer-motion'
import { useLocale } from 'next-intl'
import { Quote, Star } from 'lucide-react'

export function TestimonialsSection() {
    const locale = useLocale()
    const isAr = locale === 'ar'

    const testimonials = [
        { nameAr: 'أحمد محمد', nameEn: 'Ahmed Mohamed', roleAr: 'مدير تسويق', roleEn: 'Marketing Director', textAr: 'فريق DEX حوّل رؤيتنا لواقع، نتائج الحملة فاقت توقعاتنا بمراحل!', textEn: 'DEX team turned our vision into reality. Campaign results exceeded expectations!' },
        { nameAr: 'سارة علي', nameEn: 'Sara Ali', roleAr: 'صاحبة مشروع', roleEn: 'Business Owner', textAr: 'التصميمات الإبداعية والأفكار المبتكرة ساعدتنا نتميز عن المنافسين.', textEn: 'Creative designs and innovative ideas helped us stand out from competitors.' },
        { nameAr: 'محمد خالد', nameEn: 'Mohamed Khaled', roleAr: 'CEO', roleEn: 'CEO', textAr: 'شركاء حقيقيين مش مجرد وكالة، بيفهموا احتياجاتنا ويقدموا حلول استثنائية.', textEn: 'True partners, not just an agency. They understand our needs and deliver exceptional solutions.' },
    ]

    return (
        <section id="testimonials" className="py-32 relative overflow-hidden">
            <div className="container mx-auto px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                        {isAr ? 'آراء العملاء' : 'Testimonials'}
                    </span>
                    <h2 className="text-4xl md:text-6xl font-black">
                        {isAr ? 'ماذا يقول ' : 'What Our '}
                        <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                            {isAr ? 'عملاؤنا' : 'Clients Say'}
                        </span>
                    </h2>
                </motion.div>

                {/* Testimonials Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="relative p-8 rounded-3xl bg-card border border-border/50"
                        >
                            <Quote className="h-10 w-10 text-primary/20 mb-4" />
                            <p className="text-lg mb-6 leading-relaxed">
                                {isAr ? testimonial.textAr : testimonial.textEn}
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white font-bold">
                                    {(isAr ? testimonial.nameAr : testimonial.nameEn).charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold">{isAr ? testimonial.nameAr : testimonial.nameEn}</div>
                                    <div className="text-sm text-muted-foreground">{isAr ? testimonial.roleAr : testimonial.roleEn}</div>
                                </div>
                            </div>
                            {/* Stars */}
                            <div className="absolute top-8 end-8 flex gap-1">
                                {[...Array(5)].map((_, j) => (
                                    <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
