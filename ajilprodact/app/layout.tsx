// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartProvider } from '@/lib/cart/CartContext';

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
    default: 'کاتالوگ آجیل و خشکبار | تازه، طبیعی و با کیفیت',
    template: '%s | کاتالوگ آجیل و خشکبار',
  },
  description:
    'فروش آنلاین آجیل و خشکبار با تضمین کیفیت، تازگی، قیمت مناسب و ارسال سریع به سراسر کشور. خرید از باغات و شعبه‌های منتخب.',
  applicationName: 'کاتالوگ آجیل',
  keywords: [
    'آجیل',
    'خشکبار',
    'پسته',
    'بادام',
    'فروش آجیل آنلاین',
    'خرید پسته',
    'خشکبار تازه',
    'آجیل طبیعی',
    'ارسال آجیل به سراسر کشور',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: '/',
    siteName: 'کاتالوگ آجیل',
    title: 'کاتالوگ آجیل و خشکبار',
    description:
      'خرید آنلاین آجیل و خشکبار با شناسنامه بچ، تضمین تازگی و ارسال سریع',
    images: [
      {
        url: '/images/og-home.jpg',
        width: 1200,
        height: 630,
        alt: 'کاتالوگ آجیل و خشکبار',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'کاتالوگ آجیل و خشکبار',
    description:
      'خرید آنلاین آجیل و خشکبار با شناسنامه بچ، تضمین تازگی و ارسال سریع',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#F59E0B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="font-sans antialiased bg-cream-50 text-coffee-900 min-h-screen flex flex-col leading-relaxed">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-coffee-900"
        >
          پرش به محتوای اصلی
        </a>
        <CartProvider>
          <Header />
          <div id="main-content" className="flex-1">
            {children}
          </div>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}