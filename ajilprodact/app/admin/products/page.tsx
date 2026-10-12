// app/admin/products/page.tsx
// لیست محصولات پنل ادمین

import type { Metadata } from 'next';
import {
  getAdminProducts,
  getAdminProductsCount,
  getCategoriesForSelect,
} from '@/lib/queries/products-admin';
import ProductsTable from '@/components/admin/products/ProductsTable';

export const metadata: Metadata = {
  title: 'محصولات',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const PER_PAGE = 15;

interface Props {
  searchParams: Promise<{
    search?: string;
    category?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const search = params.search ?? '';
  const categoryId = params.category ? Number(params.category) : undefined;
  const status = (params.status as 'all' | 'active' | 'inactive') ?? 'all';
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const offset = (currentPage - 1) * PER_PAGE;

  const [products, totalCount, categories] = await Promise.all([
    getAdminProducts({
      search,
      categoryId,
      status,
      limit: PER_PAGE,
      offset,
    }),
    getAdminProductsCount({ search, categoryId, status }),
    getCategoriesForSelect(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  return (
    <ProductsTable
      products={products}
      categories={categories}
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      currentSearch={search}
      currentCategory={categoryId ?? null}
      currentStatus={status}
    />
  );
}