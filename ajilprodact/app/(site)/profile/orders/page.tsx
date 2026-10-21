// app/profile/orders/page.tsx
// لیست سفارشات مشتری

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentCustomerId } from '@/lib/auth/customer-session';
import {
  getCustomerOrders,
  getCustomerOrdersCount,
} from '@/lib/queries/orders';
import { queryRows } from '@/lib/db';
import Container from '@/components/Container';
import OrderCard from '@/components/order/OrderCard';

export const metadata: Metadata = {
  title: 'سفارش‌های من',
  robots: { index: false, follow: false },
};

const PER_PAGE = 10;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function OrdersPage({ searchParams }: Props) {
  const customerId = await getCurrentCustomerId();
  if (!customerId) {
    redirect('/auth/login?from=/profile/orders');
  }

  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? '1', 10) || 1);
  const offset = (currentPage - 1) * PER_PAGE;

  const [orders, totalCount] = await Promise.all([
    getCustomerOrders(customerId, PER_PAGE, offset),
    getCustomerOrdersCount(customerId),
  ]);

  // گرفتن تصویر اولین محصول و تعداد اقلام برای هر سفارش
  const orderIds = orders.map((o) => o.id);
  const thumbnails = new Map<number, { image: string | null; count: number }>();

  if (orderIds.length > 0) {
    const placeholders = orderIds.map(() => '?').join(',');
    const rows = await queryRows<{
      order_id: number;
      image_url: string | null;
      items_count: number;
    }>(
      `SELECT
         oi.order_id,
         (SELECT url FROM product_images
          WHERE product_id = oi.product_id
          ORDER BY is_primary DESC, sort_order ASC
          LIMIT 1) AS image_url,
         COUNT(*) OVER (PARTITION BY oi.order_id) AS items_count
       FROM order_items oi
       WHERE oi.order_id IN (${placeholders})`,
      orderIds
    );

    for (const row of rows) {
      if (!thumbnails.has(row.order_id)) {
        thumbnails.set(row.order_id, {
          image: row.image_url,
          count: Number(row.items_count),
        });
      }
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  return (
    <main className="min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-cream-100 border-b border-coffee-200">
        <Container className="py-3 text-sm text-coffee-600">
          <Link href="/" className="hover:text-gold-700 transition-colors">
            خانه
          </Link>
          <span className="mx-2 text-coffee-400">/</span>
          <Link
            href="/profile"
            className="hover:text-gold-700 transition-colors"
          >
            حساب کاربری
          </Link>
          <span className="mx-2 text-coffee-400">/</span>
          <span className="text-coffee-900">سفارش‌های من</span>
        </Container>
      </div>

      {/* هدر */}
      <section className="bg-gradient-to-b from-gold-50/60 to-cream-50 border-b border-coffee-100">
        <Container className="py-8">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 h-8 rounded-full bg-gradient-to-b from-gold-400 to-gold-700" />
                <h1 className="text-2xl font-bold text-coffee-900">
                  سفارش‌های من
                </h1>
              </div>
              <p className="text-xs text-coffee-500">
                تمام سفارشات ثبت‌شده با جزئیات کامل
              </p>
            </div>

            {/* آمار سریع */}
            <div className="flex items-center gap-4 text-xs">
              <Stat
                value={totalCount}
                label="کل سفارشات"
              />
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-10 pb-16">
        {orders.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((order) => {
                const thumb = thumbnails.get(order.id);
                return (
                  <OrderCard
                    key={order.id}
                    order={order}
                    thumbnail={thumb?.image ?? null}
                    itemsCount={thumb?.count ?? 1}
                  />
                );
              })}
            </div>

            {/* صفحه‌بندی */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                baseUrl="/profile/orders"
              />
            )}
          </>
        )}
      </Container>
    </main>
  );
}

// ==========================================
// کامپوننت‌های کمکی
// ==========================================

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center px-4 py-2 rounded-xl bg-white border border-coffee-200">
      <div className="text-lg font-bold text-coffee-900 fa-num leading-tight">
        {value.toLocaleString('fa-IR')}
      </div>
      <div className="text-[10px] text-coffee-500 mt-0.5">{label}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="relative text-center py-20 px-6">
      {/* دایره‌های تزئینی پس‌زمینه */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-32 h-32 rounded-full bg-gold-100/40 blur-3xl" />
        <div className="absolute w-40 h-40 rounded-full bg-cream-200/40 blur-3xl translate-x-16" />
      </div>

      <div className="relative">
        {/* آیکون */}
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gold-100 to-gold-200 mx-auto mb-6 flex items-center justify-center shadow-lg shadow-gold-500/10 rotate-3">
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gold-700"
          >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-coffee-900 mb-3">
          هنوز سفارشی ندارید
        </h2>
        <p className="text-coffee-500 text-sm leading-7 mb-8 max-w-md mx-auto">
          پس از ثبت اولین سفارش، تمام جزئیات آن — از لحظه پرداخت تا
          تحویل — در این بخش قابل پیگیری خواهد بود.
        </p>

        <Link
          href="/products"
          className="inline-flex items-center gap-2 btn-gold px-7 py-3.5 rounded-xl text-sm font-bold group"
        >
          مشاهده محصولات
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:-translate-x-1 transition-transform"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  baseUrl,
}: {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}) {
  // نمایش حداکثر 5 صفحه
  const pages: (number | 'ellipsis')[] = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('ellipsis');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      {currentPage > 1 && (
        <Link
          href={`${baseUrl}?page=${currentPage - 1}`}
          className="w-10 h-10 rounded-xl bg-white border border-coffee-200 flex items-center justify-center text-coffee-700 hover:border-gold-500 hover:text-gold-700 transition-colors"
          aria-label="صفحه قبل"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>
      )}

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span
            key={`e-${i}`}
            className="w-10 h-10 flex items-center justify-center text-coffee-400"
          >
            ...
          </span>
        ) : p === currentPage ? (
          <span
            key={p}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-coffee-900 font-bold flex items-center justify-center fa-num shadow-lg shadow-gold-500/30"
          >
            {p.toLocaleString('fa-IR')}
          </span>
        ) : (
          <Link
            key={p}
            href={`${baseUrl}?page=${p}`}
            className="w-10 h-10 rounded-xl bg-white border border-coffee-200 flex items-center justify-center text-coffee-700 font-medium hover:border-gold-500 hover:text-gold-700 transition-colors fa-num"
          >
            {p.toLocaleString('fa-IR')}
          </Link>
        )
      )}

      {currentPage < totalPages && (
        <Link
          href={`${baseUrl}?page=${currentPage + 1}`}
          className="w-10 h-10 rounded-xl bg-white border border-coffee-200 flex items-center justify-center text-coffee-700 hover:border-gold-500 hover:text-gold-700 transition-colors"
          aria-label="صفحه بعد"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
      )}
    </div>
  );
}