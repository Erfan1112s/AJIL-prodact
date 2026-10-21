// app/cart/page.tsx
// صفحه سبد خرید

import type { Metadata } from 'next';
import Link from 'next/link';
import Container from '@/components/Container';
import CartClient from '@/components/CartClient';

export const metadata: Metadata = {
  title: 'سبد خرید',
  description: 'مشاهده و ویرایش سبد خرید',
  // صفحات پویا نباید ایندکس شوند
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartPage() {
  return (
    <main className="min-h-screen">
      {/* breadcrumb */}
      <div className="bg-cream-100 border-b border-coffee-200">
        <Container className="py-3 text-sm text-coffee-600">
          <Link href="/" className="hover:text-gold-700 transition-colors">
            خانه
          </Link>
          <span className="mx-2 text-coffee-400">/</span>
          <span className="text-coffee-900">سبد خرید</span>
        </Container>
      </div>

      {/* هدر صفحه */}
      <section className="bg-gradient-to-b from-gold-50/60 to-cream-50 border-b border-coffee-100">
        <Container className="py-10 sm:py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-gold-400 to-gold-700" />
            <h1 className="text-2xl sm:text-3xl font-bold text-coffee-900">
              سبد خرید
            </h1>
          </div>
          <p className="text-sm text-coffee-600">
            محصولات انتخابی خود را بررسی و ویرایش کنید.
          </p>
        </Container>
      </section>

      {/* محتوای سبد - Client Component */}
      <Container className="py-10">
        <CartClient />
      </Container>
    </main>
  );
}
