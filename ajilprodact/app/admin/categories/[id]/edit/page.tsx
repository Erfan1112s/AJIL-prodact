// app/admin/categories/[id]/edit/page.tsx
// ویرایش دسته‌بندی

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getAdminCategoryById,
  getCategoriesForParentSelect,
} from '@/lib/queries/categories-admin';
import CategoryForm from '@/components/admin/categories/CategoryForm';

export const metadata: Metadata = {
  title: 'ویرایش دسته‌بندی',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;
  const categoryId = Number(id);

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    notFound();
  }

  const [category, categories] = await Promise.all([
    getAdminCategoryById(categoryId),
    getCategoriesForParentSelect(categoryId),
  ]);

  if (!category) notFound();

  return (
    <CategoryForm
      categories={categories}
      initial={{
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description ?? '',
        image_url: category.image_url ?? '',
        parent_id: category.parent_id,
        sort_order: category.sort_order,
        is_active: category.is_active === 1,
      }}
    />
  );
}