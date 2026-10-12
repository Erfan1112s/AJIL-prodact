// app/admin/page.tsx
// داشبورد پنل ادمین

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getDashboardStats,
  getSalesLast7Days,
  getRecentOrders,
  getLowStockProducts,
} from '@/lib/queries/dashboard';
import StatsCard from '@/components/admin/StatsCard';
import SalesChart from '@/components/admin/SalesChart';
import RecentOrders from '@/components/admin/RecentOrders';
import LowStockList from '@/components/admin/LowStockList';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'داشبورد',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // خواندن همه داده‌ها به صورت موازی
  const [stats, salesData, recentOrders, lowStockProducts] = await Promise.all([
    getDashboardStats(),
    getSalesLast7Days(),
    getRecentOrders(5),
    getLowStockProducts(5),
  ]);

  return (
    <div className="space-y-6">
      {/* ==========================================
          ردیف 1: کارت‌های آماری
          ========================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="فروش امروز"
          value={formatPrice(stats.revenueToday)}
          previousValue={stats.revenueYesterday}
          isCurrency
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="12" cy="12" r="3" />
              <path d="M6 12h.01M18 12h.01" />
            </svg>
          }
          iconBg="bg-gradient-to-br from-brand-100 to-brand-200"
          iconColor="text-brand-700"
        />

        <StatsCard
          title="سفارشات امروز"
          value={stats.ordersToday.toLocaleString('fa-IR')}
          previousValue={stats.ordersYesterday}
          icon={
            <svg
              width="20"
              height="20"
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
          }
          iconBg="bg-gradient-to-br from-gold-100 to-gold-200"
          iconColor="text-gold-700"
          href="/admin/orders"
        />

        <StatsCard
          title="مشتریان جدید"
          value={stats.newCustomersToday.toLocaleString('fa-IR')}
          previousValue={stats.newCustomersYesterday}
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="8" r="4" />
              <path d="M2 21c0-4 3.5-6 7-6s7 2 7 6" />
              <circle cx="17" cy="6" r="3" />
              <path d="M22 18c0-2.5-2-4-5-4" />
            </svg>
          }
          iconBg="bg-gradient-to-br from-blue-100 to-blue-200"
          iconColor="text-blue-700"
          href="/admin/customers"
        />

        <StatsCard
          title="محصولات کم‌موجود"
          value={stats.lowStockCount.toLocaleString('fa-IR')}
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
          }
          iconBg="bg-gradient-to-br from-red-100 to-red-200"
          iconColor="text-red-700"
          href="/admin/branches"
        />
      </div>

      {/* ==========================================
          ردیف 2: نمودار فروش
          ========================================== */}
      <SalesChart data={salesData} />

      {/* ==========================================
          ردیف 3: آخرین سفارشات + کم‌موجود
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentOrders orders={recentOrders} />
        <LowStockList products={lowStockProducts} />
      </div>

      {/* ==========================================
          ردیف 4: دسترسی سریع
          ========================================== */}
      <div className="rounded-2xl border border-coffee-200 bg-gradient-to-br from-coffee-50 to-cream-50 p-5">
        <h3 className="text-sm font-bold text-coffee-900 mb-4">
          دسترسی سریع
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickLink
            href="/admin/products/new"
            label="افزودن محصول"
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            }
          />
          <QuickLink
            href="/admin/orders?status=PENDING"
            label="سفارشات در انتظار"
            badge={stats.pendingOrders}
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            }
          />
          <QuickLink
            href="/admin/orders?status=PROCESSING"
            label="در حال آماده‌سازی"
            badge={stats.processingOrders}
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
              </svg>
            }
          />
          <QuickLink
            href="/admin/customers"
            label="مشتریان"
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="8" r="4" />
                <path d="M2 21c0-4 3.5-6 7-6s7 2 7 6" />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// کامپوننت کمکی: لینک سریع
// ==========================================

function QuickLink({
  href,
  label,
  icon,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="group relative flex items-center gap-3 p-3.5 rounded-xl bg-white border border-coffee-200 hover:border-gold-400 hover:shadow-md hover:shadow-coffee-900/5 transition-all"
    >
      <div className="w-10 h-10 rounded-lg bg-cream-100 flex items-center justify-center text-coffee-600 group-hover:bg-gold-100 group-hover:text-gold-700 transition-colors shrink-0">
        {icon}
      </div>
      <span className="text-xs font-medium text-coffee-800 leading-5 flex-1">
        {label}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -left-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-gold-500 text-coffee-900 text-[10px] font-bold flex items-center justify-center fa-num shadow-sm">
          {badge.toLocaleString('fa-IR')}
        </span>
      )}
    </Link>
  );
}