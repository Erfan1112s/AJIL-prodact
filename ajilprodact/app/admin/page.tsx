// app/admin/page.tsx
// داشبورد پنل ادمین

import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { logoutAction } from '@/app/admin/actions';

export const metadata: Metadata = {
  title: 'داشبورد',
  robots: { index: false, follow: false },
};

// خواندن آمار ساده از دیتابیس
async function getStats() {
  const [rows] = await db.query<
    Array<{
      products_count: number;
      categories_count: number;
      branches_count: number;
      customers_count: number;
    }>
  >(
    `SELECT
       (SELECT COUNT(*) FROM products WHERE is_active = 1) AS products_count,
       (SELECT COUNT(*) FROM categories WHERE is_active = 1) AS categories_count,
       (SELECT COUNT(*) FROM branches WHERE is_active = 1) AS branches_count,
       (SELECT COUNT(*) FROM customers WHERE is_active = 1) AS customers_count`
  );
  return rows[0]!;
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: 'محصولات فعال', value: stats.products_count, href: '/admin/products' },
    { label: 'دسته‌بندی‌ها', value: stats.categories_count, href: '/admin/categories' },
    { label: 'شعبات', value: stats.branches_count, href: '/admin/branches' },
    { label: 'مشتریان', value: stats.customers_count, href: '/admin/customers' },
  ];

  return (
    <div>
      {/* هدر */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-coffee-900">داشبورد</h1>
          <p className="text-sm text-coffee-500 mt-1">
            نمای کلی فروشگاه
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm text-coffee-600 hover:text-red-600 border border-coffee-200 hover:border-red-300 px-4 py-2 rounded-lg transition-colors"
          >
            خروج از حساب
          </button>
        </form>
      </div>

      {/* کارت‌های آمار */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl border border-coffee-200 bg-white p-5 hover:border-gold-400 transition-colors group"
          >
            <div className="text-xs text-coffee-500 mb-2">
              {card.label}
            </div>
            <div className="text-3xl font-bold text-coffee-900 fa-num group-hover:text-gold-700 transition-colors">
              {card.value.toLocaleString('fa-IR')}
            </div>
          </Link>
        ))}
      </div>

      {/* پیام موقت */}
      <div className="mt-8 rounded-2xl border border-gold-200 bg-gold-50 p-5 text-sm text-coffee-700">
        بخش‌های مدیریت محصول، دسته‌بندی، سفارشات و شعبات در حال ساخت
        هستند. در زیرزیرفازهای بعدی اضافه می‌شوند.
      </div>
    </div>
  );
}