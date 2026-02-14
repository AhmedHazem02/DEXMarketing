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
        title: t('contact') + ' - DEX ERP',
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

    // Default Fallbacks
    const contactInfo = {
        email: content?.email || 'info@dex-advertising.com',
        phone: content?.phone || '+20 123 456 7890',
        address: content?.address || (isAr ? 'القاهرة، التجمع الخامس، مصر' : 'Cairo, Fifth Settlement, Egypt'),
        whatsapp: content?.whatsapp
    }

    return (
        <main className="min-h-screen bg-background overflow-hidden font-sans">
            <Navbar />

            {/* Page Header */}
            <div className="pt-32 pb-20 bg-[#020617] relative text-white text-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#000000] via-[#0f172a] to-primary/20 opacity-90" />
                <div className="container relative z-10 px-6">
                    <h1 className="text-4xl md:text-6xl font-black mb-6">
                        {isAr ? 'تواصل معنا' : 'Contact Us'}
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        {isAr
                            ? 'نحن هنا للإجابة على جميع استفساراتك ومساعدتك في بدء مشروعك.'
                            : 'We are here to answer all your inquiries and help you start your project.'}
                    </p>
                </div>
            </div>

            <section className="py-24 bg-background">
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16">

                        {/* Contact Info */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-3xl font-bold mb-6">{isAr ? 'معلومات التواصل' : 'Get in Touch'}</h2>
                                <p className="text-muted-foreground text-lg mb-8">
                                    {isAr
                                        ? 'لديك فكرة مشروع؟ أو تريد تطوير علامتك التجارية؟ تواصل معنا الآن.'
                                        : 'Have a project idea? Or want to grow your brand? Contact us now.'}
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">{isAr ? 'الهاتف' : 'Phone'}</h3>
                                        <p className="text-muted-foreground" dir="ltr">{contactInfo.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">{isAr ? 'البريد الإلكتروني' : 'Email'}</h3>
                                        <p className="text-muted-foreground">{contactInfo.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">{isAr ? 'العنوان' : 'Address'}</h3>
                                        <p className="text-muted-foreground">
                                            {contactInfo.address}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="bg-card p-8 rounded-3xl border border-border">
                            <h2 className="text-2xl font-bold mb-6">{isAr ? 'أرسل لنا رسالة' : 'Send us a message'}</h2>
                            <form className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{isAr ? 'الاسم' : 'Name'}</label>
                                        <Input placeholder={isAr ? 'اسمك الكريم' : 'Your name'} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                                        <Input type="email" placeholder="name@example.com" dir="ltr" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{isAr ? 'الموضوع' : 'Subject'}</label>
                                    <Input placeholder={isAr ? 'عن ماذا تريد التحدث؟' : 'What is this about?'} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{isAr ? 'الرسالة' : 'Message'}</label>
                                    <Textarea placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Type your message here...'} className="min-h-[150px]" />
                                </div>
                                <Button size="lg" className="w-full font-bold">
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
