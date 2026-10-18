// components/admin/customers/CustomersTable.tsx
// جدول مشتریان با جست‌وجو و فیلتر

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchIcon } from '@/components/admin/icons';
import { formatDateTime } from '@/lib/utils';
import type {
  AdminCustomerListItem,
  CustomersSummary,
} from '@/lib/queries/customers-admin';

interface Props {
  customers: AdminCustomerListItem[];
  summary: CustomersSummary;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  currentSearch: string;
  currentSort: 'recent' | 'orders' | 'name';
  onlyWithOrders: boolean;
}

export default function CustomersTable({
  customers,
  summary,
  totalCount,
  currentPage,
  totalPages,
  currentSearch,
  currentSort,
  onlyWithOrders,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch);

  function updateFilters(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') params.delete(key);
      else params.set(key, value);
    }
    if (!updates.page && currentPage !== 1) params.delete('page');
    router.push(`/admin/customers?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilters({ search: search.trim() || null });
  }

  return (
    <div className="space-y-4">
      {/* کارت‌های آماری */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="کل مشتریان"
          value={summary.totalCustomers}
          color="from-gold-400 to-gold-600"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="8" r="4" />
              <path d="M2 21c0-4 3.5-6 7-6s7 2 7 6" />
              <circle cx="17" cy="6" r="3" />
              <path d="M22 18c0-2.5-2-4-5-4" />
            </svg>
          }
        />
        <StatCard
          title="مشتریان فعال"
          value={summary.activeCustomers}
          color="from-brand-400 to-brand-600"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        <StatCard
          title="عضو جدید این ماه"
          value={summary.newThisMonth}
          color="from-blue-400 to-blue-600"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          }
        />
        <StatCard
          title="دارای سفارش"
          value={summary.withOrders}
          color="from-gold-500 to-gold-700"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          }
        />
      </div>

      {/* فیلترها */}
      <div className="rounded-2xl border border-coffee-200 bg-white p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-coffee-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جست‌وجو: نام، موبایل یا ایمیل..."
              className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-coffee-200 bg-cream-50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl btn-gold text-sm font-bold whitespace-nowrap"
          >
            جست‌وجو
          </button>
        </form>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyWithOrders}
                onChange={(e) =>
                  updateFilters({
                    withOrders: e.target.checked ? '1' : null,
                  })
                }
                className="w-4 h-4 accent-gold-500"
              />
              <span className="text-xs text-coffee-700">
                فقط دارای سفارش
              </span>
            </label>

            <select
              value={currentSort}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="px-3 py-1.5 rounded-lg border border-coffee-200 bg-cream-50 text-xs outline-none focus:border-gold-500"
            >
              <option value="recent">جدیدترین سفارش</option>
              <option value="orders">بیشترین سفارش</option>
              <option value="name">نام (الفبا)</option>
            </select>
          </div>

          <div className="text-xs text-coffee-500 fa-num">
            {totalCount.toLocaleString('fa-IR')} مشتری
          </div>
        </div>
      </div>

      {/* جدول */}
      {customers.length === 0 ? (
        <div className="rounded-2xl border border-coffee-200 bg-white py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cream-100 mx-auto mb-4 flex items-center justify-center text-coffee-400">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="8" r="4" />
              <path d="M2 21c0-4 3.5-6 7-6s7 2 7 6" />
            </svg>
          </div>
          <p className="text-sm text-coffee-500">
            مشتری‌ای با این فیلترها یافت نشد
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-coffee-200 bg-white overflow-hidden">
          {/* دسکتاپ */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-coffee-100">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    مشتری
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    موبایل
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    سفارشات
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    آخرین سفارش
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    تاریخ عضویت
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-100">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-cream-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-coffee-900 font-bold text-sm shadow-sm shrink-0">
                          {customer.full_name?.charAt(0) ?? '؟'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-coffee-900 text-sm line-clamp-1">
                            {customer.full_name ?? 'بدون نام'}
                          </div>
                          {customer.email && (
                            <div
                              className="text-[11px] text-coffee-500 truncate fa-num"
                              dir="ltr"
                            >
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-coffee-800 fa-num" dir="ltr">
                        {customer.phone}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {customer.order_count > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 text-[11px] font-bold fa-num">
                          {customer.order_count.toLocaleString('fa-IR')}
                        </span>
                      ) : (
                        <span className="text-[11px] text-coffee-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-coffee-600">
                      {customer.last_order_at
                        ? formatDateTime(customer.last_order_at)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-coffee-500">
                      {formatDateTime(customer.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gold-700 hover:bg-gold-50 transition-colors"
                      >
                        جزئیات
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

          {/* موبایل */}
          <div className="md:hidden divide-y divide-coffee-100">
            {customers.map((customer) => (
              <Link
                key={customer.id}
                href={`/admin/customers/${customer.id}`}
                className="block p-4 hover:bg-cream-50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-coffee-900 font-bold shadow-sm shrink-0">
                    {customer.full_name?.charAt(0) ?? '؟'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-coffee-900 line-clamp-1">
                      {customer.full_name ?? 'بدون نام'}
                    </div>
                    <div className="text-xs text-coffee-500 fa-num" dir="ltr">
                      {customer.phone}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-coffee-500">سفارش</div>
                    <div className="text-sm font-bold text-coffee-900 fa-num">
                      {customer.order_count.toLocaleString('fa-IR')}
                    </div>
                  </div>
                </div>
                {customer.last_order_at && (
                  <div className="text-[11px] text-coffee-500">
                    آخرین سفارش: {formatDateTime(customer.last_order_at)}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* صفحه‌بندی */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <button
              type="button"
              onClick={() => updateFilters({ page: String(currentPage - 1) })}
              className="px-4 py-2 rounded-lg bg-white border border-coffee-200 text-coffee-700 text-sm hover:border-gold-400 transition-colors"
            >
              قبلی
            </button>
          )}
          <span className="text-xs text-coffee-500 fa-num">
            صفحه {currentPage.toLocaleString('fa-IR')} از{' '}
            {totalPages.toLocaleString('fa-IR')}
          </span>
          {currentPage < totalPages && (
            <button
              type="button"
              onClick={() => updateFilters({ page: String(currentPage + 1) })}
              className="px-4 py-2 rounded-lg btn-gold text-sm font-bold"
            >
              بعدی
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-coffee-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-md`}
        >
          {icon}
        </div>
      </div>
      <div className="text-xs text-coffee-500 mb-1">{title}</div>
      <div className="text-2xl font-bold text-coffee-900 fa-num leading-none">
        {value.toLocaleString('fa-IR')}
      </div>
    </div>
  );
}