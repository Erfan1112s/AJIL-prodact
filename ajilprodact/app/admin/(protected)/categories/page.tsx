// app/admin/categories/page.tsx
// لیست دسته‌بندی‌ها

import type { Metadata } from 'next';
import { getAdminCategoryTree } from '@/lib/queries/categories-admin';
import CategoriesTable from '@/components/admin/categories/CategoriesTable';

export const metadata: Metadata = {
  title: 'دسته‌بندی‌ها',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const tree = await getAdminCategoryTree();

  return <CategoriesTable tree={tree} />;
}