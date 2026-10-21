// app/profile/orders/[orderNumber]/page.tsx
// جزئیات کامل سفارش

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentCustomerId } from '@/lib/auth/customer-session';
import {
  getCustomerOrderByNumber,
  getOrderItems,
  getOrderBranch,
} from '@/lib/queries/orders';
import { queryRows } from '@/lib/db';
import Container from '@/components/Container';
import OrderStatusBadge from '@/components/order/OrderStatusBadge';
import OrderStatusStepper from '@/components/order/OrderStatusStepper';
import { formatPrice, formatDateTime } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'جزئیات سفارش',
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ orderNumber: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const customerId = await getCurrentCustomerId();
  if (!customerId) redirect('/auth/login');

  const { orderNumber } = await params;
  const order = await getCustomerOrderByNumber(customerId, orderNumber);
  if (!order) notFound();

  const items = await getOrderItems(order.id);
  const branch = order.branch_id
    ? await getOrderBranch(order.branch_id)
    : null;

  // گرفتن تصویر هر محصول
  const productIds = items.map((i) => i.product_id);
  const imagesMap = new Map<number, string>();
  if (productIds.length > 0) {
    const placeholders = productIds.map(() => '?').join(',');
    const images = await queryRows<{ product_id: number; url: string }>(
      `SELECT product_id, url FROM product_images
       WHERE product_id IN (${placeholders})
         AND is_primary = 1`,
      productIds
    );
    for (const img of images) {
      imagesMap.set(img.product_id, img.url);
    }
  }

  return (
    <main className="min-h-screen bg-cream-50">
      {/* Breadcrumb */}
      <div className="bg-cream-100 border-b border-coffee-200">
        <Container className="py-3 text-sm text-coffee-600">
          <Link href="/" className="hover:text-gold-700 transition-colors">
            خانه
          </Link>
          <span className="mx-2 text-coffee-400">/</span>
          <Link href="/profile" className="hover:text-gold-700 transition-colors">
            حساب کاربری
          </Link>
          <span className="mx-2 text-coffee-400">/</span>
          <Link
            href="/profile/orders"
            className="hover:text-gold-700 transition-colors"
          >
            سفارش‌های من
          </Link>
          <span className="mx-2 text-coffee-400">/</span>
          <span className="text-coffee-900 fa-num" dir="ltr">
            {order.order_number}
          </span>
        </Container>
      </div>

      <Container className="py-8 pb-16">
        {/* هدر سفارش */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1
                className="text-xl sm:text-2xl font-bold text-coffee-900 fa-num tracking-wide"
                dir="ltr"
              >
                {order.order_number}
              </h1>
              <OrderStatusBadge status={order.status} size="md" />
            </div>
            <div className="text-xs text-coffee-500">
              ثبت شده در {formatDateTime(order.created_at)}
            </div>
          </div>
          <Link
            href="/profile/orders"
            className="inline-flex items-center gap-1.5 text-sm text-coffee-600 hover:text-gold-700 transition-colors group"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
              <path d="m9 18 6-6-6-6" />
            </svg>
            بازگشت
          </Link>
        </div>

        {/* استپر وضعیت */}
        <div className="mb-6">
          <OrderStatusStepper
            currentStatus={order.status}
            deliveryMethod={order.delivery_method}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ستون اصلی */}
          <div className="lg:col-span-2 space-y-5">
            {/* اقلام سفارش */}
            <div className="rounded-2xl border border-coffee-200 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-coffee-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-coffee-900">
                  اقلام سفارش
                </h3>
                <span className="text-xs text-coffee-500 fa-num">
                  {items.length.toLocaleString('fa-IR')} قلم
                </span>
              </div>
              <div className="divide-y divide-coffee-100">
                {items.map((item) => {
                  const image = imagesMap.get(item.product_id);
                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 flex items-center gap-4 hover:bg-cream-50/50 transition-colors"
                    >
                      {/* تصویر */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-cream-100 shrink-0 ring-1 ring-coffee-100">
                        {image ? (
                          <Image
                            src={image}
                            alt={item.product_name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-coffee-300">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* اطلاعات */}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-coffee-900 mb-1.5 line-clamp-1">
                          {item.product_name}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-coffee-500">
                          <span className="inline-flex items-center gap-1 fa-num">
                            <span className="w-1 h-1 rounded-full bg-coffee-300" />
                            {item.weight_gram.toLocaleString('fa-IR')} گرم
                          </span>
                          <span className="inline-flex items-center gap-1 fa-num">
                            <span className="w-1 h-1 rounded-full bg-coffee-300" />
                            {item.quantity.toLocaleString('fa-IR')} عدد
                          </span>
                        </div>
                      </div>

                      {/* قیمت */}
                      <div className="text-left shrink-0">
                        <div className="text-sm font-bold text-coffee-900 fa-num">
                          {formatPrice(Number(item.price) * item.quantity)}
                        </div>
                        <div className="text-[10px] text-coffee-500">
                          تومان
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* اطلاعات تحویل */}
            <div className="rounded-2xl border border-coffee-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-cream-100 flex items-center justify-center text-coffee-600">
                  {order.delivery_method === 'PICKUP' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <path d="M9 22V12h6v10" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 4h13v12H1z" />
                      <path d="M14 8h4l3 3v5h-7" />
                    </svg>
                  )}
                </div>
                <h3 className="text-sm font-bold text-coffee-900">
                  {order.delivery_method === 'PICKUP'
                    ? 'تحویل حضوری'
                    : 'آدرس تحویل'}
                </h3>
              </div>

              {order.delivery_method === 'PICKUP' && branch ? (
                <div className="space-y-3 text-sm">
                  <InfoRow label="شعبه" value={branch.name} />
                  {branch.address && (
                    <InfoRow label="آدرس" value={branch.address} />
                  )}
                  {branch.phone && (
                    <InfoRow label="تلفن" value={branch.phone} ltr />
                  )}
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <InfoRow label="گیرنده" value={order.customer_name} />
                  <InfoRow label="تلفن" value={order.customer_phone} ltr />
                  {order.province && order.city && (
                    <InfoRow
                      label="استان / شهر"
                      value={`${order.province} - ${order.city}`}
                    />
                  )}
                  {order.address && (
                    <InfoRow label="آدرس" value={order.address} />
                  )}
                  {order.postal_code && (
                    <InfoRow label="کد پستی" value={order.postal_code} ltr />
                  )}
                </div>
              )}

              {order.note && (
                <div className="mt-4 pt-4 border-t border-coffee-100">
                  <div className="text-xs text-coffee-500 mb-2">
                    یادداشت شما
                  </div>
                  <div className="text-sm text-coffee-700 leading-6 bg-cream-50 rounded-xl p-3">
                    {order.note}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ستون خلاصه */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* کارت خلاصه با گرادیانت */}
              <div className="rounded-2xl border border-gold-200 bg-gradient-to-b from-gold-50 to-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-coffee-900 mb-4">
                  خلاصه پرداخت
                </h3>

                <div className="space-y-3 pb-4 border-b border-gold-200/60">
                  <SummaryRow
                    label="جمع کالاها"
                    value={`${formatPrice(Number(order.subtotal))} تومان`}
                  />
                  <SummaryRow
                    label="هزینه ارسال"
                    value={
                      order.delivery_method === 'PICKUP'
                        ? 'حضوری'
                        : Number(order.shipping_cost) === 0
                          ? 'رایگان'
                          : `${formatPrice(Number(order.shipping_cost))} تومان`
                    }
                    highlight={Number(order.shipping_cost) === 0}
                  />
                  {order.shipping_provider !== 'NONE' && (
                    <SummaryRow
                      label="روش ارسال"
                      value={
                        order.shipping_provider === 'SNAPP'
                          ? 'اسنپ اکسپرس'
                          : 'پست پیشتاز'
                      }
                    />
                  )}
                </div>

                <div className="py-5 flex items-end justify-between">
                  <span className="text-xs font-bold text-coffee-700">
                    مبلغ پرداخت شده
                  </span>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-gradient-gold fa-num leading-none">
                      {formatPrice(Number(order.total_amount))}
                    </div>
                    <div className="text-[10px] text-coffee-500 mt-1">
                      تومان
                    </div>
                  </div>
                </div>
              </div>

              {/* اطلاعات پرداخت */}
              {(order.payment_ref || order.tracking_code) && (
                <div className="rounded-2xl border border-coffee-200 bg-white p-5">
                  {order.payment_ref && (
                    <div className="pb-4 border-b border-coffee-100">
                      <div className="text-xs text-coffee-500 mb-1.5">
                        کد پیگیری پرداخت
                      </div>
                      <div className="text-sm font-bold text-coffee-900 fa-num tracking-wide" dir="ltr">
                        {order.payment_ref}
                      </div>
                    </div>
                  )}

                  {order.tracking_code && (
                    <div className={order.payment_ref ? 'pt-4' : ''}>
                      <div className="text-xs text-coffee-500 mb-1.5">
                        کد رهگیری ارسال
                      </div>
                      <div className="text-sm font-bold text-coffee-900 fa-num tracking-wide" dir="ltr">
                        {order.tracking_code}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}

function InfoRow({
  label,
  value,
  ltr = false,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xs text-coffee-500 w-24 shrink-0 pt-0.5">
        {label}
      </span>
      <span
        className={`text-sm text-coffee-900 leading-6 flex-1 ${ltr ? 'fa-num' : ''}`}
        dir={ltr ? 'ltr' : 'rtl'}
      >
        {value}
      </span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-coffee-600">{label}</span>
      <span
        className={`font-medium fa-num ${
          highlight ? 'text-brand-600' : 'text-coffee-900'
        }`}
      >
        {value}
      </span>
    </div>
  );
}