'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Play, Rocket, MousePointer2 } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'

export function HeroOverlay() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const Arrow = isAr ? ArrowLeft : ArrowRight

    return (
        <div className="relative z-10 container mx-auto px-6 py-20 h-full flex flex-col justify-center">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto w-full">

                {/* Left Side: Empty or Floating Element placeholder if needed
                    In the new design, the 3D Astronaut is handled by the Canvas, 
                    but we might want to preserve layout space or add interactive zones.
                 */}
                <div className={`hidden lg:block ${isAr ? 'lg:order-2' : 'lg:order-1'}`} />

                {/* Right Side: Text Content */}
                <div className={`${isAr ? 'lg:order-1 text-right' : 'lg:order-2 text-left'} lg:text-start text-center`}>

                    {/* Top Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className={`flex ${isAr ? 'justify-end lg:justify-start' : 'justify-start'} justify-center lg:justify-start mb-8`}
                    >
                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 backdrop-blur-sm">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                            >
                                <Rocket className="h-5 w-5 text-yellow-400" />
                            </motion.div>
                            <span className="text-base font-semibold bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                                {isAr ? '🚀 نأخذ علامتك التجارية إلى آفاق جديدة' : '🚀 Launching Brands to New Heights'}
                            </span>
                        </div>
                    </motion.div>

                    {/* Main Title - Optimized for LCP */}
                    <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1]">
                            <span className="block mb-4">
                                <span className="text-white font-black tracking-wider drop-shadow-lg">DEX</span>
                                <span className="text-yellow-400/80 text-xl md:text-2xl font-light ms-2 tracking-widest drop-shadow-md"> ADVERTISING</span>
                            </span>

                            <span className="block mt-4">
                                <span className="relative inline-block">
                                    <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-500 bg-clip-text text-transparent drop-shadow-sm">
                                        {isAr ? 'نصنع' : 'We Create'}
                                    </span>
                                </span>
                                <span className="text-white mx-3 drop-shadow-lg">
                                    {isAr ? 'علامات تجارية' : 'Iconic'}
                                </span>
                            </span>
                            <span className="block mt-2">
                                <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-500 bg-clip-text text-transparent drop-shadow-sm">
                                    {isAr ? 'لا تُنسى' : 'Brands'}
                                </span>
                                <motion.span
                                    className="inline-block ms-4"
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    ✨
                                </motion.span>
                            </span>
                        </h1>
                    </div>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="text-lg md:text-xl text-gray-300 max-w-xl mb-10 drop-shadow-md font-medium"
                    >
                        {isAr
                            ? 'وكالة تسويق رقمي متكاملة - من التصميم الإبداعي إلى إدارة الحملات الرقمية'
                            : 'Full-Service Digital Marketing Agency - From Creative Design to Digital Campaign Management'
                        }
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className={`flex flex-col sm:flex-row items-center gap-4 ${isAr ? 'lg:justify-start' : 'lg:justify-start'} justify-center lg:justify-start mb-12`}
                    >
                        <Link href="/register">
                            <Button size="lg" className="group relative text-lg px-8 py-6 bg-primary hover:bg-primary/90 transition-all duration-500 shadow-2xl shadow-primary/30 rounded-full overflow-hidden text-background font-bold">
                                <span className="relative z-10 flex items-center">
                                    <Rocket className="me-2 h-5 w-5 group-hover:-translate-y-1 group-hover:rotate-12 transition-transform" />
                                    {isAr ? 'ابدأ رحلتك' : 'Start Your Journey'}
                                    <Arrow className="ms-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                                <motion.div
                                    className="absolute inset-0 bg-white/20"
                                    animate={{ x: ['100%', '-100%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                                />
                            </Button>
                        </Link>
                        <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-yellow-400/50 text-yellow-400 rounded-full hover:bg-yellow-400/10 group bg-black/20 backdrop-blur-sm">
                            <Play className="me-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                            {isAr ? 'شاهد أعمالنا' : 'View Our Work'}
                        </Button>
                    </motion.div>

                    {/* Stats Highlights */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="grid grid-cols-3 gap-6 max-w-md"
                    >
                        {[
                            { value: '500+', labelAr: 'مشروع', labelEn: 'Projects' },
                            { value: '200+', labelAr: 'عميل', labelEn: 'Clients' },
                            { value: '15+', labelAr: 'سنة', labelEn: 'Years' },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1 + i * 0.1 }}
                                className={`${isAr ? 'text-right' : 'text-left'} text-center lg:text-start`}
                            >
                                <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent drop-shadow-sm">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-gray-400 font-medium drop-shadow-sm">{isAr ? stat.labelAr : stat.labelEn}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <div className="flex flex-col items-center gap-2 drop-shadow-md">
                    <span className="text-xs text-gray-400 font-medium">
                        {isAr ? 'اكتشف المزيد' : 'Discover More'}
                    </span>
                    <MousePointer2 className="h-5 w-5 text-yellow-400 animate-bounce" />
                </div>
            </motion.div>
        </div>
    )
}
