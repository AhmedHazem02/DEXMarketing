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

export default function ForgotPasswordPage() {
    return <ForgotPasswordForm />
}
