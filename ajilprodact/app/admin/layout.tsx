// app/admin/layout.tsx
// لایوت پنل ادمین

import type { ReactNode } from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-50">
      {/* نوار بالا */}
      <header className="bg-coffee-800 text-cream-100">
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-coffee-900 font-bold text-sm">
              آ
            </div>
            <span className="font-bold">پنل مدیریت</span>
          </Link>
          <Link
            href="/"
            className="text-xs text-cream-200 hover:text-gold-400 transition-colors"
          >
            بازگشت به سایت
          </Link>
        </div>
      </header>

      {/* محتوا */}
      <main className="max-w-7xl mx-auto p-5">{children}</main>
    </div>
  );
}