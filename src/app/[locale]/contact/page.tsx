import { getTranslations } from 'next-intl/server'
import { setRequestLocale } from 'next-intl/server'
import { Navbar, Footer } from '@/components/landing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
    const params = await props.params;
    const { locale } = params;
    const t = await getTranslations({ locale, namespace: 'common' })
    return {
        title: t('contact') + ' - DEX',
    }
}

export default async function ContactPage(props: { params: Promise<{ locale: string }> }) {
    const params = await props.params;
    const { locale } = params;
    setRequestLocale(locale)
    const isAr = locale === 'ar'

    // Fetch dynamic content
    const supabase = await createClient()
    const { data: pageData } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', 'contact')
        .single()

    const data: any = pageData
    const content = isAr ? data?.content_ar : data?.content_en

    const contactInfo = {
        email: content?.email || 'info@dex-advertising.com',
        phone: content?.phone || '+20 123 456 7890',
        address: content?.address || (isAr ? 'القاهرة، التجمع الخامس، مصر' : 'Cairo, Fifth Settlement, Egypt'),
        whatsapp: content?.whatsapp
    }

    const CONTACT_ITEMS = [
        { icon: Phone, label: isAr ? 'الهاتف' : 'Phone', value: contactInfo.phone },
        { icon: Mail, label: isAr ? 'البريد الإلكتروني' : 'Email', value: contactInfo.email },
        { icon: MapPin, label: isAr ? 'العنوان' : 'Address', value: contactInfo.address },
    ]

    return (
        <main className="min-h-screen bg-[#022026] overflow-hidden font-sans">
            <Navbar />

            {/* Page Header */}
            <div className="pt-36 pb-20 relative text-white text-center">
                <div className="absolute inset-0 bg-gradient-to-b from-[#011118] via-[#022026] to-[#022026]" />
                <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-[#F2CB05]/[0.03] blur-[120px] rounded-full" />
                <div className="container relative z-10 px-6">
                    <span className="inline-block text-[#F2CB05]/70 text-xs font-mono tracking-[0.3em] uppercase mb-4">
                        {isAr ? '— تواصل معنا —' : '— Get in Touch —'}
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 font-serif">
                        {isAr ? 'تواصل معنا' : 'Contact Us'}
                    </h1>
                    <div className="w-12 h-1 bg-[#F2CB05] mx-auto rounded-full mb-6" />
                    <p className="text-lg text-white/40 max-w-2xl mx-auto">
                        {isAr
                            ? 'نحن هنا للإجابة على جميع استفساراتك ومساعدتك في بدء مشروعك.'
                            : 'We are here to answer all your inquiries and help you start your project.'}
                    </p>
                </div>
            </div>

            <section className="py-24 bg-[#022026]">
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 max-w-6xl mx-auto">

                        {/* Contact Info */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-4 font-serif">
                                    {isAr ? 'معلومات التواصل' : 'Get in Touch'}
                                </h2>
                                <p className="text-white/40 text-sm leading-relaxed">
                                    {isAr
                                        ? 'لديك فكرة مشروع؟ أو تريد تطوير علامتك التجارية؟ تواصل معنا الآن.'
                                        : 'Have a project idea? Or want to grow your brand? Contact us now.'}
                                </p>
                            </div>

                            <div className="space-y-5">
                                {CONTACT_ITEMS.map((item) => {
                                    const Icon = item.icon
                                    return (
                                        <div key={item.label} className="flex items-start gap-4 group">
                                            <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-[#F2CB05] shrink-0 group-hover:bg-[#F2CB05]/10 transition-colors">
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-white/30 mb-0.5">{item.label}</p>
                                                <p className="text-sm text-white/70" dir={item.icon === Phone ? 'ltr' : undefined}>{item.value}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
                            <h2 className="text-xl font-bold text-white mb-6 font-serif">
                                {isAr ? 'أرسل لنا رسالة' : 'Send us a message'}
                            </h2>
                            <form className="space-y-5">
                                <div className="grid md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-white/40">{isAr ? 'الاسم' : 'Name'}</label>
                                        <Input
                                            placeholder={isAr ? 'اسمك الكريم' : 'Your name'}
                                            className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#F2CB05]/50 focus:ring-[#F2CB05]/20"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-white/40">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                                        <Input
                                            type="email"
                                            placeholder="name@example.com"
                                            dir="ltr"
                                            className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#F2CB05]/50 focus:ring-[#F2CB05]/20"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-white/40">{isAr ? 'الموضوع' : 'Subject'}</label>
                                    <Input
                                        placeholder={isAr ? 'عن ماذا تريد التحدث؟' : 'What is this about?'}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#F2CB05]/50 focus:ring-[#F2CB05]/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-white/40">{isAr ? 'الرسالة' : 'Message'}</label>
                                    <Textarea
                                        placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
                                        className="min-h-[140px] bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#F2CB05]/50 focus:ring-[#F2CB05]/20 resize-none"
                                    />
                                </div>
                                <Button size="lg" className="w-full bg-[#F2CB05] hover:bg-[#d4b204] text-[#022026] font-bold">
                                    {isAr ? 'إرسال الرسالة' : 'Send Message'}
                                    <Send className="ms-2 h-4 w-4" />
                                </Button>
                            </form>
                        </div>

                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
