// app/admin/orders/page.tsx
// لیست سفارشات پنل ادمین

import type { Metadata } from 'next';
import {
  getAdminOrders,
  getAdminOrdersCount,
  getOrderStatusStats,
} from '@/lib/queries/orders-admin';
import OrdersTable from '@/components/admin/orders/OrdersTable';
import type { OrderStatus, DeliveryMethod } from '@/lib/types';

export const metadata: Metadata = {
  title: 'سفارشات',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const PER_PAGE = 20;

const VALID_STATUSES: OrderStatus[] = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

interface Props {
  searchParams: Promise<{
    search?: string;
    status?: string;
    delivery?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const params = await searchParams;

  const search = params.search ?? '';
  const status: OrderStatus | 'ALL' =
    params.status &&
    VALID_STATUSES.includes(params.status as OrderStatus)
      ? (params.status as OrderStatus)
      : 'ALL';
  const delivery: DeliveryMethod | 'ALL' =
    params.delivery === 'SHIPPING' || params.delivery === 'PICKUP'
      ? (params.delivery as DeliveryMethod)
      : 'ALL';
  const fromDate = params.from ?? '';
  const toDate = params.to ?? '';

  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const offset = (currentPage - 1) * PER_PAGE;

  const [orders, totalCount, stats] = await Promise.all([
    getAdminOrders({
      search,
      status,
      deliveryMethod: delivery,
      fromDate,
      toDate,
      limit: PER_PAGE,
      offset,
    }),
    getAdminOrdersCount({
      search,
      status,
      deliveryMethod: delivery,
      fromDate,
      toDate,
    }),
    getOrderStatusStats(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  return (
    <OrdersTable
      orders={orders}
      stats={stats}
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      currentSearch={search}
      currentStatus={status}
      currentDelivery={delivery}
      currentFromDate={fromDate}
      currentToDate={toDate}
    />
  );
}