// components/Header.tsx
// نوار بالای سایت
// دو بخش: نوار بالا (تماس) + نوار اصلی (لوگو، منو، آیکون‌ها)

import Link from 'next/link';
import { getCategoryTree } from '@/lib/queries/categories';
import {
  CartIcon,
  PhoneIcon,
  UserIcon,
  MenuIcon,
} from '@/components/icons';
import MobileMenu from '@/components/MobileMenu';

// Server Component: داده از دیتابیس می‌گیرد
export default async function Header() {
  // گرفتن دسته‌بندی‌ها برای منو
  const categories = await getCategoryTree();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-ink-200">
      {/* نوار بالایی: تماس */}
      <div className="bg-ink-900 text-ink-100 text-xs">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhoneIcon className="w-3.5 h-3.5" />
            <span className="fa-num">۰۲۱-۸۸۷۷۶۶۵۵</span>
          </div>
          <div className="hidden sm:block">
            ارسال به سراسر کشور — پرداخت امن
          </div>
        </div>
      </div>

      {/* نوار اصلی */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="h-16 flex items-center justify-between gap-6">
          {/* لوگو */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
            aria-label="خانه"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-lg font-bold">
              آ
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-ink-900 leading-tight">
                آجیل و خشکبار
              </div>
              <div className="text-[10px] text-ink-500 leading-tight">
                فروش آنلاین و حضوری
              </div>
            </div>
          </Link>

          {/* منوی اصلی - فقط در دسکتاپ */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              href="/products"
              className="px-3 py-2 text-sm text-ink-700 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
            >
              همه محصولات
            </Link>

            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="px-3 py-2 text-sm text-ink-700 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          {/* آیکون‌های چپ */}
          <div className="flex items-center gap-1">
            <Link
              href="/cart"
              className="relative p-2 hover:bg-ink-100 rounded-lg transition-colors"
              aria-label="سبد خرید"
            >
              <CartIcon className="w-5 h-5 text-ink-700" />
              {/* نشان تعداد - فعلا ثابت */}
              <span className="absolute -top-0.5 -left-0.5 w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] flex items-center justify-center fa-num">
                ۰
              </span>
            </Link>

            <Link
              href="/admin"
              className="hidden sm:block p-2 hover:bg-ink-100 rounded-lg transition-colors"
              aria-label="ورود"
            >
              <UserIcon className="w-5 h-5 text-ink-700" />
            </Link>

            {/* دکمه منوی موبایل */}
            <MobileMenu categories={categories} />
          </div>
        </div>
      </div>
    </header>
  );
}