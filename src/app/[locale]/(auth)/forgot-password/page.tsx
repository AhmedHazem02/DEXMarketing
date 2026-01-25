import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
    const params = await props.params;
    const { locale } = params;
    const t = await getTranslations({ locale, namespace: 'auth' })
    return {
        title: t('forgotPassword') + ' - DEX ERP',
    }
}

import { locales } from '@/i18n/config'

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }))
}

export default function ForgotPasswordPage() {
    return <ForgotPasswordForm />
}
