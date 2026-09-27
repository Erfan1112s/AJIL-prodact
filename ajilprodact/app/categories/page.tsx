// app/categories/page.tsx
// لیست همه دسته‌بندی‌ها به صورت درختی

import type { Metadata } from 'next';
import Link from 'next/link';
import { getCategoryTree } from '@/lib/queries/categories';
import Container from '@/components/Container';
import { ArrowLeftIcon } from '@/components/icons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'دسته‌بندی‌ها',
  description: 'همه دسته‌بندی‌های محصولات آجیل و خشکبار',
  alternates: {
    canonical: '/categories',
  },
};

export default async function CategoriesPage() {
  const tree = await getCategoryTree();

  return (
    <main className="min-h-screen">
      <div className="bg-ink-50 border-b border-ink-200">
        <Container className="py-3 text-sm text-ink-600">
          <Link href="/" className="hover:text-brand-700 transition-colors">
            خانه
          </Link>
          <span className="mx-2 text-ink-400">/</span>
          <span className="text-ink-900">دسته‌بندی‌ها</span>
        </Container>
      </div>

      <section className="bg-gradient-to-b from-brand-50/50 to-white border-b border-ink-100">
        <Container className="py-10 sm:py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-brand-500 to-brand-700" />
            <h1 className="text-2xl sm:text-3xl font-bold text-ink-900">
              دسته‌بندی‌ها
            </h1>
          </div>
          <p className="text-sm text-ink-600 max-w-xl leading-7">
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
              className="rounded-2xl border border-ink-200 bg-white overflow-hidden card-soft"
            >
              {/* سربرگ دسته */}
              <Link
                href={`/categories/${cat.slug}`}
                className="group block p-5 border-b border-ink-100 hover:bg-brand-50/40 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-lg shadow-brand-600/20">
                    {cat.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-ink-900 group-hover:text-brand-700 transition-colors truncate">
                      {cat.name}
                    </h2>
                    {cat.children.length > 0 && (
                      <p className="text-xs text-ink-500 fa-num">
                        {cat.children.length.toLocaleString('fa-IR')} زیردسته
                      </p>
                    )}
                  </div>
                  <ArrowLeftIcon className="w-5 h-5 text-ink-300 group-hover:text-brand-600 group-hover:-translate-x-1 transition-all shrink-0" />
                </div>

                {cat.description && (
                  <p className="text-sm text-ink-600 leading-6 line-clamp-2">
                    {cat.description}
                  </p>
                )}
              </Link>

              {/* لیست زیردسته‌ها */}
              {cat.children.length > 0 && (
                <div className="p-3 bg-ink-50/50">
                  <div className="space-y-1">
                    {cat.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/categories/${child.slug}`}
                        className="group flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-white transition-colors"
                      >
                        <span className="text-sm text-ink-700 group-hover:text-brand-700 transition-colors">
                          {child.name}
                        </span>
                        <ArrowLeftIcon className="w-3.5 h-3.5 text-ink-300 group-hover:text-brand-600 group-hover:-translate-x-0.5 transition-all" />
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