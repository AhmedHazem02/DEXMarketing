'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from '@/i18n/navigation' // Use custom Link
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { LanguageSwitcher } from '@/components/common/language-switcher'
import { createClient } from '@/lib/supabase/client'

interface NavbarProps {
    initialUser?: any
    initialRole?: string
}

export function Navbar({ initialUser, initialRole }: NavbarProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [user, setUser] = useState<any>(initialUser || null)

    // Determine initial link based on passed role/user
    const getLink = (r?: string) => {
        const normalized = r ? String(r).toLowerCase().trim() : ''
        switch (normalized) {
            case 'admin': return '/admin'
            case 'client': return '/client'
            case 'team_leader': return '/team-leader'
            case 'creator': return '/creator'
            case 'accountant': return '/accountant'
            default: return normalized ? '/client' : '/login'
        }
    }

    const [dashboardLink, setDashboardLink] = useState(getLink(initialRole))
    const supabase = createClient()

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll)

        // Auth Check & Role Logic
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            await updateUserAndLink(session?.user ?? null)
        }

        checkUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            await updateUserAndLink(session?.user ?? null)
        })

        return () => {
            window.removeEventListener('scroll', handleScroll)
            subscription.unsubscribe()
        }
    }, [])

    const updateUserAndLink = async (currentUser: any) => {
        setUser(currentUser)
        if (currentUser) {
            // Check DB first for role accuracy
            let role = ''
            const { data } = await supabase
                .from('users')
                .select('role')
                .eq('id', currentUser.id)
                .single()

            if (data) {
                role = (data as any).role
            }

            // Fallback to metadata if DB failed or empty
            if (!role) {
                role = currentUser.user_metadata?.role
            }

            // Normalize role
            const normalizedRole = role ? String(role).toLowerCase().trim() : '';

            switch (normalizedRole) {
                case 'admin': setDashboardLink('/admin'); break;
                case 'client': setDashboardLink('/client'); break;
                case 'team_leader': setDashboardLink('/team-leader'); break;
                case 'creator': setDashboardLink('/creator'); break;
                case 'accountant': setDashboardLink('/accountant'); break;
                default:
                    if (normalizedRole) {
                        setDashboardLink('/client');
                    }
                    else {
                        // Fallback if role is totally unknown but user exists? 
                        // Maybe keep it as login or default to client? 
                        // For now, let's behave like footer: stay at login or handled
                        // actually, keeping at login might confuse logged in users. 
                        // Let's default to client if ambiguous, but only if we really cant find role
                        // But previous logic caused issues. 
                        // If normalizedRole is empty, it means we really have no clue.
                    }
                    break;
            }
            // If normalizedRole was found, we set the link. 
            // If not found, dashboardLink stays as initialized (usually /login). 
            // In Navbar, we initialized it: const [dashboardLink, setDashboardLink] = useState('/login')
        } else {
            setDashboardLink('/login')
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setDashboardLink('/login')
        window.location.reload()
    }

    const navLinks = [
        { href: '/about', labelAr: 'من نحن', labelEn: 'About Us' },
        { href: '/services', labelAr: 'خدماتنا', labelEn: 'Services' },
        { href: '/portfolio', labelAr: 'أعمالنا', labelEn: 'Portfolio' },
        { href: '/contact', labelAr: 'تواصل معنا', labelEn: 'Contact' },
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
                            <Link // Updated to next-intl Link
                                key={i}
                                href={link.href}
                                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                            >
                                <motion.span whileHover={{ y: -2 }} className="inline-block">
                                    {isAr ? link.labelAr : link.labelEn}
                                </motion.span>
                            </Link>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />

                        {user ? (
                            <>
                                <Link href={dashboardLink} className="hidden sm:block">
                                    <Button className="bg-gradient-to-r from-primary to-orange-500 hover:from-orange-500 hover:to-primary rounded-full px-6 font-semibold shadow-lg shadow-primary/30">
                                        {isAr ? 'لوحة التحكم' : 'Dashboard'}
                                    </Button>
                                </Link>
                                <Button variant="ghost" onClick={handleLogout} className="font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 hidden sm:block">
                                    {isAr ? 'خروج' : 'Logout'}
                                </Button>
                            </>
                        ) : (
                            <>
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
                            </>
                        )}

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
                            <Link
                                key={i}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block py-2 text-lg font-medium text-muted-foreground hover:text-primary"
                            >
                                {isAr ? link.labelAr : link.labelEn}
                            </Link>
                        ))}
                        <div className="pt-4 border-t border-border">
                            {user ? (
                                <>
                                    <Link href={dashboardLink} onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-primary font-bold">
                                        {isAr ? 'لوحة التحكم' : 'Dashboard'}
                                    </Link>
                                    <button onClick={handleLogout} className="block w-full text-start py-2 text-red-500 font-bold">
                                        {isAr ? 'تسجيل الخروج' : 'Logout'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block py-2">
                                        {isAr ? 'تسجيل الدخول' : 'Login'}
                                    </Link>
                                    <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-primary font-bold">
                                        {isAr ? 'ابدأ الآن' : 'Get Started'}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.nav>
    )
}
