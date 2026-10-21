// app/checkout/error/page.tsx
// صفحه خطای پرداخت

import type { Metadata } from 'next';
import Link from 'next/link';
import Container from '@/components/Container';

export const metadata: Metadata = {
  title: 'خطا در پرداخت',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ order?: string; reason?: string }>;
}

const REASONS: Record<string, string> = {
  cancelled: 'پرداخت توسط شما لغو شد یا از درگاه بازنگشتید.',
  verify_failed: 'تایید پرداخت از سمت درگاه انجام نشد.',
  missing_authority: 'اطلاعات بازگشتی از درگاه ناقص است.',
  missing_order: 'شماره سفارش یافت نشد.',
  order_not_found: 'سفارش مورد نظر یافت نشد.',
  payment_blocked: 'درگاه پرداخت در حال راه‌اندازی است.',
};

export default async function CheckoutErrorPage({ searchParams }: Props) {
  const { order, reason } = await searchParams;
  const message = reason ? REASONS[reason] : 'خطای نامشخص';

  return (
    <main className="min-h-screen bg-gradient-to-b from-red-50/40 to-cream-50">
      <Container className="py-16">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-red-500 text-white mx-auto flex items-center justify-center mb-6 shadow-lg shadow-red-500/30">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8v4M12 16h.01" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-coffee-900 mb-2">
            پرداخت ناموفق بود
          </h1>
          <p className="text-coffee-500 text-sm mb-8">{message}</p>

          {order && (
            <div className="rounded-2xl border border-coffee-200 bg-white p-4 mb-8">
              <div className="text-xs text-coffee-500 mb-1">شماره سفارش</div>
              <div className="font-bold text-coffee-900 fa-num" dir="ltr">
                {order}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 btn-gold px-6 py-3 rounded-xl text-sm"
            >
              بازگشت به سبد خرید
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-coffee-200 text-coffee-800 text-sm font-medium hover:border-gold-500 hover:text-gold-700 transition-colors"
            >
              صفحه اصلی
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}