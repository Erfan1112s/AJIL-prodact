// app/categories/page.tsx
// لیست همه دسته‌بندی‌ها

import type { Metadata } from 'next';
import Link from 'next/link';
import { getCategoryTree } from '@/lib/queries/categories';

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
      <div className="bg-zinc-50 border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-3 text-sm text-zinc-600">
          <Link href="/" className="hover:text-brand-600">
            خانه
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-900">دسته‌بندی‌ها</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">دسته‌بندی‌ها</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tree.map((cat) => (
            <div
              key={cat.id}
              className="border border-zinc-200 rounded-lg p-4"
            >
              <Link
                href={`/categories/${cat.slug}`}
                className="text-lg font-semibold text-brand-700 hover:text-brand-800"
              >
                {cat.name}
              </Link>

              {cat.description && (
                <p className="text-sm text-zinc-600 mt-2">
                  {cat.description}
                </p>
              )}

              {cat.children.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-wrap gap-2">
                  {cat.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/categories/${child.slug}`}
                      className="text-xs px-2 py-1 bg-zinc-100 hover:bg-zinc-200 rounded"
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}