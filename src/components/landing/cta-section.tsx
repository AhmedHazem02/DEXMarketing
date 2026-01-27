'use client'

import { motion } from 'framer-motion'
import { useLocale } from 'next-intl'
import { Lightbulb, Phone, Mail, ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSiteSettingsContext } from '@/components/providers/site-settings-provider'

export function CTASection() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const Arrow = isAr ? ArrowLeft : ArrowRight
    const settings = useSiteSettingsContext()

    const phone = settings.contact_phone || '+20 123 456 7890'
    const email = settings.contact_email || 'info@dex-advertising.com'

    return (
        <section id="contact" className="py-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-orange-500/10 to-purple-500/20" />

            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto text-center"
                >
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="inline-block mb-8"
                    >
                        <Lightbulb className="h-16 w-16 text-primary" />
                    </motion.div>

                    <h2 className="text-4xl md:text-6xl font-black mb-6">
                        {isAr ? 'جاهز تبدأ؟' : 'Ready to Start?'}
                    </h2>
                    <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                        {isAr
                            ? 'تواصل معنا اليوم واحصل على استشارة مجانية لمشروعك'
                            : 'Contact us today and get a free consultation for your project'
                        }
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/register">
                            <Button size="lg" className="text-lg px-10 py-7 bg-gradient-to-r from-primary to-orange-500 hover:from-orange-500 hover:to-primary shadow-2xl shadow-primary/40 rounded-full font-bold">
                                {isAr ? 'احجز استشارتك المجانية' : 'Book Free Consultation'}
                                <Arrow className="ms-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>

                    {/* Contact Info */}
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Phone className="h-5 w-5 text-primary" />
                            <span dir="ltr">{phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-primary" />
                            <span>{email}</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
