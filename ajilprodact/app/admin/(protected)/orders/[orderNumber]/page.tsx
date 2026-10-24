// app/admin/orders/[orderNumber]/page.tsx
// جزئیات کامل سفارش - پنل ادمین

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAdminOrderByNumber } from '@/lib/queries/orders-admin';
import { queryRows } from '@/lib/db';
import OrderStatusBadge from '@/components/order/OrderStatusBadge';
import OrderStatusChanger from '@/components/admin/orders/OrderStatusChanger';
import TrackingCodeForm from '@/components/admin/orders/TrackingCodeForm';
import { formatPrice, formatDateTime } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'جزئیات سفارش',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ orderNumber: string }>;
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { orderNumber } = await params;
  const detail = await getAdminOrderByNumber(orderNumber);
  if (!detail) notFound();

  const { order, items, branch, customer } = detail;

  // خواندن تصاویر محصولات
  const productIds = items.map((i) => i.product_id);
  const imageMap = new Map<number, string>();
  if (productIds.length > 0) {
    const placeholders = productIds.map(() => '?').join(',');
    const images = await queryRows<{ product_id: number; url: string }>(
      `SELECT product_id, url FROM product_images
       WHERE product_id IN (${placeholders}) AND is_primary = 1`,
      productIds
    );
    for (const img of images) {
      imageMap.set(img.product_id, img.url);
    }
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-coffee-500 flex-wrap">
        <Link href="/admin/orders" className="hover:text-gold-700">
          سفارشات
        </Link>
        <span>/</span>
        <span className="text-coffee-900 fa-num" dir="ltr">
          {order.order_number}
        </span>
      </div>

      {/* هدر */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1
              className="text-xl sm:text-2xl font-bold text-coffee-900 fa-num"
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
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-sm text-coffee-600 hover:text-gold-700 transition-colors group"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:translate-x-0.5 transition-transform"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          بازگشت
        </Link>
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
                const image = imageMap.get(item.product_id);
                return (
                  <div key={item.id} className="p-4 flex items-center gap-4">
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
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-coffee-900 mb-1 line-clamp-1">
                        {item.product_name}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-coffee-500">
                        <span className="fa-num">
                          {item.weight_gram.toLocaleString('fa-IR')} گرم
                        </span>
                        <span className="fa-num">
                          {item.quantity.toLocaleString('fa-IR')} عدد
                        </span>
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <div className="text-sm font-bold text-coffee-900 fa-num">
                        {formatPrice(Number(item.price) * item.quantity)}
                      </div>
                      <div className="text-[10px] text-coffee-500">تومان</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* جمع‌بندی */}
            <div className="px-5 py-4 bg-cream-50 border-t border-coffee-100">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-coffee-600">جمع کالاها</span>
                  <span className="text-coffee-900 fa-num font-medium">
                    {formatPrice(Number(order.subtotal))} تومان
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-coffee-600">هزینه ارسال</span>
                  <span className="text-coffee-900 fa-num font-medium">
                    {Number(order.shipping_cost) === 0
                      ? 'رایگان'
                      : `${formatPrice(Number(order.shipping_cost))} تومان`}
                  </span>
                </div>
                <div className="pt-2 border-t border-coffee-200 flex items-center justify-between">
                  <span className="text-coffee-900 font-bold">جمع کل</span>
                  <span className="text-lg font-bold text-gradient-gold fa-num">
                    {formatPrice(Number(order.total_amount))} تومان
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* اطلاعات مشتری */}
          <div className="rounded-2xl border border-coffee-200 bg-white p-5">
            <h3 className="text-sm font-bold text-coffee-900 mb-4 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-600">
                <circle cx="9" cy="8" r="4" />
                <path d="M2 21c0-4 3.5-6 7-6s7 2 7 6" />
              </svg>
              اطلاعات مشتری
            </h3>

            <div className="space-y-3 text-sm">
              <InfoRow label="نام" value={order.customer_name} />
              <InfoRow
                label="موبایل"
                value={order.customer_phone}
                ltr
              />
              {order.customer_email && (
                <InfoRow
                  label="ایمیل"
                  value={order.customer_email}
                  ltr
                />
              )}
              {customer && (
                <InfoRow
                  label="سابقه خرید"
                  value={`${customer.order_count.toLocaleString('fa-IR')} سفارش`}
                />
              )}
              {customer && (
                <div className="pt-2">
                  <Link
                    href={`/admin/customers?search=${customer.phone}`}
                    className="text-xs text-gold-700 hover:text-gold-800 transition-colors inline-flex items-center gap-1"
                  >
                    مشاهده پروفایل کامل مشتری
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M19 12H5" />
                      <path d="m12 19-7-7 7-7" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* اطلاعات تحویل */}
          <div className="rounded-2xl border border-coffee-200 bg-white p-5">
            <h3 className="text-sm font-bold text-coffee-900 mb-4 flex items-center gap-2">
              {order.delivery_method === 'PICKUP' ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-600">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <path d="M9 22V12h6v10" />
                  </svg>
                  تحویل حضوری
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-600">
                    <path d="M1 4h13v12H1z" />
                    <path d="M14 8h4l3 3v5h-7" />
                  </svg>
                  اطلاعات ارسال
                </>
              )}
            </h3>

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
                <InfoRow
                  label="روش ارسال"
                  value={
                    order.shipping_provider === 'SNAPP'
                      ? 'اسنپ اکسپرس'
                      : order.shipping_provider === 'POST'
                        ? 'پست پیشتاز'
                        : 'ارسال'
                  }
                />
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
                  یادداشت مشتری
                </div>
                <div className="text-sm text-coffee-700 leading-6 bg-cream-50 rounded-xl p-3">
                  {order.note}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ستون کنار */}
        <div className="lg:col-span-1 space-y-4">
          {/* تغییر وضعیت */}
          <OrderStatusChanger
            orderNumber={order.order_number}
            currentStatus={order.status}
          />

          {/* کد رهگیری */}
          {order.delivery_method === 'SHIPPING' && (
            <div className="rounded-2xl border border-coffee-200 bg-white p-5">
              <TrackingCodeForm
                orderNumber={order.order_number}
                initialCode={order.tracking_code}
              />
            </div>
          )}

          {/* اطلاعات پرداخت */}
          <div className="rounded-2xl border border-coffee-200 bg-white p-5">
            <h3 className="text-sm font-bold text-coffee-900 mb-3">
              اطلاعات پرداخت
            </h3>

            <div className="space-y-2.5 text-sm">
              {order.payment_method && (
                <InfoRow
                  label="روش پرداخت"
                  value={
                    order.payment_method === 'zarinpal'
                      ? 'زرین‌پال'
                      : order.payment_method === 'zarinpal-mock'
                        ? 'زرین‌پال (آزمایشی)'
                        : order.payment_method
                  }
                />
              )}
              {order.payment_ref && (
                <InfoRow
                  label="کد پیگیری"
                  value={order.payment_ref}
                  ltr
                />
              )}
              {order.payment_verified_at && (
                <InfoRow
                  label="زمان تایید"
                  value={formatDateTime(order.payment_verified_at)}
                />
              )}
              {!order.payment_ref && !order.payment_verified_at && (
                <div className="text-xs text-coffee-500 text-center py-3">
                  پرداخت هنوز تایید نشده
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
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