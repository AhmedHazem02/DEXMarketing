'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Play, Rocket, MousePointer2 } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { StarField, Nebula, FloatingPlanets, ShootingStars, CosmicGrid } from '@/components/landing/space-elements'

export function HeroSection() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const Arrow = isAr ? ArrowLeft : ArrowRight
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
    const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

    return (
        <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* Atmospheric Background - Matching Reference Image */}
            <div className="absolute inset-0 bg-[#020617]">
                {/* Base Gradient: Deep Space */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#000000] via-[#0f172a] to-[#1e293b] opacity-90" />

                {/* Golden Sunrise Glow (Bottom Left) - Reduced Opacity */}
                <div
                    className="absolute -bottom-1/2 -left-1/4 w-[150%] h-[150%] rounded-full opacity-40 pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle at 30% 80%, rgba(255, 180, 0, 0.3) 0%, rgba(255, 100, 0, 0.1) 20%, transparent 60%)',
                        filter: 'blur(100px)',
                    }}
                />

                {/* Cyan/Teal Atmosphere (Top Right) - Reduced Opacity */}
                <div
                    className="absolute -top-1/2 -right-1/4 w-[150%] h-[150%] rounded-full opacity-30 pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle at 70% 20%, rgba(0, 212, 255, 0.2) 0%, rgba(0, 100, 200, 0.1) 30%, transparent 70%)',
                        filter: 'blur(100px)',
                    }}
                />
            </div>

            {/* Space Elements Components */}
            <StarField />
            <Nebula />
            <FloatingPlanets />
            <ShootingStars />
            <CosmicGrid />

            {/* Main Content */}
            <motion.div style={{ opacity }} className="relative z-10 container mx-auto px-6 py-20">
                <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">

                    {/* Astronaut Image - Left Side */}
                    <motion.div
                        initial={{ opacity: 0, x: isAr ? 100 : -100 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className={`relative ${isAr ? 'lg:order-2' : 'lg:order-1'} flex justify-center lg:justify-start`}
                    >
                        {/* Main Container with Floating Animation */}
                        <motion.div
                            animate={{ y: [0, -12, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                            className="relative"
                        >
                            {/* LAYER 1: Rotating Light Rays (Sunburst) - Reduced Opacity */}
                            <motion.div
                                className="absolute -inset-48 opacity-30 pointer-events-none"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                                style={{
                                    background: `conic-gradient(
                                        from 0deg at 50% 50%,
                                        transparent 0deg,
                                        rgba(255, 170, 0, 0.3) 15deg,  /* Deep Saturated Gold */
                                        transparent 30deg,
                                        transparent 50deg,
                                        rgba(255, 120, 0, 0.2) 70deg,  /* Deep Orange */
                                        transparent 90deg,
                                        transparent 110deg,
                                        rgba(255, 190, 0, 0.3) 130deg, /* Rich Amber */
                                        transparent 150deg,
                                        transparent 170deg,
                                        rgba(255, 170, 0, 0.3) 190deg,
                                        transparent 210deg,
                                        transparent 230deg,
                                        rgba(255, 120, 0, 0.2) 250deg,
                                        transparent 270deg,
                                        transparent 290deg,
                                        rgba(255, 190, 0, 0.3) 310deg,
                                        transparent 330deg,
                                        transparent 350deg,
                                        rgba(255, 170, 0, 0.2) 360deg
                                    )`,
                                    filter: 'blur(15px)',
                                }}
                            />

                            {/* LAYER 1.5: Static Core Glow to Blend Rays - Reduced Opacity */}
                            <div
                                className="absolute -inset-24 blur-[80px] opacity-40 pointer-events-none"
                                style={{
                                    background: 'radial-gradient(circle at 50% 50%, rgba(255,215,0,0.5) 0%, rgba(255,160,0,0.2) 50%, transparent 80%)',
                                }}
                            />



                            {/* LAYER 2: The Astronaut Image with Screen Blend */}
                            <img
                                src="/images/astronaut-solid.png"
                                alt="DEX Astronaut"
                                className="relative z-10 w-full h-auto max-w-md lg:max-w-lg object-contain"
                                style={{
                                    mixBlendMode: 'screen',
                                    filter: 'brightness(1.1) saturate(1.1)',
                                }}
                            />

                            {/* LAYER 3: Ambient Floor Light (Below astronaut visually) */}
                            <div
                                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32 blur-3xl opacity-50 z-0"
                                style={{
                                    background: 'radial-gradient(ellipse at 50% 100%, rgba(255,215,0,0.5) 0%, rgba(0,212,255,0.3) 40%, transparent 70%)',
                                }}
                            />

                            {/* LAYER 4: Particles IN FRONT of astronaut (z-20) */}
                            <motion.div
                                className="absolute z-20 w-3 h-3 rounded-full bg-yellow-400"
                                style={{ top: '20%', right: '5%', boxShadow: '0 0 25px rgba(255,215,0,1)' }}
                                animate={{ y: [0, -25, 0], scale: [1, 1.3, 1] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            />
                            <motion.div
                                className="absolute z-20 w-2 h-2 rounded-full bg-cyan-400"
                                style={{ top: '50%', left: '0%', boxShadow: '0 0 20px rgba(0,212,255,1)' }}
                                animate={{ x: [0, 20, 0], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                            />
                            <motion.div
                                className="absolute z-20 w-4 h-4 rounded-full bg-orange-400/50"
                                style={{ bottom: '30%', right: '10%', boxShadow: '0 0 30px rgba(249,115,22,0.8)' }}
                                animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
                                transition={{ duration: 7, repeat: Infinity, delay: 2 }}
                            />

                            {/* LAYER 5: Light Streaks crossing OVER the image */}
                            <motion.div
                                className="absolute z-20 w-px h-40 bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent"
                                style={{ top: '10%', left: '20%', transform: 'rotate(-30deg)' }}
                                animate={{ opacity: [0, 0.8, 0], y: [0, 50, 100] }}
                                transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
                            />
                            <motion.div
                                className="absolute z-20 w-px h-32 bg-gradient-to-b from-transparent via-yellow-400/40 to-transparent"
                                style={{ top: '30%', right: '15%', transform: 'rotate(20deg)' }}
                                animate={{ opacity: [0, 0.6, 0], y: [0, 40, 80] }}
                                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 7, delay: 3 }}
                            />
                        </motion.div>
                    </motion.div>

                    {/* Text Content - Right Side */}
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

                        {/* Main Title - DEX Style */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="mb-8"
                        >
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1]">
                                {/* DEX Logo Text */}
                                <span className="block mb-4">
                                    <span className="text-white font-black tracking-wider">DEX</span>
                                    <span className="text-yellow-400/80 text-xl md:text-2xl font-light ms-2 tracking-widest"> ADVERTISING</span>
                                </span>

                                {/* Main Tagline with Golden Gradient */}
                                <span className="block mt-4">
                                    <span className="relative inline-block">
                                        <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-500 bg-clip-text text-transparent">
                                            {isAr ? 'نصنع' : 'We Create'}
                                        </span>
                                    </span>
                                    <span className="text-white mx-3">
                                        {isAr ? 'علامات تجارية' : 'Iconic'}
                                    </span>
                                </span>
                                <span className="block mt-2">
                                    <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-500 bg-clip-text text-transparent">
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
                        </motion.div>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="text-lg md:text-xl text-gray-400 max-w-xl mb-10"
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
                                <Button size="lg" className="group relative text-lg px-8 py-6 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 hover:from-orange-500 hover:via-yellow-500 hover:to-yellow-400 transition-all duration-500 shadow-2xl shadow-yellow-500/30 rounded-full overflow-hidden text-background font-bold">
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
                            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-yellow-400/50 text-yellow-400 rounded-full hover:bg-yellow-400/10 group">
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
                                    <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                                        {stat.value}
                                    </div>
                                    <div className="text-sm text-gray-500">{isAr ? stat.labelAr : stat.labelEn}</div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-500">
                        {isAr ? 'اكتشف المزيد' : 'Discover More'}
                    </span>
                    <MousePointer2 className="h-5 w-5 text-yellow-400 animate-bounce" />
                </div>
            </motion.div>
        </section>
    )
}
