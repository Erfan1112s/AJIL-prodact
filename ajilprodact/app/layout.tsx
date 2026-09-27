// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-vazirmatn',
  weight: ['400', '500', '600', '700'],
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  ),
  title: {
    default: 'کاتالوگ آجیل و خشکبار',
    template: '%s | کاتالوگ آجیل و خشکبار',
  },
  description:
    'کاتالوگ آنلاین آجیل و خشکبار با امکان خرید آنلاین و حضوری از شعب',
  applicationName: 'کاتالوگ آجیل',
  keywords: ['آجیل', 'خشکبار', 'پسته', 'بادام', 'خرید آجیل آنلاین'],
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    siteName: 'کاتالوگ آجیل',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="font-sans antialiased bg-white text-ink-900 min-h-screen flex flex-col">
        {/* هدر سراسری */}
        <Header />

        {/* محتوای اصلی */}
        <div className="flex-1">{children}</div>

        {/* فوتر سراسری */}
        <Footer />
      </body>
    </html>
  );
}