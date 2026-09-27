// app/products/page.tsx
// لیست همه محصولات با صفحه‌بندی

import type { Metadata } from 'next';
import Link from 'next/link';
import { getProducts } from '@/lib/queries/products';
import ProductCard from '@/components/ProductCard';
import Container from '@/components/Container';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/icons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'همه محصولات',
  description: 'لیست کامل محصولات آجیل و خشکبار با امکان خرید آنلاین و حضوری',
  alternates: {
    canonical: '/products',
  },
};

// تعداد محصول در هر صفحه
const PER_PAGE = 12;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const { page } = await searchParams;

  // محاسبه شماره صفحه معتبر
  const currentPage = Math.max(1, parseInt(page ?? '1', 10) || 1);
  const offset = (currentPage - 1) * PER_PAGE;

  // گرفتن محصولات
  const products = await getProducts({
    limit: PER_PAGE,
    offset,
  });

  // اگر تعداد کمتری از PER_PAGE برگشت، یعنی آخرین صفحه است
  const hasNextPage = products.length === PER_PAGE;
  const hasPrevPage = currentPage > 1;

  return (
    <main className="min-h-screen">
      {/* breadcrumb */}
      <div className="bg-ink-50 border-b border-ink-200">
        <Container className="py-3 text-sm text-ink-600">
          <Link href="/" className="hover:text-brand-700 transition-colors">
            خانه
          </Link>
          <span className="mx-2 text-ink-400">/</span>
          <span className="text-ink-900">همه محصولات</span>
        </Container>
      </div>

      {/* هدر صفحه */}
      <section className="bg-gradient-to-b from-brand-50/50 to-white border-b border-ink-100">
        <Container className="py-10 sm:py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-brand-500 to-brand-700" />
            <h1 className="text-2xl sm:text-3xl font-bold text-ink-900">
              همه محصولات
            </h1>
          </div>
          <p className="text-sm text-ink-600 max-w-xl leading-7">
            کاتالوگ کامل آجیل و خشکبار با شناسنامه بچ و امتیاز تازگی.
            ارسال به سراسر کشور یا تحویل حضوری از شعبه.
          </p>
        </Container>
      </section>

      {/* محتوای اصلی */}
      <Container className="py-10">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-ink-100 mx-auto mb-4 flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-ink-400"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
            <p className="text-ink-500">هنوز محصولی ثبت نشده است.</p>
          </div>
        ) : (
          <>
            {/* گرید محصولات */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 4}
                />
              ))}
            </div>

            {/* صفحه‌بندی */}
            {(hasPrevPage || hasNextPage) && (
              <div className="flex items-center justify-center gap-3 mt-12">
                {hasPrevPage ? (
                  <Link
                    href={`/products?page=${currentPage - 1}`}
                    className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-ink-200 text-ink-800 text-sm font-medium hover:border-brand-500 hover:text-brand-700 transition-colors"
                  >
                    {/* در RTL، قبلی یعنی به راست */}
                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    قبلی
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-ink-100 text-ink-300 text-sm cursor-not-allowed">
                    <ArrowRightIcon className="w-4 h-4" />
                    قبلی
                  </span>
                )}

                <span className="px-4 py-2.5 text-sm text-ink-600 fa-num">
                  صفحه {currentPage.toLocaleString('fa-IR')}
                </span>

                {hasNextPage ? (
                  <Link
                    href={`/products?page=${currentPage + 1}`}
                    className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20"
                  >
                    بعدی
                    <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-ink-100 text-ink-300 text-sm cursor-not-allowed">
                    بعدی
                    <ArrowLeftIcon className="w-4 h-4" />
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </Container>
    </main>
  );
}