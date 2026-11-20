// app/checkout/success/page.tsx
// صفحه موفقیت پرداخت

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { queryRows } from '@/lib/db';
import { getCurrentCustomerId } from '@/lib/auth/customer-session';
import Container from '@/components/Container';
import { formatPrice, formatDateTime } from '@/lib/utils';
import type { OrderRow } from '@/lib/types';

export const metadata: Metadata = {
  title: 'پرداخت موفق',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ order?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { order: orderNumber } = await searchParams;
  const customerId = await getCurrentCustomerId();

  if (!customerId || !orderNumber) {
    redirect('/');
  }

  const orders = await queryRows<OrderRow>(
    `SELECT * FROM orders WHERE order_number = ? AND customer_id = ? LIMIT 1`,
    [orderNumber, customerId]
  );

  const order = orders[0];
  if (!order) {
    redirect('/');
  }
  const isPaid = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(
    order.status
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50/60 to-cream-50">
      <Container className="py-16">
        <div className="max-w-xl mx-auto text-center">
          {/* آیکون موفقیت */}
          <div className={`w-20 h-20 rounded-full ${isPaid ? 'bg-brand-500 shadow-brand-500/30' : 'bg-amber-500 shadow-amber-500/30'} text-white mx-auto flex items-center justify-center mb-6 shadow-lg`}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {isPaid ? <path d="M5 13l4 4L19 7" /> : <path d="M12 8v4l2 2" />}
              {!isPaid && <circle cx="12" cy="12" r="9" />}
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-coffee-900 mb-2">
            {isPaid ? 'پرداخت با موفقیت تایید شد' : 'پرداخت در انتظار تایید است'}
          </h1>
          <p className="text-coffee-500 text-sm mb-8">
            {isPaid
              ? 'سفارش شما ثبت شد و به‌زودی برای آماده‌سازی ارسال خواهد شد.'
              : 'پس از تایید پرداخت، وضعیت سفارش شما به‌روزرسانی می‌شود.'}
          </p>

          {/* کارت اطلاعات */}
          <div className="rounded-2xl border border-coffee-200 bg-white p-6 text-right">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-coffee-500 mb-1">شماره سفارش</div>
                <div className="font-bold text-coffee-900 fa-num" dir="ltr">
                  {order.order_number}
                </div>
              </div>
              <div>
                <div className="text-xs text-coffee-500 mb-1">تاریخ</div>
                <div className="font-bold text-coffee-900 text-sm">
                  {formatDateTime(order.created_at)}
                </div>
              </div>
              <div>
                <div className="text-xs text-coffee-500 mb-1">مبلغ پرداخت</div>
                <div className="font-bold text-brand-700 fa-num">
                  {formatPrice(Number(order.total_amount))} تومان
                </div>
              </div>
              <div>
                <div className="text-xs text-coffee-500 mb-1">کد پیگیری</div>
                <div className="font-bold text-coffee-900 fa-num" dir="ltr">
                  {order.payment_ref ?? '—'}
                </div>
              </div>
            </div>
          </div>

          {/* دکمه‌ها */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link
              href="/profile/orders"
              className="inline-flex items-center gap-2 btn-gold px-6 py-3 rounded-xl text-sm"
            >
              مشاهده سفارشات
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-coffee-200 text-coffee-800 text-sm font-medium hover:border-gold-500 hover:text-gold-700 transition-colors"
            >
              ادامه خرید
            </Link>
          </div>

        </div>
      </Container>
    </main>
  );
}