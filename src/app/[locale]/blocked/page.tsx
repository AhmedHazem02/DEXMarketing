'use client'

import { Button } from '@/components/ui/button'
import { LogOut, Mail, Lock, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, Link } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function BlockedPage() {
    const router = useRouter()
    const locale = useLocale()
    const isAr = locale === 'ar'

    // Create admin-like styles
    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden"
            dir={isAr ? 'rtl' : 'ltr'}
        >

            {/* Background Decoration matching site vibe */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] -right-[10%] w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[40rem] h-[40rem] bg-orange-500/5 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 w-full max-w-lg"
            >
                <div className="bg-card/50 backdrop-blur-xl border border-border shadow-2xl rounded-3xl p-8 md:p-12 text-center space-y-8">

                    {/* Brand / Icon */}
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-500/10 rounded-full blur-xl animate-pulse"></div>
                            <div className="relative bg-background rounded-full p-6 border border-border shadow-sm">
                                <Lock className="w-12 h-12 text-red-500" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-2 shadow-lg border border-border">
                                <ShieldAlert className="w-5 h-5 text-orange-500" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                                {isAr ? 'تم تعطيل الحساب' : 'Account Suspended'}
                            </h1>
                            <p className="text-muted-foreground text-lg leading-relaxed max-w-sm mx-auto">
                                {isAr
                                    ? 'نأسف لإبلاغك بأنه تم إيقاف حسابك مؤقتاً بواسطة إدارة النظام.'
                                    : 'We regret to inform you that your account has been temporarily suspended by the administration.'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 text-sm text-red-600/80">
                        {isAr
                            ? 'يرجى التواصل مع فريق الدعم الفني لاستعادة صلاحيات الوصول إلى حسابك.'
                            : 'Please contact our support team to restore access to your account.'
                        }
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <Link href="/contact" className="block w-full">
                            <Button
                                className="w-full h-12 text-base font-medium rounded-xl shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-orange-500 hover:from-orange-500 hover:to-primary transition-all duration-300"
                            >
                                <Mail className="w-5 h-5 me-2" />
                                {isAr ? 'تواصل مع الدعم الفني' : 'Contact Support'}
                            </Button>
                        </Link>

                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="w-full h-12 text-base font-medium text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"
                        >
                            <LogOut className="w-5 h-5 me-2" />
                            {isAr ? 'تسجيل الخروج' : 'Sign Out'}
                        </Button>
                    </div>

                    <div className="pt-6 border-t border-border/50">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider opacity-50">
                            DEX ERP SYSTEM &copy; {new Date().getFullYear()}
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
