// app/page.tsx
// صفحه اصلی، نمایش محصولات منتخب از دیتابیس

import { getFeaturedProducts } from '@/lib/queries/products';
import { getCategoryTree } from '@/lib/queries/categories';
import Image from 'next/image';
import Link from 'next/link';

// این صفحه در هر درخواست از دیتابیس می‌خواند
// در فاز بعد با ISR یا revalidate جایگزین می‌شود
export const dynamic = 'force-dynamic';

// تابع کمکی برای نمایش قیمت با جداکننده فارسی
function formatPrice(price: number): string {
  // toLocaleString با fa-IR عدد را با جداکننده فارسی برمی‌گرداند
  // مثال: 450000 -> "۴۵۰٬۰۰۰"
  return price.toLocaleString('fa-IR');
}

// کامپوننت اصلی
export default async function HomePage() {
  // گرفتن داده از دیتابیس به صورت موازی
  // هر دو کوئری همزمان اجرا می‌شوند
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(4),
    getCategoryTree(),
  ]);

  return (
    <main className="min-h-screen">
      {/* بخش Hero */}
      <section className="bg-brand-50 py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-900 mb-4">
            کاتالوگ آجیل و خشکبار
          </h1>
          <p className="text-zinc-600 text-lg">
            محصولات تازه و با کیفیت، با امکان خرید آنلاین و حضوری از شعب
          </p>
        </div>
      </section>

      {/* بخش دسته‌بندی‌ها */}
      <section className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-xl font-bold mb-4">دسته‌بندی‌ها</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-sm transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* بخش محصولات منتخب */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-xl font-bold mb-4">محصولات منتخب</h2>

        {featured.length === 0 ? (
          <p className="text-zinc-500">هنوز محصولی ثبت نشده است.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="border border-zinc-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* تصویر محصول */}
                <div className="aspect-square bg-zinc-100 relative">
                  {product.primary_image ? (
                    <Image
                      src={product.primary_image.url}
                      alt={product.primary_image.alt ?? product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                      بدون تصویر
                    </div>
                  )}
                </div>

                {/* اطلاعات محصول */}
                <div className="p-3">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mb-2">
                    {product.category.name}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-zinc-500">شروع از</span>
                    <span className="font-bold text-brand-700 fa-num">
                      {formatPrice(product.min_price)}
                      <span className="text-xs font-normal mr-1">تومان</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}