'use client'

import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Play, Sparkles, Rocket, Target, Lightbulb, TrendingUp, Award, Star, MousePointer2, Megaphone, Palette, Video, Camera, PenTool, Menu, X, Quote, Instagram, Facebook, Linkedin, Twitter, Mail, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useRef, useState, useEffect } from 'react'
import { StarField, Nebula, FloatingPlanets, ShootingStars, CosmicGrid, GradientText } from '@/components/landing/space-elements'
import { useSiteSettingsContext } from '@/components/providers/site-settings-provider'
import { LanguageSwitcher } from '@/components/common/language-switcher'

// ============================================
// NAVBAR - Floating Navigation
// ============================================
export function Navbar() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const navLinks = [
        { href: '#services', labelAr: 'خدماتنا', labelEn: 'Services' },
        { href: '#portfolio', labelAr: 'أعمالنا', labelEn: 'Portfolio' },
        { href: '#testimonials', labelAr: 'آراء العملاء', labelEn: 'Testimonials' },
        { href: '#contact', labelAr: 'تواصل معنا', labelEn: 'Contact' },
    ]

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-background/80 backdrop-blur-xl shadow-lg border-b border-border/50' : ''
                }`}
        >
            <div className="container mx-auto px-6">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3">
                        <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg shadow-primary/30"
                        >
                            <span className="font-black text-lg text-background">D</span>
                        </motion.div>
                        <div className="hidden sm:block">
                            <span className="text-xl font-black">DEX</span>
                            <span className="text-xl font-light text-muted-foreground ms-1">Advertising</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link, i) => (
                            <motion.a
                                key={i}
                                href={link.href}
                                whileHover={{ y: -2 }}
                                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                            >
                                {isAr ? link.labelAr : link.labelEn}
                            </motion.a>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <Link href="/login" className="hidden sm:block">
                            <Button variant="ghost" className="font-semibold">
                                {isAr ? 'تسجيل الدخول' : 'Login'}
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button className="bg-gradient-to-r from-primary to-orange-500 hover:from-orange-500 hover:to-primary rounded-full px-6 font-semibold shadow-lg shadow-primary/30">
                                {isAr ? 'ابدأ الآن' : 'Get Started'}
                            </Button>
                        </Link>

                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X /> : <Menu />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/50"
                >
                    <div className="container mx-auto px-6 py-4 space-y-4">
                        {navLinks.map((link, i) => (
                            <a
                                key={i}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block py-2 text-lg font-medium text-muted-foreground hover:text-primary"
                            >
                                {isAr ? link.labelAr : link.labelEn}
                            </a>
                        ))}
                    </div>
                </motion.div>
            )}
        </motion.nav>
    )
}

// ============================================
// HERO SECTION - Space Theme "Launch Your Brand"
// ============================================
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
            {/* Deep Space Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0A1628] via-[#0d1d35] to-[#0A1628]" />

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
                            {/* LAYER 1: Rotating Light Rays (Sunburst) */}
                            <motion.div
                                className="absolute -inset-48 opacity-40 pointer-events-none"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                                style={{
                                    background: `conic-gradient(
                                        from 0deg at 50% 50%,
                                        transparent 0deg,
                                        rgba(255,215,0,0.5) 20deg,
                                        transparent 40deg,
                                        transparent 60deg,
                                        rgba(255,180,0,0.4) 80deg,
                                        transparent 100deg,
                                        transparent 120deg,
                                        rgba(255,230,100,0.5) 140deg,
                                        transparent 160deg,
                                        transparent 180deg,
                                        rgba(255,215,0,0.5) 200deg,
                                        transparent 220deg,
                                        transparent 240deg,
                                        rgba(255,180,0,0.4) 260deg,
                                        transparent 280deg,
                                        transparent 300deg,
                                        rgba(255,230,100,0.5) 320deg,
                                        transparent 340deg,
                                        transparent 360deg
                                    )`,
                                    filter: 'blur(15px)',
                                }}
                            />

                            {/* LAYER 1.5: Static Core Glow to Blend Rays */}
                            <div
                                className="absolute -inset-24 blur-[80px] opacity-60 pointer-events-none"
                                style={{
                                    background: 'radial-gradient(circle at 50% 50%, rgba(255,215,0,0.6) 0%, rgba(255,160,0,0.3) 50%, transparent 80%)',
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
                                    <span className="text-yellow-400/80 text-xl md:text-2xl font-light ms-2 tracking-widest">FOR ADVERTISING</span>
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

// ============================================
// SERVICES SECTION
// ============================================
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

// ============================================
// PORTFOLIO SECTION
// ============================================
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

// ============================================
// TESTIMONIALS SECTION
// ============================================
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

// ============================================
// CTA SECTION
// ============================================
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

                    {/* Contact Info - من الإعدادات */}
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

// ============================================
// FOOTER
// ============================================
export function Footer() {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const settings = useSiteSettingsContext()

    // بيانات التواصل من الإعدادات
    const phone = settings.contact_phone || '+20 123 456 7890'
    const email = settings.contact_email || 'info@dex-advertising.com'
    const address = isAr
        ? (settings.contact_address_ar || 'القاهرة، مصر')
        : (settings.contact_address_en || 'Cairo, Egypt')
    const siteName = settings.site_name || 'DEX Advertising'

    // روابط السوشيال من الإعدادات
    const socialLinks = [
        { icon: Facebook, href: settings.social_facebook || '#' },
        { icon: Instagram, href: settings.social_instagram || '#' },
        { icon: Twitter, href: settings.social_twitter || '#' },
        { icon: Linkedin, href: settings.social_linkedin || '#' },
    ]

    return (
        <footer className="py-16 bg-card/80 border-t border-border/50">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    {/* Logo & Description */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg shadow-primary/30">
                                <span className="font-black text-xl text-background">D</span>
                            </div>
                            <div>
                                <span className="text-2xl font-black">DEX</span>
                                <span className="text-2xl font-light text-muted-foreground ms-1">Advertising</span>
                            </div>
                        </div>
                        <p className="text-muted-foreground max-w-sm mb-6">
                            {isAr
                                ? 'وكالة تسويق رقمي رائدة نساعد العلامات التجارية على النمو والتميز.'
                                : 'Leading digital marketing agency helping brands grow and stand out.'
                            }
                        </p>
                        {/* Social Icons - من الإعدادات */}
                        <div className="flex gap-4">
                            {socialLinks.map((social, i) => (
                                <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
                                    <social.icon className="h-5 w-5 text-primary" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-lg mb-4">{isAr ? 'روابط سريعة' : 'Quick Links'}</h4>
                        <ul className="space-y-3 text-muted-foreground">
                            <li><a href="#services" className="hover:text-primary transition-colors">{isAr ? 'خدماتنا' : 'Services'}</a></li>
                            <li><a href="#portfolio" className="hover:text-primary transition-colors">{isAr ? 'أعمالنا' : 'Portfolio'}</a></li>
                            <li><a href="#testimonials" className="hover:text-primary transition-colors">{isAr ? 'آراء العملاء' : 'Testimonials'}</a></li>
                            <li><Link href="/login" className="hover:text-primary transition-colors">{isAr ? 'تسجيل الدخول' : 'Login'}</Link></li>
                        </ul>
                    </div>

                    {/* Contact - من الإعدادات */}
                    <div>
                        <h4 className="font-bold text-lg mb-4">{isAr ? 'تواصل معنا' : 'Contact'}</h4>
                        <ul className="space-y-3 text-muted-foreground">
                            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> {email}</li>
                            <li className="flex items-center gap-2" dir="ltr"><Phone className="h-4 w-4" /> {phone}</li>
                            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {address}</li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} {siteName}. {isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
                </div>
            </div>
        </footer>
    )
}
