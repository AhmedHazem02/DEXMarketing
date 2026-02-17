'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Rocket } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { useRef } from 'react'
import { useIntroStore } from '@/store/intro-store'
import { HERO_STATS as STATS } from '@/lib/constants/landing'

/* ---------- floating mission badges ---------- */
const BADGES_EN = ['Branding', 'Social Media', 'Video', 'SEO', 'Web']
const BADGES_AR = ['هوية بصرية', 'سوشيال ميديا', 'فيديو', 'تحسين محركات', 'ويب']

export function HeroOverlay() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const Arrow = isAr ? ArrowLeft : ArrowRight
    const prefersReducedMotion = useReducedMotion()
    const ref = useRef<HTMLDivElement>(null)

    // Wait for cinematic entrance
    const isIntroComplete = useIntroStore((state) => state.isIntroComplete)

    const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
    const yText = useTransform(scrollYProgress, [0, 1], [0, 150])
    const opacityText = useTransform(scrollYProgress, [0, 0.5], [1, 0])

    const badges = isAr ? BADGES_AR : BADGES_EN

    // Only render or animate if intro is complete
    // We can use a simple variant toggle
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    }

    return (
        <>
            <div ref={ref} className="relative z-10 grid min-h-[100dvh] grid-cols-1 lg:grid-cols-2 items-center gap-12 px-6 py-32 container mx-auto">
                {/* Text Content Column */}
                <div className="w-full flex flex-col justify-center items-start">
                    <motion.div
                        style={{ y: yText, opacity: opacityText }}
                        className="text-start"
                        initial="hidden"
                        animate={isIntroComplete ? "visible" : "hidden"}
                        variants={containerVariants}
                    >
                        {/* Mission badge */}
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
                                visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8 } }
                            }}
                            className="mb-10 inline-flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.06] px-6 py-3 backdrop-blur-sm"
                        >
                            {/* ... Rocket Icon ... */}
                            <motion.div
                                animate={prefersReducedMotion ? undefined : { rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                            >
                                <Rocket className="h-5 w-5 text-primary" />
                            </motion.div>
                            <span className="bg-gradient-to-r from-primary via-yellow-300 to-orange-400 bg-clip-text text-sm font-bold text-transparent">
                                {isAr ? 'نطلق علامتك التجارية إلى المدار' : 'Launching Brands Into Orbit'}
                            </span>
                        </motion.div>

                        {/* ---------- Main Headline ---------- */}
                        <div className="mb-10 overflow-hidden">
                            <motion.h1
                                variants={{
                                    hidden: { opacity: 0, y: 60 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 1, delay: 0.2 } }
                                }}
                                className="text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-black leading-[0.95] tracking-tight"
                            >
                                <span className="block text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]">
                                    {isAr ? 'نصنع' : 'We Craft'}
                                </span>
                                <span className="block bg-gradient-to-r from-primary via-yellow-300 to-orange-500 bg-clip-text text-transparent drop-shadow-none">
                                    {isAr ? 'علامات تجارية' : 'Iconic Brands'}
                                </span>
                                <span className="block text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]">
                                    {isAr ? 'لا تُنسى ✦' : 'That Conquer ✦'}
                                </span>
                            </motion.h1>
                        </div>

                        {/* Subtitle */}
                        <motion.p
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.4 } }
                            }}
                            className="mb-14 max-w-2xl text-lg md:text-xl font-medium leading-relaxed text-white/50"
                        >
                            {isAr
                                ? 'وكالة تسويق رقمي تُحرّك الأرقام وتبني الهويات — من الإبداع البصري إلى إدارة الحملات، كل ما يحتاجه مشروعك ليتصدر'
                                : 'A full-spectrum digital agency turning bold ideas into measurable growth — creativity, strategy, and execution under one mission.'}
                        </motion.p>

                        {/* CTAs */}
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.6 } }
                            }}
                            className="mb-16 flex flex-col items-start gap-5 sm:flex-row justify-start"
                        >
                            <Button
                                asChild
                                size="lg"
                                className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-yellow-400 to-orange-500 px-10 py-7 text-lg font-bold text-background shadow-[0_0_30px_rgba(251,191,36,0.2)] transition-all duration-500 hover:shadow-[0_0_50px_rgba(251,191,36,0.35)] hover:brightness-110"
                            >
                                <Link href="/register">
                                    <span className="relative z-10 flex items-center gap-2">
                                        <Rocket className="h-5 w-5 transition-transform group-hover:-translate-y-1 group-hover:rotate-12" />
                                        {isAr ? 'ابدأ مهمتك' : 'Start Your Mission'}
                                        <Arrow className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </span>
                                    {!prefersReducedMotion && (
                                        <motion.div
                                            className="absolute inset-0 bg-white/20"
                                            animate={{ x: ['100%', '-100%'] }}
                                            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                                        />
                                    )}
                                </Link>
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="group rounded-2xl border-2 border-white/15 bg-white/[0.04] px-10 py-7 text-lg font-semibold text-white backdrop-blur-sm hover:border-primary/40 hover:bg-white/[0.08] transition-all duration-300"
                            >
                                {isAr ? 'شاهد أعمالنا' : 'Explore Work'}
                            </Button>
                        </motion.div>

                        {/* Stats row */}
                        <motion.div
                            variants={{
                                hidden: { opacity: 0 },
                                visible: { opacity: 1, transition: { duration: 1, delay: 0.8 } }
                            }}
                            className="flex items-center gap-10 md:gap-14 justify-start"
                        >
                            {STATS.map((stat, i) => (
                                <motion.div
                                    key={stat.value}
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0, transition: { delay: 1.0 + i * 0.15 } }
                                    }}
                                    className="text-start"
                                >
                                    <div className="text-3xl md:text-4xl font-black bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
                                        {stat.value}
                                    </div>
                                    <div className="mt-1 text-xs md:text-sm font-medium text-white/40 uppercase tracking-wider">
                                        {isAr ? stat.labelAr : stat.labelEn}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>

                {/* Spacer Column for the Astronaut Visual */}
                <div className="hidden lg:block h-full w-full pointer-events-none" aria-hidden="true" />
            </div >

            {/* Badges / Floating Elements - Positioned relative to the section/viewport now */}
            {
                !prefersReducedMotion && isIntroComplete &&
                badges.map((badge, i) => {
                    // Position badges around the edges of the viewport
                    const positions = [
                        { x: 8, y: 20 },   // top-left
                        { x: 85, y: 15 },  // top-right
                        { x: 5, y: 75 },   // bottom-left
                        { x: 88, y: 70 },  // bottom-right
                        { x: 12, y: 48 },  // mid-left
                    ]
                    const pos = positions[i % positions.length]
                    return (
                        <motion.div
                            key={badge}
                            className="pointer-events-none absolute hidden lg:flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-md z-20"
                            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 0.45, scale: 1, y: [0, -8, 0] }}
                            transition={{
                                opacity: { delay: 0.5 + i * 0.15, duration: 0.6 },
                                scale: { delay: 0.5 + i * 0.15, duration: 0.5, type: 'spring' },
                                y: { delay: 1.5 + i * 0.1, duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut' },
                            }}
                        >
                            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                            <span className="text-xs font-medium text-white/60">{badge}</span>
                        </motion.div>
                    )
                })
            }
        </>
    )
}
