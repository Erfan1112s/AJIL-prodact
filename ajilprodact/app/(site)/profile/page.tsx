// app/profile/page.tsx
// صفحه پروفایل مشتری

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Container from '@/components/Container';
import { getCurrentCustomerId } from '@/lib/auth/customer-session';
import { queryRows } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import type { CustomerRow } from '@/lib/types';

export const metadata: Metadata = {
  title: 'حساب کاربری',
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const id = await getCurrentCustomerId();
  if (!id) redirect('/auth/login?from=/profile');

  const customers = await queryRows<CustomerRow>(
    `SELECT id, phone, national_code, full_name, email, order_count, created_at
     FROM customers WHERE id = ? AND is_active = 1 LIMIT 1`,
    [id]
  );

  const customer = customers[0];
  if (!customer) redirect('/auth/login');

  return (
    <main className="min-h-screen bg-cream-50">
      <Container className="py-10">
        <h1 className="text-2xl font-bold text-coffee-900 mb-6">
          حساب کاربری
        </h1>

        {/* اطلاعات کاربر */}
        <div className="rounded-2xl border border-coffee-200 bg-white p-6 mb-6 shadow-sm">
          <div className="grid gap-5 sm:grid-cols-2">
            <InfoBlock label="نام" value={customer.full_name ?? 'ثبت نشده'} />
            <InfoBlock
              label="شماره موبایل"
              value={customer.phone}
              ltr
            />
            <InfoBlock
              label="تعداد سفارشات"
              value={customer.order_count.toLocaleString('fa-IR')}
            />
            <InfoBlock
              label="تاریخ عضویت"
              value={formatDate(customer.created_at)}
            />
          </div>
        </div>

        {/* لینک‌ها */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/profile/orders"
            className="rounded-2xl border border-coffee-200 bg-white p-5 hover:border-gold-400 transition-colors flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-gold-100 flex items-center justify-center text-gold-700 shrink-0 group-hover:bg-gold-200 transition-colors">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-coffee-900">
                سفارش‌های من
              </div>
              <div className="text-xs text-coffee-500 mt-0.5 fa-num">
                {customer.order_count.toLocaleString('fa-IR')} سفارش
              </div>
            </div>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-coffee-300 group-hover:text-gold-600 group-hover:-translate-x-1 transition-all shrink-0"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </Link>
        </div>
      </Container>
    </main>
  );
}

function InfoBlock({
  label,
  value,
  ltr = false,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-coffee-500 mb-1.5">{label}</div>
      <div
        className={`font-bold text-coffee-900 ${ltr ? 'fa-num' : ''}`}
        dir={ltr ? 'ltr' : 'rtl'}
      >
        {value}
      </div>
    </div>
  );
}