// app/admin/products/new/page.tsx
// افزودن محصول جدید

import type { Metadata } from 'next';
import { getCategoriesForSelect } from '@/lib/queries/products-admin';
import ProductForm from '@/components/admin/products/ProductForm';

export const metadata: Metadata = {
  title: 'افزودن محصول',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const categories = await getCategoriesForSelect();

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-gold-200 bg-gold-50 p-6 text-center">
        <p className="text-sm text-coffee-700 mb-3">
          برای افزودن محصول، ابتدا باید حداقل یک دسته‌بندی ایجاد کنید.
        </p>
        <a
          href="/admin/categories/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-gold text-sm font-bold"
        >
          افزودن دسته‌بندی
        </a>
      </div>
    );
  }

  return <ProductForm categories={categories} />;
}