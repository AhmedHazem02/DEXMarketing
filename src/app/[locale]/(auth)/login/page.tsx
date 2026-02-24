import { LoginForm } from '@/components/auth/login-form'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
    const params = await props.params;
    const { locale } = params;
    const t = await getTranslations({ locale, namespace: 'auth' })
    return {
        title: t('login') + ' - DEX ERP',
    }
}

export const dynamic = 'force-dynamic'

export default function LoginPage() {
    return <LoginForm />
}
