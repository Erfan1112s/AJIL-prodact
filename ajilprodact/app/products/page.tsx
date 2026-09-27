// app/products/page.tsx
// لیست همه محصولات با صفحه‌بندی

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getProducts } from '@/lib/queries/products';

export const dynamic = 'force-dynamic';

// متادیتای این صفحه
export const metadata: Metadata = {
  title: 'همه محصولات',
  description: 'لیست کامل محصولات آجیل و خشکبار',
  alternates: {
    canonical: '/products',
  },
};

// تعداد محصول در هر صفحه
const PER_PAGE = 12;

interface Props {
  // searchParams هم در Next.js 15+ یک Promise است
  searchParams: Promise<{ page?: string }>;
}

// تابع کمکی قیمت
function formatPrice(price: number): string {
  return price.toLocaleString('fa-IR');
}

export default async function ProductsPage({ searchParams }: Props) {
  const { page } = await searchParams;

  // شماره صفحه را از پارامتر بگیر، پیش‌فرض ۱
  // parseInt و fallback به ۱ اگر نامعتبر بود
  const currentPage = Math.max(1, parseInt(page ?? '1', 10) || 1);

  // محاسبه offset
  const offset = (currentPage - 1) * PER_PAGE;

  // گرفتن محصولات
  const products = await getProducts({
    limit: PER_PAGE,
    offset,
  });

  // آیا صفحه بعدی وجود دارد؟
  // اگر تعداد کمتری از PER_PAGE برگشت، یعنی آخرین صفحه
  const hasNextPage = products.length === PER_PAGE;

  return (
    <main className="min-h-screen">
      <div className="bg-zinc-50 border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-3 text-sm text-zinc-600">
          <Link href="/" className="hover:text-brand-600">
            خانه
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-900">همه محصولات</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">همه محصولات</h1>

        {products.length === 0 ? (
          <p className="text-zinc-500">هنوز محصولی ثبت نشده است.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="border border-zinc-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-zinc-100 relative">
                    {product.primary_image ? (
                      <Image
                        src={product.primary_image.url}
                        alt={product.primary_image.alt ?? product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                        بدون تصویر
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mb-2">
                      {product.category.name}
                    </p>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-zinc-500">
                        شروع از
                      </span>
                      <span className="font-bold text-brand-700 fa-num">
                        {formatPrice(product.min_price)}
                        <span className="text-xs font-normal mr-1">
                          تومان
                        </span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* صفحه‌بندی */}
            <div className="flex justify-center items-center gap-2 mt-8">
              {currentPage > 1 && (
                <Link
                  href={`/products?page=${currentPage - 1}`}
                  className="px-4 py-2 border border-zinc-300 rounded-lg text-sm hover:bg-zinc-50"
                >
                  قبلی
                </Link>
              )}

              <span className="px-4 py-2 text-sm text-zinc-600 fa-num">
                صفحه {currentPage.toLocaleString('fa-IR')}
              </span>

              {hasNextPage && (
                <Link
                  href={`/products?page=${currentPage + 1}`}
                  className="px-4 py-2 border border-zinc-300 rounded-lg text-sm hover:bg-zinc-50"
                >
                  بعدی
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}