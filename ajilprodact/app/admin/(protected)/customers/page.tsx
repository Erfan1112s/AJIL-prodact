// app/admin/(protected)/customers/page.tsx
// لیست مشتریان

import type { Metadata } from 'next';
import {
  getAdminCustomers,
  getAdminCustomersCount,
  getCustomersSummary,
} from '@/lib/queries/customers-admin';
import CustomersTable from '@/components/admin/customers/CustomersTable';  // ← مسیر درست

export const metadata: Metadata = {
  title: 'مشتریان',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const PER_PAGE = 20;

interface Props {
  searchParams: Promise<{
    search?: string;
    sort?: string;
    withOrders?: string;
    page?: string;
  }>;
}

export default async function AdminCustomersPage({ searchParams }: Props) {
  const params = await searchParams;
  const search = params.search ?? '';
  const sortBy = (params.sort as 'recent' | 'orders' | 'name') ?? 'recent';
  const onlyWithOrders = params.withOrders === '1';
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const offset = (currentPage - 1) * PER_PAGE;

  const [customers, totalCount, summary] = await Promise.all([
    getAdminCustomers({
      search,
      sortBy,
      onlyWithOrders,
      limit: PER_PAGE,
      offset,
    }),
    getAdminCustomersCount({ search, onlyWithOrders }),
    getCustomersSummary(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  return (
    <CustomersTable
      customers={customers}
      summary={summary}
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      currentSearch={search}
      currentSort={sortBy}
      onlyWithOrders={onlyWithOrders}
    />
  );
}