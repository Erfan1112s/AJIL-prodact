// lib/queries/customers-admin.ts
// کوئری‌های اختصاصی پنل ادمین برای مشتریان

import { queryRows } from '@/lib/db';
import type { CustomerRow, OrderRow } from '@/lib/types';

// ==========================================
// آمار کلی
// ==========================================

export interface CustomersSummary {
  totalCustomers: number;
  activeCustomers: number;
  newThisMonth: number;
  withOrders: number;
}

export async function getCustomersSummary(): Promise<CustomersSummary> {
  const rows = await queryRows<{
    total: number;
    active: number;
    this_month: number;
    with_orders: number;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM customers) AS total,
       (SELECT COUNT(*) FROM customers WHERE is_active = 1) AS active,
       (SELECT COUNT(*) FROM customers
        WHERE YEAR(created_at) = YEAR(CURDATE())
          AND MONTH(created_at) = MONTH(CURDATE())) AS this_month,
       (SELECT COUNT(*) FROM customers WHERE order_count > 0) AS with_orders`
  );

  const r = rows[0];
  return {
    totalCustomers: Number(r?.total ?? 0),
    activeCustomers: Number(r?.active ?? 0),
    newThisMonth: Number(r?.this_month ?? 0),
    withOrders: Number(r?.with_orders ?? 0),
  };
}

// ==========================================
// لیست مشتریان
// ==========================================

export interface AdminCustomerListItem {
  id: number;
  phone: string;
  full_name: string | null;
  email: string | null;
  order_count: number;
  last_order_at: Date | null;
  is_active: number;
  created_at: Date;
}

export interface GetAdminCustomersOptions {
  search?: string;
  sortBy?: 'recent' | 'orders' | 'name';
  onlyWithOrders?: boolean;
  limit?: number;
  offset?: number;
}

export async function getAdminCustomers(
  options: GetAdminCustomersOptions = {}
): Promise<AdminCustomerListItem[]> {
  const {
    search,
    sortBy = 'recent',
    onlyWithOrders = false,
    limit = 20,
    offset = 0,
  } = options;

  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];

  if (search && search.trim()) {
    conditions.push('(full_name LIKE ? OR phone LIKE ? OR email LIKE ?)');
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  if (onlyWithOrders) {
    conditions.push('order_count > 0');
  }

  const whereClause = conditions.join(' AND ');

  let orderBy = 'last_order_at DESC, created_at DESC';
  if (sortBy === 'orders') {
    orderBy = 'order_count DESC, last_order_at DESC';
  } else if (sortBy === 'name') {
    orderBy = 'full_name ASC, created_at DESC';
  }

  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 100);
  const safeOffset = Math.max(0, Math.floor(offset));

  const rows = await queryRows<AdminCustomerListItem>(
    `SELECT
       id, phone, full_name, email,
       order_count, last_order_at, is_active, created_at
     FROM customers
     WHERE ${whereClause}
     ORDER BY ${orderBy}
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  return rows.map((r) => ({
    ...r,
    order_count: Number(r.order_count),
  }));
}

export async function getAdminCustomersCount(
  options: GetAdminCustomersOptions = {}
): Promise<number> {
  const { search, onlyWithOrders = false } = options;
  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];

  if (search && search.trim()) {
    conditions.push('(full_name LIKE ? OR phone LIKE ? OR email LIKE ?)');
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  if (onlyWithOrders) {
    conditions.push('order_count > 0');
  }

  const whereClause = conditions.join(' AND ');

  const rows = await queryRows<{ count: number }>(
    `SELECT COUNT(*) AS count FROM customers WHERE ${whereClause}`,
    params
  );
  return Number(rows[0]?.count ?? 0);
}

// ==========================================
// یک مشتری
// ==========================================

export async function getAdminCustomerById(
  id: number
): Promise<CustomerRow | null> {
  const rows = await queryRows<CustomerRow>(
    `SELECT * FROM customers WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

// ==========================================
// سفارشات یک مشتری
// ==========================================

export async function getOrdersByCustomerId(
  customerId: number,
  limit = 20
): Promise<OrderRow[]> {
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 100);

  return queryRows<OrderRow>(
    `SELECT * FROM orders
     WHERE customer_id = ?
     ORDER BY created_at DESC
     LIMIT ${safeLimit}`,
    [customerId]
  );
}