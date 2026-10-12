// components/admin/RecentOrders.tsx
// آخرین سفارشات داشبورد

import Link from 'next/link';
import OrderStatusBadge from '@/components/order/OrderStatusBadge';
import { formatPrice, formatDateTime } from '@/lib/utils';
import type { OrderStatus } from '@/lib/types';
import type { RecentOrder } from '@/lib/queries/dashboard';

interface Props {
  orders: RecentOrder[];
}

export default function RecentOrders({ orders }: Props) {
  return (
    <div className="rounded-2xl border border-coffee-200 bg-white overflow-hidden">
      {/* هدر */}
      <div className="px-5 py-4 border-b border-coffee-100 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-coffee-900">
            آخرین سفارشات
          </h3>
          <p className="text-xs text-coffee-500 mt-0.5">
            {orders.length.toLocaleString('fa-IR')} سفارش اخیر
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="text-xs font-medium text-gold-700 hover:text-gold-800 transition-colors inline-flex items-center gap-1 group"
        >
          همه سفارشات
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:-translate-x-0.5 transition-transform"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </Link>
      </div>

      {/* لیست سفارشات */}
      {orders.length === 0 ? (
        <div className="py-12 text-center text-sm text-coffee-500">
          هنوز سفارشی ثبت نشده است
        </div>
      ) : (
        <div className="divide-y divide-coffee-100">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.order_number}`}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-cream-50 transition-colors group"
            >
              {/* آیکون سفارش */}
              <div className="w-9 h-9 rounded-lg bg-cream-100 flex items-center justify-center text-coffee-600 shrink-0">
                <svg
                  width="16"
                  height="16"
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

              {/* اطلاعات */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span
                    className="text-xs font-bold text-coffee-900 fa-num"
                    dir="ltr"
                  >
                    {order.order_number}
                  </span>
                  <OrderStatusBadge
                    status={order.status as OrderStatus}
                    size="sm"
                  />
                </div>
                <div className="text-[11px] text-coffee-500 truncate">
                  {order.customer_name} — {formatDateTime(order.created_at)}
                </div>
              </div>

              {/* مبلغ */}
              <div className="text-left shrink-0">
                <div className="text-sm font-bold text-coffee-900 fa-num">
                  {formatPrice(Number(order.total_amount))}
                </div>
                <div className="text-[10px] text-coffee-500">تومان</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}