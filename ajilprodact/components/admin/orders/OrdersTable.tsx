// components/admin/orders/OrdersTable.tsx
// جدول سفارشات با فیلتر پیشرفته

'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchIcon } from '@/components/admin/icons';
import OrderStatusBadge from '@/components/order/OrderStatusBadge';
import { formatPrice, formatDateTime } from '@/lib/utils';
import type { OrderStatus, DeliveryMethod } from '@/lib/types';
import type {
  AdminOrderListItem,
  OrderStatusStats,
} from '@/lib/queries/orders-admin';

interface Props {
  orders: AdminOrderListItem[];
  stats: OrderStatusStats;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  currentSearch: string;
  currentStatus: OrderStatus | 'ALL';
  currentDelivery: DeliveryMethod | 'ALL';
  currentFromDate: string;
  currentToDate: string;
}

const STATUS_FILTERS: Array<{
  value: OrderStatus | 'ALL';
  label: string;
  key: keyof OrderStatusStats;
}> = [
  { value: 'ALL', label: 'همه', key: 'all' },
  { value: 'PENDING', label: 'در انتظار', key: 'pending' },
  { value: 'PAID', label: 'پرداخت شده', key: 'paid' },
  { value: 'PROCESSING', label: 'آماده‌سازی', key: 'processing' },
  { value: 'SHIPPED', label: 'ارسال شده', key: 'shipped' },
  { value: 'DELIVERED', label: 'تحویل شده', key: 'delivered' },
  { value: 'CANCELLED', label: 'لغو شده', key: 'cancelled' },
];

export default function OrdersTable({
  orders,
  stats,
  totalCount,
  currentPage,
  totalPages,
  currentSearch,
  currentStatus,
  currentDelivery,
  currentFromDate,
  currentToDate,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending] = useTransition();

  const [search, setSearch] = useState(currentSearch);
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(currentFromDate || currentToDate || currentDelivery !== 'ALL')
  );

  function updateFilters(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    if (!updates.page && currentPage !== 1) {
      params.delete('page');
    }

    router.push(`/admin/orders?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilters({ search: search.trim() || null });
  }

  function clearAllFilters() {
    setSearch('');
    router.push('/admin/orders');
  }

  const hasActiveFilters =
    currentSearch ||
    currentStatus !== 'ALL' ||
    currentDelivery !== 'ALL' ||
    currentFromDate ||
    currentToDate;

  return (
    <div className="space-y-4">
      {/* ==========================================
          تب‌های وضعیت
          ========================================== */}
      <div className="rounded-2xl border border-coffee-200 bg-white p-2 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {STATUS_FILTERS.map((filter) => {
            const active = currentStatus === filter.value;
            const count = stats[filter.key];

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() =>
                  updateFilters({
                    status:
                      filter.value === 'ALL' ? null : filter.value,
                  })
                }
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  active
                    ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-coffee-900 shadow-md shadow-gold-500/30'
                    : 'text-coffee-600 hover:bg-cream-100'
                }`}
              >
                {filter.label}
                <span
                  className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center fa-num ${
                    active
                      ? 'bg-coffee-900/20 text-coffee-900'
                      : 'bg-cream-200 text-coffee-600'
                  }`}
                >
                  {count.toLocaleString('fa-IR')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==========================================
          جست‌وجو و فیلترها
          ========================================== */}
      <div className="rounded-2xl border border-coffee-200 bg-white p-4 space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-coffee-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جست‌وجو: شماره سفارش، نام، شماره موبایل..."
              className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-coffee-200 bg-cream-50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all text-sm"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl btn-gold text-sm font-bold whitespace-nowrap"
          >
            جست‌وجو
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className={`px-4 py-2.5 rounded-xl border text-sm font-medium whitespace-nowrap transition-colors ${
              showAdvanced
                ? 'border-gold-500 bg-gold-50 text-gold-700'
                : 'border-coffee-200 bg-white text-coffee-700 hover:border-gold-400'
            }`}
          >
            فیلتر پیشرفته
          </button>
        </form>

        {/* فیلترهای پیشرفته */}
        {showAdvanced && (
          <div className="pt-3 border-t border-coffee-100 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
            <div>
              <label className="block text-[11px] text-coffee-500 mb-1.5">
                روش تحویل
              </label>
              <select
                value={currentDelivery}
                onChange={(e) =>
                  updateFilters({
                    delivery:
                      e.target.value === 'ALL' ? null : e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-coffee-200 bg-cream-50 text-sm outline-none focus:border-gold-500"
              >
                <option value="ALL">همه</option>
                <option value="SHIPPING">ارسال به آدرس</option>
                <option value="PICKUP">تحویل حضوری</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-coffee-500 mb-1.5">
                از تاریخ
              </label>
              <input
                type="date"
                value={currentFromDate}
                onChange={(e) =>
                  updateFilters({ from: e.target.value || null })
                }
                dir="ltr"
                className="w-full px-3 py-2 rounded-xl border border-coffee-200 bg-cream-50 text-sm outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-coffee-500 mb-1.5">
                تا تاریخ
              </label>
              <input
                type="date"
                value={currentToDate}
                onChange={(e) =>
                  updateFilters({ to: e.target.value || null })
                }
                dir="ltr"
                className="w-full px-3 py-2 rounded-xl border border-coffee-200 bg-cream-50 text-sm outline-none focus:border-gold-500"
              />
            </div>
          </div>
        )}

        {/* نشان‌ها */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-coffee-500 fa-num">
            {totalCount.toLocaleString('fa-IR')} سفارش
            {hasActiveFilters && (
              <span className="text-gold-700 mr-2">(فیلتر فعال)</span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-red-600 hover:text-red-700 transition-colors inline-flex items-center gap-1"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
              پاک کردن فیلترها
            </button>
          )}
        </div>
      </div>

      {/* ==========================================
          جدول
          ========================================== */}
      {orders.length === 0 ? (
        <div className="rounded-2xl border border-coffee-200 bg-white py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cream-100 mx-auto mb-4 flex items-center justify-center text-coffee-400">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <p className="text-sm text-coffee-500 mb-4">
            سفارشی با این فیلترها یافت نشد
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-coffee-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-coffee-100">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    شماره سفارش
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    مشتری
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    اقلام
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    مبلغ
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    تحویل
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    وضعیت
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    تاریخ
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-100">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-cream-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.order_number}`}
                        className="text-sm font-bold text-coffee-900 fa-num hover:text-gold-700 transition-colors"
                        dir="ltr"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-coffee-800">
                        {order.customer_name}
                      </div>
                      <div
                        className="text-[11px] text-coffee-500 fa-num"
                        dir="ltr"
                      >
                        {order.customer_phone}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-coffee-700 fa-num">
                      {order.items_count.toLocaleString('fa-IR')} قلم
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-bold text-coffee-900 fa-num">
                        {formatPrice(Number(order.total_amount))}
                      </div>
                      <div className="text-[10px] text-coffee-400">تومان</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-coffee-700">
                      {order.delivery_method === 'PICKUP' ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
                          حضوری
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          {order.shipping_provider === 'SNAPP'
                            ? 'اسنپ'
                            : order.shipping_provider === 'POST'
                              ? 'پست'
                              : 'ارسال'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-[11px] text-coffee-500">
                      {formatDateTime(order.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.order_number}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gold-700 hover:bg-gold-50 transition-colors"
                      >
                        جزئیات
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M19 12H5" />
                          <path d="m12 19-7-7 7-7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          صفحه‌بندی
          ========================================== */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <button
              type="button"
              onClick={() =>
                updateFilters({ page: String(currentPage - 1) })
              }
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl bg-white border border-coffee-200 text-coffee-700 text-sm font-medium hover:border-gold-400 disabled:opacity-50 transition-colors"
            >
              قبلی
            </button>
          )}
          <span className="px-4 py-2.5 text-sm text-coffee-600 fa-num">
            صفحه {currentPage.toLocaleString('fa-IR')} از{' '}
            {totalPages.toLocaleString('fa-IR')}
          </span>
          {currentPage < totalPages && (
            <button
              type="button"
              onClick={() =>
                updateFilters({ page: String(currentPage + 1) })
              }
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl btn-gold text-sm font-bold disabled:opacity-50"
            >
              بعدی
            </button>
          )}
        </div>
      )}
    </div>
  );
}