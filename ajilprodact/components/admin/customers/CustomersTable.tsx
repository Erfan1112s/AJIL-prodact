// components/admin/customers/CustomersTable.tsx
// حداقل نسخه — قابل توسعه

import Link from 'next/link';

interface CustomerRow {
  id: number;
  full_name: string | null;
  phone: string;
  created_at: string;
  orders_count?: number;
  total_spent?: number;
}

interface Props {
  customers: CustomerRow[];
  summary: unknown;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  currentSearch: string;
  currentSort: string;
  onlyWithOrders: boolean;
}

export default function CustomersTable({
  customers,
  totalCount,
  currentPage,
  currentSearch,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-coffee-900">مشتریان</h1>
        <span className="text-sm text-coffee-600">{totalCount} نفر</span>
      </div>

      <form className="flex gap-2">
        <input
          type="text"
          name="search"
          defaultValue={currentSearch}
          placeholder="جستجو بر اساس نام یا شماره..."
          className="flex-1 px-3 py-2 rounded-lg border border-coffee-200 text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-gold-600 text-white text-sm font-medium"
        >
          جستجو
        </button>
      </form>

      <div className="rounded-xl border border-coffee-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream-100">
            <tr>
              <th className="px-4 py-3 text-right">نام</th>
              <th className="px-4 py-3 text-right">شماره</th>
              <th className="px-4 py-3 text-right">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-coffee-500">
                  مشتری‌ای یافت نشد
                </td>
              </tr>
            )}
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-coffee-100">
                <td className="px-4 py-3">{c.full_name ?? '—'}</td>
                <td className="px-4 py-3 font-mono">{c.phone}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/customers/${c.id}`}
                    className="text-gold-700 hover:underline"
                  >
                    جزئیات
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {currentPage < 1 && null}
    </div>
  );
}