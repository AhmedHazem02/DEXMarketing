'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Rocket, Sparkles } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { useRef, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useIntroStore } from '@/store/intro-store'
import { SplitText } from '@/components/ui/split-text'


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
                            className="mb-10 inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/[0.06] px-6 py-3 backdrop-blur-md shadow-[0_0_20px_rgba(251,191,36,0.08),inset_0_0_20px_rgba(251,191,36,0.03)]"
                        >
                            <motion.div
                                animate={prefersReducedMotion ? undefined : { rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                className="relative"
                            >
                                <Rocket className="h-5 w-5 text-primary drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                            </motion.div>
                            <span className="bg-gradient-to-r from-primary via-yellow-300 to-orange-400 bg-clip-text text-sm font-bold text-transparent">
                                {isAr ? 'نطلق علامتك التجارية إلى المدار' : 'Launching Brands Into Orbit'}
                            </span>
                            <Sparkles className="h-3.5 w-3.5 text-primary/60" />
                        </motion.div>

                        {/* ---------- Main Headline ---------- */}
                        <div className="mb-10 overflow-hidden">
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-black leading-[0.95] tracking-tight">
                                <SplitText
                                    text={isAr ? 'نصنع' : 'We Craft'}
                                    className="text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]"
                                    delay={0.06}
                                    animationFrom={{ opacity: 0, y: 40 }}
                                    animationTo={{ opacity: 1, y: 0 }}
                                    textAlign={isAr ? 'right' : 'left'}
                                    start={isIntroComplete}
                                    type={isAr ? 'words' : 'chars'}
                                />
                                <SplitText
                                    text={isAr ? 'علامات تجارية' : 'Iconic Brands'}
                                    className="bg-gradient-to-r from-primary via-yellow-300 to-orange-500 bg-clip-text text-transparent drop-shadow-none py-1"
                                    delay={0.06}
                                    animationFrom={{ opacity: 0, y: 40 }}
                                    animationTo={{ opacity: 1, y: 0 }}
                                    textAlign={isAr ? 'right' : 'left'}
                                    start={isIntroComplete}
                                    type={isAr ? 'words' : 'chars'}
                                />
                                <SplitText
                                    text={isAr ? 'لا تُنسى' : 'That Conquer'}
                                    className="text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]"
                                    delay={0.06}
                                    animationFrom={{ opacity: 0, y: 40 }}
                                    animationTo={{ opacity: 1, y: 0 }}
                                    textAlign={isAr ? 'right' : 'left'}
                                    start={isIntroComplete}
                                    type={isAr ? 'words' : 'chars'}
                                />
                            </h1>
                        </div>

                        {/* Decorative accent line */}
                        <motion.div
                            variants={{
                                hidden: { scaleX: 0, opacity: 0 },
                                visible: { scaleX: 1, opacity: 1, transition: { duration: 1, delay: 0.4 } }
                            }}
                            className="mb-10 h-[2px] w-24 origin-left bg-gradient-to-r from-primary/60 via-yellow-300/40 to-transparent"
                        />

                        {/* Subtitle */}
                        <motion.p
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.5 } }
                            }}
                            className="mb-14 max-w-2xl text-lg md:text-xl font-medium leading-relaxed text-white/45"
                        >
                            {isAr
                                ? 'وكالة تسويق رقمي تُحرّك الأرقام وتبني الهويات — من الإبداع البصري إلى إدارة الحملات، كل ما يحتاجه مشروعك ليتصدر'
                                : 'A full-spectrum digital agency turning bold ideas into measurable growth — creativity, strategy, and execution under one mission.'}
                        </motion.p>

                        {/* CTAs */}
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.7 } }
                            }}
                            className="mb-16 flex flex-col items-start gap-5 sm:flex-row justify-start"
                        >
                            <Button
                                asChild
                                size="lg"
                                className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-yellow-400 to-orange-500 px-10 py-7 text-lg font-bold text-background shadow-[0_0_30px_rgba(251,191,36,0.25),0_0_60px_rgba(251,191,36,0.1)] transition-all duration-500 hover:shadow-[0_0_50px_rgba(251,191,36,0.4),0_0_80px_rgba(251,191,36,0.15)] hover:brightness-110 hover:scale-[1.02]"
                            >
                                <Link href="/register">
                                    <span className="relative z-10 flex items-center gap-2">
                                        <Rocket className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-12" />
                                        {isAr ? 'ابدأ مهمتك' : 'Start Your Mission'}
                                        <Arrow className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                                    </span>
                                    {!prefersReducedMotion && (
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                                            animate={{ x: ['120%', '-120%'] }}
                                            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3.5 }}
                                        />
                                    )}
                                </Link>
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="group rounded-2xl border-2 border-white/10 bg-white/[0.03] px-10 py-7 text-lg font-semibold text-white backdrop-blur-md hover:border-primary/30 hover:bg-white/[0.07] hover:shadow-[0_0_30px_rgba(251,191,36,0.08)] transition-all duration-400 hover:scale-[1.02]"
                            >
                                <span className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-white/40 transition-colors duration-300 group-hover:text-primary/60" />
                                    {isAr ? 'شاهد أعمالنا' : 'Explore Work'}
                                </span>
                            </Button>
                        </motion.div>


                    </motion.div>
                </div>

            </div >
        </>
    )
}
