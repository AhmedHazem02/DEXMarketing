'use client'

import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ContactFormProps {
    isAr: boolean
}

export function ContactForm({ isAr }: ContactFormProps) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const validateEmail = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()

        // Validation
        if (!name.trim()) {
            toast.error(isAr ? 'يرجى إدخال الاسم' : 'Please enter your name')
            return
        }
        if (!email.trim() || !validateEmail(email)) {
            toast.error(isAr ? 'يرجى إدخال بريد إلكتروني صالح' : 'Please enter a valid email address')
            return
        }
        if (!message.trim()) {
            toast.error(isAr ? 'يرجى إدخال الرسالة' : 'Please enter your message')
            return
        }

        setIsSubmitting(true)
        try {
            // Simulate sending delay
            await new Promise((resolve) => setTimeout(resolve, 1000))
            toast.success(
                isAr
                    ? 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.'
                    : 'Your message has been sent successfully! We will get back to you soon.'
            )
            setName('')
            setEmail('')
            setSubject('')
            setMessage('')
        } catch {
            toast.error(
                isAr
                    ? 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.'
                    : 'An error occurred while sending the message. Please try again.'
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                    <label className="text-xs text-white/40">{isAr ? 'الاسم' : 'Name'}</label>
                    <Input
                        placeholder={isAr ? 'اسمك الكريم' : 'Your name'}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#F2CB05]/50 focus:ring-[#F2CB05]/20"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs text-white/40">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                    <Input
                        type="email"
                        placeholder="name@example.com"
                        dir="ltr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#F2CB05]/50 focus:ring-[#F2CB05]/20"
                    />
                </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-xs text-white/40">{isAr ? 'الموضوع' : 'Subject'}</label>
                <Input
                    placeholder={isAr ? 'عن ماذا تريد التحدث؟' : 'What is this about?'}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#F2CB05]/50 focus:ring-[#F2CB05]/20"
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-xs text-white/40">{isAr ? 'الرسالة' : 'Message'}</label>
                <Textarea
                    placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[140px] bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#F2CB05]/50 focus:ring-[#F2CB05]/20 resize-none"
                />
            </div>
            <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full bg-[#F2CB05] hover:bg-[#d4b204] text-[#022026] font-bold"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="ms-2 h-4 w-4 animate-spin" />
                        {isAr ? 'جارٍ الإرسال...' : 'Sending...'}
                    </>
                ) : (
                    <>
                        {isAr ? 'إرسال الرسالة' : 'Send Message'}
                        <Send className="ms-2 h-4 w-4" />
                    </>
                )}
            </Button>
        </form>
    )
}
