// app/admin/(protected)/page.tsx
// داشبورد پنل ادمین

import Link from 'next/link';
import { queryRows } from '@/lib/db';

interface Stats {
  products: number;
  categories: number;
  branches: number;
  customers: number;
  orders: number;
  reviews: number;
}

async function getStats(): Promise<Stats> {
  const [p] = await queryRows<{ c: number }>('SELECT COUNT(*) AS c FROM products');
  const [c] = await queryRows<{ c: number }>('SELECT COUNT(*) AS c FROM categories');
  const [b] = await queryRows<{ c: number }>('SELECT COUNT(*) AS c FROM branches');
  const [cu] = await queryRows<{ c: number }>('SELECT COUNT(*) AS c FROM customers');
  const [o] = await queryRows<{ c: number }>('SELECT COUNT(*) AS c FROM orders');
  const [r] = await queryRows<{ c: number }>(
    `SELECT COUNT(*) AS c FROM product_reviews WHERE is_approved = 0`
  );

  return {
    products: Number(p?.c ?? 0),
    categories: Number(c?.c ?? 0),
    branches: Number(b?.c ?? 0),
    customers: Number(cu?.c ?? 0),
    orders: Number(o?.c ?? 0),
    reviews: Number(r?.c ?? 0),
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: 'محصولات', value: stats.products, href: '/admin/products', color: 'bg-blue-50 text-blue-700' },
    { label: 'دسته‌بندی‌ها', value: stats.categories, href: '/admin/categories', color: 'bg-purple-50 text-purple-700' },
    { label: 'شعبات', value: stats.branches, href: '/admin/branches', color: 'bg-green-50 text-green-700' },
    { label: 'مشتریان', value: stats.customers, href: '/admin/customers', color: 'bg-orange-50 text-orange-700' },
    { label: 'سفارشات', value: stats.orders, href: '/admin/orders', color: 'bg-pink-50 text-pink-700' },
    { label: 'نظرات در انتظار', value: stats.reviews, href: '/admin/reviews', color: 'bg-yellow-50 text-yellow-700' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-coffee-900">داشبورد</h1>
        <p className="text-sm text-coffee-600 mt-1">خلاصهٔ وضعیت فروشگاه</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`rounded-xl p-5 ${card.color} hover:shadow-md transition-shadow`}
          >
            <div className="text-3xl font-bold">{card.value.toLocaleString('fa-IR')}</div>
            <div className="text-sm mt-1 opacity-80">{card.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}