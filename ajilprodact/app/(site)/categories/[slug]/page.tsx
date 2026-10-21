// app/categories/[slug]/page.tsx
// نمایش محصولات یک دسته خاص

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryBySlug } from '@/lib/queries/categories';
import { getProductsByCategory } from '@/lib/queries/products';
import ProductCard from '@/components/ProductCard';
import Container from '@/components/Container';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) return { title: 'دسته یافت نشد' };

  return {
    title: category.name,
    description:
      category.description ?? `محصولات دسته ${category.name}`,
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

export default async function CategoryProductsPage({ params }: Props) {
  const { slug } = await params;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const products = await getProductsByCategory(category.id, 50);

  return (
    <main className="min-h-screen">
      <div className="bg-cream-100 border-b border-coffee-200">
        <Container className="py-3 text-sm text-coffee-600">
          <Link href="/" className="hover:text-gold-700 transition-colors">
            خانه
          </Link>
          <span className="mx-2 text-coffee-400">/</span>
          <Link
            href="/categories"
            className="hover:text-gold-700 transition-colors"
          >
            دسته‌بندی‌ها
          </Link>
          <span className="mx-2 text-coffee-400">/</span>
          <span className="text-coffee-900">{category.name}</span>
        </Container>
      </div>

      <section className="bg-gradient-to-b from-gold-50/60 to-cream-50 border-b border-coffee-100">
        <Container className="py-10 sm:py-12">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-coffee-900 flex items-center justify-center text-2xl font-bold shrink-0 shadow-lg shadow-gold-500/30">
              {category.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-coffee-900 mb-1">
                {category.name}
              </h1>
              <p className="text-xs text-coffee-500 fa-num">
                {products.length.toLocaleString('fa-IR')} محصول در این دسته
              </p>
            </div>
          </div>

          {category.description && (
            <p className="text-sm text-coffee-600 max-w-2xl leading-7 mt-4">
              {category.description}
            </p>
          )}
        </Container>
      </section>

      <Container className="py-10">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-cream-100 mx-auto mb-4 flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-coffee-400"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
            <p className="text-coffee-500 mb-4">
              محصولی در این دسته ثبت نشده است.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 btn-gold px-5 py-2.5 rounded-xl text-sm"
            >
              مشاهده همه محصولات
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 4}
              />
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}