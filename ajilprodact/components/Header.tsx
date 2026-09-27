// components/Header.tsx
// نوار بالای سایت با پالت قهوه‌ای و طلایی

import Link from 'next/link';
import { getCategoryTree } from '@/lib/queries/categories';
import {
  CartIcon,
  PhoneIcon,
  UserIcon,
} from '@/components/icons';
import MobileMenu from '@/components/MobileMenu';

export default async function Header() {
  const categories = await getCategoryTree();

  return (
    <header className="sticky top-0 z-40 bg-cream-50 border-b border-coffee-200 shadow-sm">
      {/* نوار بالایی: تماس */}
      <div className="bg-coffee-800 text-cream-100 text-xs">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhoneIcon className="w-3.5 h-3.5 text-gold-400" />
            <span className="fa-num">۰۲۱-۸۸۷۷۶۶۵۵</span>
          </div>
          <div className="hidden sm:block text-cream-200">
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-coffee-900 text-lg font-bold shadow-lg shadow-gold-500/30">
              آ
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-coffee-900 leading-tight">
                آجیل و خشکبار
              </div>
              <div className="text-[10px] text-coffee-500 leading-tight">
                فروش آنلاین و حضوری
              </div>
            </div>
          </Link>

          {/* منوی اصلی - دسکتاپ */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              href="/products"
              className="px-3 py-2 text-sm text-coffee-700 hover:text-gold-700 hover:bg-gold-50 rounded-lg transition-colors"
            >
              همه محصولات
            </Link>

            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="px-3 py-2 text-sm text-coffee-700 hover:text-gold-700 hover:bg-gold-50 rounded-lg transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          {/* آیکون‌ها */}
          <div className="flex items-center gap-1">
            <Link
              href="/cart"
              className="relative p-2 hover:bg-coffee-100 rounded-lg transition-colors"
              aria-label="سبد خرید"
            >
              <CartIcon className="w-5 h-5 text-coffee-700" />
              <span className="absolute -top-0.5 -left-0.5 w-4 h-4 rounded-full bg-gold-500 text-coffee-900 text-[10px] font-bold flex items-center justify-center fa-num shadow-sm">
                ۰
              </span>
            </Link>

            <Link
              href="/admin"
              className="hidden sm:block p-2 hover:bg-coffee-100 rounded-lg transition-colors"
              aria-label="ورود"
            >
              <UserIcon className="w-5 h-5 text-coffee-700" />
            </Link>

            <MobileMenu categories={categories} />
          </div>
        </div>
      </div>
    </header>
  );
}