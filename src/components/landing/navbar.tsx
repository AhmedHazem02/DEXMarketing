'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Menu, X, Rocket } from 'lucide-react'
import { LanguageSwitcher } from '@/components/common/language-switcher'
import { useAuthDashboardLink } from '@/hooks/use-auth-dashboard-link'
import { useThrottle } from '@/hooks/use-throttle'
import type { User } from '@supabase/supabase-js'

interface NavbarProps {
    initialUser?: User | null
    initialRole?: string
}

const NAV_LINKS = [
    { href: '/about', labelAr: 'من نحن', labelEn: 'About' },
    { href: '/services', labelAr: 'خدماتنا', labelEn: 'Services' },
    { href: '/portfolio', labelAr: 'أعمالنا', labelEn: 'Work' },
    { href: '/contact', labelAr: 'تواصل معنا', labelEn: 'Contact' },
] as const

export function Navbar({ initialUser, initialRole }: NavbarProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const { user, dashboardLink, handleLogout } = useAuthDashboardLink(initialUser, initialRole)

    // Throttled scroll handler - runs at most once every 150ms
    const handleScroll = useThrottle(() => {
        setIsScrolled(window.scrollY > 50)
    }, 150)

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [handleScroll])

    const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), [])

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ position: 'fixed' }} // Explicitly set position for Framer Motion
            className={`top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
                    ? 'bg-background/60 backdrop-blur-2xl shadow-[0_1px_0_rgba(255,255,255,0.04)] border-b border-white/[0.04]'
                    : ''
                }`}
        >
            <div className="container mx-auto px-6">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="group flex items-center gap-3">
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-500 shadow-[0_0_20px_rgba(251,191,36,0.15)] transition-shadow group-hover:shadow-[0_0_30px_rgba(251,191,36,0.25)]">
                            <Rocket className="h-5 w-5 text-background transition-transform group-hover:-translate-y-0.5 group-hover:rotate-12" />
                        </div>
                        <div className="hidden sm:flex items-baseline gap-1.5">
                            <span className="text-xl font-black tracking-tight text-white">DEX</span>
                            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/40">Advertising</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="relative px-4 py-2 text-[15px] font-semibold text-white/55 transition-colors hover:text-white rounded-xl hover:bg-white/[0.04]"
                            >
                                {isAr ? link.labelAr : link.labelEn}
                            </Link>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex items-center gap-3">
                        <LanguageSwitcher />

                        {user ? (
                            <>
                                <Link href={dashboardLink} className="hidden sm:block">
                                    <Button className="rounded-xl bg-gradient-to-r from-primary to-orange-500 px-6 font-semibold text-background shadow-[0_0_20px_rgba(251,191,36,0.15)] hover:brightness-110 hover:shadow-[0_0_30px_rgba(251,191,36,0.25)]">
                                        {isAr ? 'لوحة التحكم' : 'Dashboard'}
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    onClick={handleLogout}
                                    className="hidden sm:block font-semibold text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-xl"
                                >
                                    {isAr ? 'خروج' : 'Logout'}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="hidden sm:block">
                                    <Button variant="ghost" className="rounded-xl font-medium text-white/50 hover:text-white hover:bg-white/[0.04]">
                                        {isAr ? 'الدخول' : 'Login'}
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button className="rounded-xl bg-gradient-to-r from-primary to-orange-500 px-6 font-semibold text-background shadow-[0_0_20px_rgba(251,191,36,0.15)] hover:brightness-110 hover:shadow-[0_0_30px_rgba(251,191,36,0.25)]">
                                        {isAr ? 'ابدأ الآن' : 'Get Started'}
                                    </Button>
                                </Link>
                            </>
                        )}

                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden rounded-xl text-white/50 hover:text-white hover:bg-white/[0.06]"
                            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? <X /> : <Menu />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-background/95 backdrop-blur-2xl border-b border-white/[0.04]"
                    >
                        <div className="container mx-auto px-6 py-6 space-y-1">
                            {NAV_LINKS.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={closeMobileMenu}
                                    className="block rounded-xl px-4 py-3 text-lg font-medium text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white"
                                >
                                    {isAr ? link.labelAr : link.labelEn}
                                </Link>
                            ))}
                            <div className="pt-4 mt-4 border-t border-white/[0.06]">
                                {user ? (
                                    <>
                                        <Link href={dashboardLink} onClick={closeMobileMenu} className="block rounded-xl px-4 py-3 text-primary font-bold">
                                            {isAr ? 'لوحة التحكم' : 'Dashboard'}
                                        </Link>
                                        <button onClick={handleLogout} className="block w-full text-start rounded-xl px-4 py-3 text-red-400/70 font-bold">
                                            {isAr ? 'تسجيل الخروج' : 'Logout'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/login" onClick={closeMobileMenu} className="block rounded-xl px-4 py-3 text-white/50">
                                            {isAr ? 'تسجيل الدخول' : 'Login'}
                                        </Link>
                                        <Link href="/register" onClick={closeMobileMenu} className="block rounded-xl px-4 py-3 text-primary font-bold">
                                            {isAr ? 'ابدأ الآن' : 'Get Started'}
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    )
}
