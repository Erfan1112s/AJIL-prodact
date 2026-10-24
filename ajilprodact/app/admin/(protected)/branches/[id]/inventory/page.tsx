// app/admin/branches/[id]/inventory/page.tsx
// مدیریت موجودی یک شعبه (وزن‌محور)

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getAdminBranchById,
  getAdminBranches,
  getBranchProducts,
  getBranchProductsCount,
  getBranchInventoryStats,
} from '@/lib/queries/branches-admin';
import InventoryTable from '@/components/admin/branches/InventoryTable';

export const metadata: Metadata = {
  title: 'موجودی شعبه',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const PER_PAGE = 30;

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    search?: string;
    lowStock?: string;
    page?: string;
  }>;
}

export default async function BranchInventoryPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const branchId = Number(id);
  const sp = await searchParams;

  if (!Number.isInteger(branchId) || branchId <= 0) {
    notFound();
  }

  const branch = await getAdminBranchById(branchId);
  if (!branch) notFound();

  const search = sp.search ?? '';
  const onlyLowStock = sp.lowStock === '1';
  const currentPage = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const offset = (currentPage - 1) * PER_PAGE;

  const [items, totalCount, allBranches, stats] = await Promise.all([
    getBranchProducts({
      branchId,
      search,
      onlyLowStock,
      limit: PER_PAGE,
      offset,
    }),
    getBranchProductsCount({ branchId, search, onlyLowStock }),
    getAdminBranches(),
    getBranchInventoryStats(branchId),
  ]);

  const otherBranches = allBranches
    .filter((b) => b.id !== branchId && b.is_active === 1)
    .map((b) => ({ id: b.id, name: b.name }));

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  return (
    <InventoryTable
      branchId={branchId}
      branchName={branch.name}
      items={items}
      stats={stats}
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      currentSearch={search}
      onlyLowStock={onlyLowStock}
      otherBranches={otherBranches}
    />
  );
}