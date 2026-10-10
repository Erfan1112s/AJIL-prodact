// components/order/OrderCard.tsx
// کارت سفارش با طراحی مدرن، تصویر، عمق

import Image from 'next/image';
import Link from 'next/link';
import OrderStatusBadge from '@/components/order/OrderStatusBadge';
import { formatPrice, formatDateTime } from '@/lib/utils';
import type { OrderRow } from '@/lib/types';

interface Props {
  order: OrderRow;
  // تصویر اولین محصول (اختیاری)
  thumbnail: string | null;
  // تعداد کل اقلام
  itemsCount: number;
}

export default function OrderCard({ order, thumbnail, itemsCount }: Props) {
  const isPickup = order.delivery_method === 'PICKUP';

  return (
    <Link
      href={`/profile/orders/${order.order_number}`}
      className="group block relative overflow-hidden rounded-2xl border border-coffee-200 bg-white hover:border-gold-400 hover:shadow-lg hover:shadow-coffee-900/5 transition-all duration-300"
    >
      {/* نوار رنگی سمت راست بر اساس وضعیت */}
      <div
        className={`absolute top-0 right-0 bottom-0 w-1 ${
          order.status === 'DELIVERED'
            ? 'bg-brand-500'
            : order.status === 'CANCELLED'
              ? 'bg-red-500'
              : order.status === 'PENDING'
                ? 'bg-gold-500'
                : 'bg-blue-500'
        }`}
      />

      <div className="p-4 sm:p-5 pr-5 sm:pr-6">
        {/* ردیف بالا */}
        <div className="flex items-start gap-4 mb-4">
          {/* تصویر محصول */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-cream-100 shrink-0 ring-1 ring-coffee-100">
            {thumbnail ? (
              <Image
                src={thumbnail}
                alt=""
                fill
                sizes="80px"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-coffee-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z" />
                </svg>
              </div>
            )}

            {/* نشان تعداد اقلام */}
            {itemsCount > 1 && (
              <div className="absolute -bottom-1.5 -left-1.5 min-w-[22px] h-[22px] px-1.5 rounded-full bg-coffee-900 text-cream-50 text-[10px] font-bold flex items-center justify-center fa-num ring-2 ring-white">
                {itemsCount.toLocaleString('fa-IR')}
              </div>
            )}
          </div>

          {/* اطلاعات اصلی */}
          <div className="flex-1 min-w-0">
            {/* ردیف شماره سفارش + وضعیت */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span
                className="text-sm font-bold text-coffee-900 fa-num tracking-wide"
                dir="ltr"
              >
                {order.order_number}
              </span>
              <OrderStatusBadge status={order.status} size="sm" />
            </div>

            {/* تاریخ */}
            <div className="text-xs text-coffee-500 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              {formatDateTime(order.created_at)}
            </div>

            {/* روش تحویل */}
            <div className="text-xs text-coffee-500 mt-1.5 flex items-center gap-1.5">
              {isPickup ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <path d="M9 22V12h6v10" />
                  </svg>
                  تحویل حضوری از شعبه
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                    <path d="M1 4h13v12H1z" />
                    <path d="M14 8h4l3 3v5h-7" />
                    <circle cx="5.5" cy="18" r="1.5" />
                    <circle cx="17.5" cy="18" r="1.5" />
                  </svg>
                  ارسال به {order.city ?? 'آدرس'}
                </>
              )}
            </div>
          </div>
        </div>

        {/* خط جداکننده */}
        <div className="h-px bg-gradient-to-l from-transparent via-coffee-100 to-transparent mb-4" />

        {/* ردیف پایین: مبلغ + CTA */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] text-coffee-500 mb-0.5">
              مبلغ کل
            </div>
            <div className="text-base font-bold text-coffee-900 fa-num leading-none">
              {formatPrice(Number(order.total_amount))}
              <span className="text-[10px] font-normal text-coffee-500 mr-1">
                تومان
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-gold-700 group-hover:text-gold-800 transition-colors">
            مشاهده
            <svg
              width="14"
              height="14"
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
          </div>
        </div>
      </div>
    </Link>
  );
}
