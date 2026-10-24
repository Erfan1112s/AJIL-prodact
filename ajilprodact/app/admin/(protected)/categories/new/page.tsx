// app/admin/categories/new/page.tsx
// افزودن دسته‌بندی جدید

import type { Metadata } from 'next';
import { getCategoriesForParentSelect } from '@/lib/queries/categories-admin';
import CategoryForm from '@/components/admin/categories/CategoryForm';

export const metadata: Metadata = {
  title: 'افزودن دسته‌بندی',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function NewCategoryPage() {
  const categories = await getCategoriesForParentSelect();
  return <CategoryForm categories={categories} />;
}