import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';
import { QueryProvider, ToastProvider } from '@/components/providers';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const cairo = Cairo({ subsets: ["arabic"], variable: '--font-cairo' });

export const metadata: Metadata = {
  title: "DEX ERP",
  description: "Digital Command Center for Marketing Agencies",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Security Check: Active User Status
  // We use headers to check the pathname to avoid infinite loops on /blocked
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  if (!pathname.includes('/blocked') && !pathname.includes('/contact')) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from('users')
        .select('is_active')
        .eq('id', user.id)
        .single();

      const profile = data as { is_active: boolean | null } | null;

      if (profile && profile.is_active === false) {
        redirect(`/${locale}/blocked`);
      }
    }
  }

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  // Use both fonts variables to allow switching
  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${inter.variable} ${cairo.variable} ${locale === 'ar' ? cairo.className : inter.className} antialiased min-h-screen bg-background text-foreground`}>
        <QueryProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
            <ToastProvider />
          </NextIntlClientProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

