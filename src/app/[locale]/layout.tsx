import type { Metadata } from "next";
import { Tajawal, Playfair_Display, Space_Mono, Aref_Ruqaa } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';
import { QueryProvider, ToastProvider } from '@/components/providers';
import "../globals.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700"],
  variable: '--font-tajawal',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: '--font-playfair',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: '--font-space-mono',
  display: 'swap',
});

const arefRuqaa = Aref_Ruqaa({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: '--font-aref-ruqaa',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://dex-erp.com'),
  title: {
    default: 'DEX - Digital Marketing Agency',
    template: '%s | DEX',
  },
  description: 'Digital Command Center for Marketing Agencies. Digital marketing, design, video, and photography services.',
  keywords: ['digital marketing', 'marketing agency', 'design', 'video', 'photography', 'DEX', 'تسويق رقمي', 'وكالة تسويق'],
  authors: [{ name: 'DEX Marketing' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'ar_EG',
    url: 'https://dex-erp.com',
    siteName: 'DEX Marketing',
    title: 'DEX - Digital Marketing Agency',
    description: 'Digital Command Center for Marketing Agencies',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DEX - Digital Marketing Agency',
    description: 'Digital Command Center for Marketing Agencies',
  },
  robots: {
    index: true,
    follow: true,
  },
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
  // Moved to dashboard layout to avoid latency on public pages.
  // The dashboard layout independently verifies auth & active status.

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
    <html lang={locale} dir={dir} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${tajawal.variable} ${playfair.variable} ${spaceMono.variable} ${arefRuqaa.variable} ${tajawal.className} antialiased min-h-screen bg-background text-foreground`}>
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

