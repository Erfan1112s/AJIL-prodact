// app/admin/customers/[id]/page.tsx
// جزئیات یک مشتری

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAdminCustomerById,
  getOrdersByCustomerId,
} from '@/lib/queries/customers-admin';
import OrderStatusBadge from '@/components/order/OrderStatusBadge';
import { formatPrice, formatDateTime, formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'جزئیات مشتری',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;
  const customerId = Number(id);

  if (!Number.isInteger(customerId) || customerId <= 0) {
    notFound();
  }

  const customer = await getAdminCustomerById(customerId);
  if (!customer) notFound();

  const orders = await getOrdersByCustomerId(customerId, 20);

  const totalSpent = orders.reduce(
    (sum, o) =>
      sum +
      (o.status !== 'CANCELLED' && o.status !== 'PENDING'
        ? Number(o.total_amount)
        : 0),
    0
  );

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-coffee-500 flex-wrap">
        <Link href="/admin/customers" className="hover:text-gold-700">
          مشتریان
        </Link>
        <span>/</span>
        <span className="text-coffee-900">
          {customer.full_name ?? customer.phone}
        </span>
      </div>

      {/* هدر */}
      <div className="rounded-2xl border border-coffee-200 bg-gradient-to-br from-gold-50/50 to-white p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-coffee-900 font-bold text-2xl shadow-lg shrink-0">
            {customer.full_name?.charAt(0) ?? '؟'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-coffee-900 mb-1">
              {customer.full_name ?? 'بدون نام'}
            </h1>
            <div className="text-sm text-coffee-500 fa-num" dir="ltr">
              {customer.phone}
            </div>
            {customer.email && (
              <div
                className="text-xs text-coffee-500 mt-1 fa-num"
                dir="ltr"
              >
                {customer.email}
              </div>
            )}
            <div className="text-[11px] text-coffee-400 mt-2">
              عضویت از {formatDate(customer.created_at)}
            </div>
          </div>
        </div>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-coffee-200 bg-white p-4">
          <div className="text-xs text-coffee-500 mb-1">تعداد سفارشات</div>
          <div className="text-2xl font-bold text-coffee-900 fa-num">
            {customer.order_count.toLocaleString('fa-IR')}
          </div>
        </div>
        <div className="rounded-2xl border border-coffee-200 bg-white p-4">
          <div className="text-xs text-coffee-500 mb-1">مجموع خرید</div>
          <div className="text-2xl font-bold text-brand-700 fa-num leading-tight">
            {formatPrice(totalSpent)}
          </div>
          <div className="text-[10px] text-coffee-500 mt-1">تومان</div>
        </div>
        <div className="rounded-2xl border border-coffee-200 bg-white p-4">
          <div className="text-xs text-coffee-500 mb-1">آخرین سفارش</div>
          <div className="text-sm font-bold text-coffee-900 mt-1.5">
            {customer.last_order_at
              ? formatDateTime(customer.last_order_at)
              : '—'}
          </div>
        </div>
      </div>

      {/* سفارشات */}
      <div className="rounded-2xl border border-coffee-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-coffee-100 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-coffee-900">
            سفارشات مشتری
          </h2>
          <span className="text-xs text-coffee-500 fa-num">
            {orders.length.toLocaleString('fa-IR')} سفارش
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="py-12 text-center text-sm text-coffee-500">
            این مشتری هنوز سفارشی ثبت نکرده است
          </div>
        ) : (
          <div className="divide-y divide-coffee-100">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.order_number}`}
                className="block px-5 py-3.5 hover:bg-cream-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm font-bold text-coffee-900 fa-num"
                      dir="ltr"
                    >
                      {order.order_number}
                    </span>
                    <OrderStatusBadge status={order.status} size="sm" />
                  </div>
                  <span className="text-xs text-coffee-500">
                    {formatDateTime(order.created_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-coffee-600">
                    {order.delivery_method === 'PICKUP'
                      ? 'تحویل حضوری'
                      : 'ارسال به آدرس'}
                  </span>
                  <span className="font-bold text-coffee-900 fa-num">
                    {formatPrice(Number(order.total_amount))} تومان
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* یادداشت ادمین */}
      {customer.admin_note && (
        <div className="rounded-2xl border border-gold-200 bg-gold-50 p-5">
          <div className="text-xs text-coffee-500 mb-2">
            یادداشت داخلی ادمین
          </div>
          <div className="text-sm text-coffee-700 leading-6">
            {customer.admin_note}
          </div>
        </div>
      )}
    </div>
  );
}