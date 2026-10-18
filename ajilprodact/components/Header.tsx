// components/Header.tsx
// نوار بالای سایت

import Link from 'next/link';
import { getCategoryTree } from '@/lib/queries/categories';
import { CartIcon, PhoneIcon } from '@/components/icons';
import MobileMenu from '@/components/MobileMenu';
import CartCountBadge from '@/components/cartcountbadge';
import CustomerMenuButton from '@/components/CustomerMenuButton';

export default async function Header() {
  const categories = await getCategoryTree();

  return (
    <header className="sticky top-0 z-50 border-b border-coffee-200/80 bg-cream-50/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(52,38,26,0.04)]">
      <div className="bg-gradient-to-r from-coffee-900 via-coffee-800 to-coffee-900 text-cream-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
          <div className="flex items-center gap-2 text-[11px] sm:text-xs">
            <PhoneIcon className="h-3.5 w-3.5 text-gold-400" />
            <span className="fa-num">۰۲۱-۸۸۷۷۶۶۵۵</span>
          </div>

          <div className="hidden items-center gap-2 text-[10px] text-cream-200 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            ارسال به سراسر کشور — پرداخت امن
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-3 sm:h-20">
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="خانه">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-600 text-lg font-black text-coffee-900 shadow-[0_8px_18px_rgba(245,158,11,0.28)]">
              آ
            </div>
            <div className="hidden sm:block">
              <div className="text-base font-black leading-tight text-coffee-900">
                آجیل و خشکبار
              </div>
              <div className="text-[10px] font-medium tracking-[0.06em] text-coffee-500">
                FRESH • NATURAL
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <Link
              href="/products"
              className="rounded-full px-3 py-2 text-sm font-medium text-coffee-700 transition-colors hover:bg-gold-50 hover:text-gold-700"
            >
              همه محصولات
            </Link>

            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="rounded-full px-3 py-2 text-sm font-medium text-coffee-700 transition-colors hover:bg-gold-50 hover:text-gold-700"
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <Link
              href="/cart"
              className="relative rounded-full p-2.5 text-coffee-700 transition-colors hover:bg-coffee-100 hover:text-gold-700"
              aria-label="سبد خرید"
            >
              <CartIcon className="h-5 w-5" />
              <CartCountBadge />
            </Link>

            <CustomerMenuButton />
            <MobileMenu categories={categories} />
          </div>
        </div>
      </div>
    </header>
  );
}