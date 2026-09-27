// app/categories/[slug]/page.tsx
// نمایش محصولات یک دسته خاص

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryBySlug } from '@/lib/queries/categories';
import { getProductsByCategory } from '@/lib/queries/products';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

// متادیتای داینامیک بر اساس دسته
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) return { title: 'دسته یافت نشد' };

  return {
    title: category.name,
    description:
      category.description ?? `محصولات دسته ${category.name}`,
    alternates: {
      canonical: `/categories/${category.slug}`,
    },
  };
}

function formatPrice(price: number): string {
  return price.toLocaleString('fa-IR');
}

export default async function CategoryProductsPage({ params }: Props) {
  const { slug } = await params;

  // گرفتن دسته
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  // گرفتن محصولات این دسته
  const products = await getProductsByCategory(category.id, 50);

  return (
    <main className="min-h-screen">
      <div className="bg-zinc-50 border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-3 text-sm text-zinc-600">
          <Link href="/" className="hover:text-brand-600">
            خانه
          </Link>
          <span className="mx-2">/</span>
          <Link href="/categories" className="hover:text-brand-600">
            دسته‌بندی‌ها
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-900">{category.name}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-zinc-600 text-sm mb-6">
            {category.description}
          </p>
        )}

        {products.length === 0 ? (
          <p className="text-zinc-500">
            محصولی در این دسته ثبت نشده است.
          </p>
        ) : (
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
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xs text-zinc-500">شروع از</span>
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
        )}
      </div>
    </main>
  );
}