// app/categories/page.tsx
// لیست همه دسته‌بندی‌ها

import type { Metadata } from 'next';
import Link from 'next/link';
import { getCategoryTree } from '@/lib/queries/categories';
import Container from '@/components/Container';
import { ArrowLeftIcon } from '@/components/icons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'دسته‌بندی‌ها',
  description: 'همه دسته‌بندی‌های محصولات آجیل و خشکبار',
  alternates: { canonical: '/categories' },
};

export default async function CategoriesPage() {
  const tree = await getCategoryTree();

  return (
    <main className="min-h-screen">
      <div className="bg-cream-100 border-b border-coffee-200">
        <Container className="py-3 text-sm text-coffee-600">
          <Link href="/" className="hover:text-gold-700 transition-colors">
            خانه
          </Link>
          <span className="mx-2 text-coffee-400">/</span>
          <span className="text-coffee-900">دسته‌بندی‌ها</span>
        </Container>
      </div>

      <section className="bg-gradient-to-b from-gold-50/60 to-cream-50 border-b border-coffee-100">
        <Container className="py-10 sm:py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-gold-400 to-gold-700" />
            <h1 className="text-2xl sm:text-3xl font-bold text-coffee-900">
              دسته‌بندی‌ها
            </h1>
          </div>
          <p className="text-sm text-coffee-600 max-w-xl leading-7">
            محصولات خود را از دسته‌بندی‌های متنوع انتخاب کنید. هر دسته
            شامل زیرشاخه‌های تخصصی است.
          </p>
        </Container>
      </section>

      <Container className="py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tree.map((cat) => (
            <div
              key={cat.id}
              className="rounded-2xl border border-coffee-200 bg-white overflow-hidden card-warm"
            >
              <Link
                href={`/categories/${cat.slug}`}
                className="group block p-5 border-b border-coffee-100 hover:bg-gold-50/40 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-coffee-900 flex items-center justify-center text-xl font-bold shrink-0 shadow-lg shadow-gold-500/20">
                    {cat.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-coffee-900 group-hover:text-gold-700 transition-colors truncate">
                      {cat.name}
                    </h2>
                    {cat.children.length > 0 && (
                      <p className="text-xs text-coffee-500 fa-num">
                        {cat.children.length.toLocaleString('fa-IR')} زیردسته
                      </p>
                    )}
                  </div>
                  <ArrowLeftIcon className="w-5 h-5 text-coffee-300 group-hover:text-gold-600 group-hover:-translate-x-1 transition-all shrink-0" />
                </div>

                {cat.description && (
                  <p className="text-sm text-coffee-600 leading-6 line-clamp-2">
                    {cat.description}
                  </p>
                )}
              </Link>

              {cat.children.length > 0 && (
                <div className="p-3 bg-cream-100/60">
                  <div className="space-y-1">
                    {cat.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/categories/${child.slug}`}
                        className="group flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-white transition-colors"
                      >
                        <span className="text-sm text-coffee-700 group-hover:text-gold-700 transition-colors">
                          {child.name}
                        </span>
                        <ArrowLeftIcon className="w-3.5 h-3.5 text-coffee-300 group-hover:text-gold-600 group-hover:-translate-x-0.5 transition-all" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </main>
  );
}