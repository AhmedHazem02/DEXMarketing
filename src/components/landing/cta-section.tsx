'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useLocale } from 'next-intl'
import { Rocket, ArrowLeft, ArrowRight, Phone, Mail, Zap } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { useSiteSettingsContext } from '@/components/providers/site-settings-provider'


export function CTASection() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const Arrow = isAr ? ArrowLeft : ArrowRight
    const settings = useSiteSettingsContext()
    const prefersReducedMotion = useReducedMotion()

    const phone = settings.contact_phone || '+20 123 456 7890'
    const email = settings.contact_email || 'info@dex-advertising.com'

    return (
        <section id="contact" className="relative overflow-hidden py-40">
            {/* Background effects */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-0 h-[1px] w-[60%] -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />
                {/* Large ambient orbs */}
                <div className="absolute left-1/4 top-1/4 h-[600px] w-[600px] rounded-full bg-primary/[0.04] blur-[150px]" />
                <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-orange-500/[0.04] blur-[120px]" />
            </div>

            <div className="container relative z-10 mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    className="mx-auto max-w-5xl"
                >
                    {/* Glassy card */}
                    <div className="glass-premium relative overflow-hidden rounded-3xl p-14 md:p-24">
                        {/* Inner glow */}
                        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/[0.06] via-transparent to-orange-500/[0.04]" />

                        {/* Grid lines decoration */}
                        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                            backgroundSize: '60px 60px',
                        }} />

                        <div className="relative z-10 text-center">
                            {/* Icon */}
                            <motion.div
                                className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-primary/10"
                                animate={prefersReducedMotion ? undefined : { scale: [1, 1.08, 1] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <Zap className="h-9 w-9 text-primary" />
                            </motion.div>

                            {/* Heading */}
                            <h2 className="mb-8 text-4xl font-black md:text-5xl lg:text-6xl">
                                {isAr ? 'جاهز ' : 'Ready to '}
                                <span className="bg-gradient-to-r from-primary via-yellow-300 to-orange-500 bg-clip-text text-transparent">
                                    {isAr ? 'تنطلق؟' : 'Launch?'}
                                </span>
                            </h2>

                            <p className="mx-auto mb-14 max-w-xl text-lg text-white/50">
                                {isAr
                                    ? 'تواصل معنا اليوم وخلّي فريقنا يصمّملك خطة تسويقية مخصصة — الاستشارة الأولى مجانية'
                                    : 'Get in touch and let our team craft a custom growth strategy — your first consultation is on us'}
                            </p>

                            {/* CTA Buttons */}
                            <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                                <Link href="/register">
                                    <Button
                                        size="lg"
                                        className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-yellow-400 to-orange-500 px-12 py-8 text-xl font-bold text-background shadow-[0_0_40px_rgba(251,191,36,0.2)] transition-all duration-500 hover:shadow-[0_0_60px_rgba(251,191,36,0.35)] hover:brightness-110"
                                    >
                                        <span className="relative z-10 flex items-center gap-3">
                                            <Rocket className="h-6 w-6 transition-transform group-hover:-translate-y-1 group-hover:rotate-12" />
                                            {isAr ? 'احجز استشارتك المجانية' : 'Book Free Consultation'}
                                            <Arrow className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                        </span>
                                        {!prefersReducedMotion && (
                                            <motion.div
                                                className="absolute inset-0 bg-white/20"
                                                animate={{ x: ['100%', '-100%'] }}
                                                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}
                                            />
                                        )}
                                    </Button>
                                </Link>
                            </div>

                            {/* Contact badges */}
                            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                                <a href={`tel:${phone}`} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-white/50 transition-colors hover:border-primary/30 hover:text-primary">
                                    <Phone className="h-4 w-4" />
                                    <span dir="ltr">{phone}</span>
                                </a>
                                <a href={`mailto:${email}`} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-white/50 transition-colors hover:border-primary/30 hover:text-primary">
                                    <Mail className="h-4 w-4" />
                                    <span>{email}</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
