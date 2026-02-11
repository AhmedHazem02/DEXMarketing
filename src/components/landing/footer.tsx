'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useSiteSettingsContext } from '@/components/providers/site-settings-provider'
import { createClient } from '@/lib/supabase/client'

interface FooterProps {
    initialUser?: any
    initialRole?: string
}

export function Footer({ initialUser, initialRole }: FooterProps) {
    const locale = useLocale()
    const isAr = locale === 'ar'
    // State for auth
    const [user, setUser] = useState<any>(initialUser || null)

    // Initial link logic
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

    const settings = useSiteSettingsContext()

    // State for contact info fetching
    const [contactInfo, setContactInfo] = useState<{ email?: string, phone?: string, address?: string }>({})
    const supabase = createClient()

    useEffect(() => {
        // Only check if we don't have initial data
        if (!initialUser) {
            const checkUser = async () => {
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) {
                    await updateUserAndLink(session.user)
                }
            }
            checkUser()
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                await updateUserAndLink(session?.user ?? null)
            } else if (event === 'SIGNED_OUT') {
                setUser(null)
                setDashboardLink('/login')
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [initialUser])

    const updateUserAndLink = async (currentUser: any) => {
        if (!currentUser) {
            setUser(null)
            setDashboardLink('/login')
            return
        }

        setUser(currentUser)

        // Always fetch from DB first - it's the source of truth
        let role = null
        const { data } = await supabase
            .from('users')
            .select('role')
            .eq('id', currentUser.id)
            .single()

        if (data) {
            role = (data as any).role
        } else {
            // Fallback to metadata only if DB lookup fails
            role = currentUser.user_metadata?.role
        }

        if (role) {
            const normalizedRole = String(role).toLowerCase().trim()
            setDashboardLink(getLink(normalizedRole))
        }
    }

    useEffect(() => {
        const fetchContactInfo = async () => {
            const { data } = await supabase
                .from('pages')
                .select('*')
                .eq('slug', 'contact')
                .single()

            if (data) {
                const pageData: any = data
                const content = isAr ? pageData.content_ar : pageData.content_en
                // Handle text/json content safely
                try {
                    const parsedContent = typeof content === 'string' ? JSON.parse(content) : content
                    setContactInfo({
                        email: parsedContent?.email,
                        phone: parsedContent?.phone,
                        address: parsedContent?.address
                    })
                } catch (e) {
                    // If it's not JSON, maybe it's not usable directly here or fallback
                }
            }
        }
        fetchContactInfo()
    }, [isAr])

    // Fallback to settings or hardcoded if fetch fails or data missing
    const phone = contactInfo.phone || settings.contact_phone || '+20 123 456 7890'
    const email = contactInfo.email || settings.contact_email || 'info@dex-advertising.com'
    const address = contactInfo.address || (isAr
        ? (settings.contact_address_ar || 'القاهرة، مصر')
        : (settings.contact_address_en || 'Cairo, Egypt'))

    // روابط السوشيال من الإعدادات
    const socialLinks = [
        { icon: Facebook, href: settings.social_facebook || '#' },
        { icon: Instagram, href: settings.social_instagram || '#' },
        { icon: Twitter, href: settings.social_twitter || '#' },
        { icon: Linkedin, href: settings.social_linkedin || '#' },
    ]

    const quickLinks = [
        { label: isAr ? 'الرئيسية' : 'Home', href: '/' },
        { label: isAr ? 'من نحن' : 'About Us', href: '/about' },
        { label: isAr ? 'خدماتنا' : 'Services', href: '/services' },
        { label: isAr ? 'أعمالنا' : 'Portfolio', href: '/portfolio' },
        { label: isAr ? 'تواصل معنا' : 'Contact Us', href: '/contact' },
    ]

    return (
        <footer className="relative bg-[#020617] text-white pt-20 pb-10 overflow-hidden border-t border-white/5">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />
            <div className="absolute -top-[500px] -left-[500px] w-[1000px] h-[1000px] bg-primary/5 rounded-full blur-3xl pointer-events-none opacity-20" />
            <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none opacity-20" />

            <div className="container relative z-10 px-6 mx-auto">
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
                    {/* Brand Column (4 Cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-white/10">
                                <span className="font-black text-2xl text-white">D</span>
                            </div>
                            <div>
                                <span className="text-2xl font-black tracking-tight text-white block leading-none">DEX</span>
                                <span className="text-sm font-medium text-gray-400 tracking-wider uppercase">Advertising</span>
                            </div>
                        </div>
                        <p className="text-gray-400 leading-relaxed max-w-sm text-base">
                            {isAr
                                ? 'شريكك الاستراتيجي في رحلة التحول الرقمي. نبتكر حلولاً تسويقية ذكية تدفع أعمالك نحو النمو والريادة.'
                                : 'Your strategic partner in digital transformation. We innovate smart marketing solutions that drive your business towards growth and leadership.'
                            }
                        </p>

                        {/* Social Icons */}
                        <div className="flex gap-3 pt-2">
                            {socialLinks.map((social, i) => (
                                <a
                                    key={i}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-primary hover:text-white hover:scale-110 flex items-center justify-center transition-all duration-300 text-gray-400 border border-white/5"
                                >
                                    <social.icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links (2 Cols) */}
                    <div className="lg:col-span-2 lg:col-start-6">
                        <h4 className="font-bold text-lg mb-6 text-white inline-block relative after:content-[''] after:absolute after:bottom-[-8px] after:start-0 after:w-10 after:h-1 after:bg-primary after:rounded-full">
                            {isAr ? 'الشركة' : 'Company'}
                        </h4>
                        <ul className="space-y-4">
                            {quickLinks.map((link, i) => (
                                <li key={i}>
                                    <Link href={link.href} className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2 group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal/Support (2 Cols) */}
                    <div className="lg:col-span-2">
                        <h4 className="font-bold text-lg mb-6 text-white inline-block relative after:content-[''] after:absolute after:bottom-[-8px] after:start-0 after:w-10 after:h-1 after:bg-primary after:rounded-full">
                            {isAr ? 'الدعم' : 'Support'}
                        </h4>
                        <ul className="space-y-4 text-gray-400">
                            <li>
                                <Link href="/services" className="hover:text-primary transition-colors flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                                    {isAr ? 'مركز المساعدة' : 'Help Center'}
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="hover:text-primary transition-colors flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                                    {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="hover:text-primary transition-colors flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                                    {isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}
                                </Link>
                            </li>
                            <li>
                                <Link href={dashboardLink} className="hover:text-primary transition-colors flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                                    {user
                                        ? (isAr ? 'لوحة التحكم' : 'Go to Dashboard')
                                        : (isAr ? 'دخول العملاء' : 'Client Login')
                                    }
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter / Contact (4 Cols) */}
                    <div className="lg:col-span-4">
                        <h4 className="font-bold text-lg mb-6 text-white inline-block relative after:content-[''] after:absolute after:bottom-[-8px] after:start-0 after:w-10 after:h-1 after:bg-primary after:rounded-full">
                            {isAr ? 'تواصل معنا' : 'Get in Touch'}
                        </h4>

                        <div className="space-y-4 mb-8">
                            <a href={`mailto:${email}`} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{isAr ? 'راسلنا' : 'Email Us'}</span>
                                    <span className="text-gray-200 font-medium">{email}</span>
                                </div>
                            </a>

                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{isAr ? 'اتصل بنا' : 'Call Us'}</span>
                                    <span className="text-gray-200 font-medium" dir="ltr">{phone}</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-1">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{isAr ? 'زورنا' : 'Visit Us'}</span>
                                    <span className="text-gray-200 font-medium leading-snug">{address}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm font-medium">
                        &copy; {new Date().getFullYear()} DEX Advertising. {isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved.'}
                    </p>

                    <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
                        {/* Optional extra privacy links or languages could go here */}
                        <span>Designed & Developed by DEX Tech Team</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
