// lib/queries/orders-admin.ts
// کوئری‌های اختصاصی پنل ادمین برای سفارشات

import { queryRows } from '@/lib/db';
import type {
  OrderRow,
  OrderItemRow,
  OrderStatus,
  DeliveryMethod,
} from '@/lib/types';

// ==========================================
// لیست سفارشات با فیلتر
// ==========================================

export interface AdminOrderListItem {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  status: OrderStatus;
  delivery_method: DeliveryMethod;
  shipping_provider: string;
  items_count: number;
  created_at: Date;
}

export interface GetAdminOrdersOptions {
  search?: string;
  status?: OrderStatus | 'ALL';
  deliveryMethod?: DeliveryMethod | 'ALL';
  fromDate?: string; // YYYY-MM-DD
  toDate?: string;
  limit?: number;
  offset?: number;
}

export async function getAdminOrders(
  options: GetAdminOrdersOptions = {}
): Promise<AdminOrderListItem[]> {
  const {
    search,
    status = 'ALL',
    deliveryMethod = 'ALL',
    fromDate,
    toDate,
    limit = 20,
    offset = 0,
  } = options;

  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];

  if (search && search.trim()) {
    conditions.push(
      '(o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ?)'
    );
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  if (status !== 'ALL') {
    conditions.push('o.status = ?');
    params.push(status);
  }

  if (deliveryMethod !== 'ALL') {
    conditions.push('o.delivery_method = ?');
    params.push(deliveryMethod);
  }

  if (fromDate) {
    conditions.push('DATE(o.created_at) >= ?');
    params.push(fromDate);
  }

  if (toDate) {
    conditions.push('DATE(o.created_at) <= ?');
    params.push(toDate);
  }

  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 100);
  const safeOffset = Math.max(0, Math.floor(offset));
  const whereClause = conditions.join(' AND ');

  const rows = await queryRows<AdminOrderListItem>(
    `SELECT
       o.id, o.order_number, o.customer_name, o.customer_phone,
       o.total_amount, o.status, o.delivery_method, o.shipping_provider,
       o.created_at,
       (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS items_count
     FROM orders o
     WHERE ${whereClause}
     ORDER BY o.created_at DESC, o.id DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  return rows;
}

export async function getAdminOrdersCount(
  options: GetAdminOrdersOptions = {}
): Promise<number> {
  const {
    search,
    status = 'ALL',
    deliveryMethod = 'ALL',
    fromDate,
    toDate,
  } = options;

  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];

  if (search && search.trim()) {
    conditions.push(
      '(order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)'
    );
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  if (status !== 'ALL') {
    conditions.push('status = ?');
    params.push(status);
  }

  if (deliveryMethod !== 'ALL') {
    conditions.push('delivery_method = ?');
    params.push(deliveryMethod);
  }

  if (fromDate) {
    conditions.push('DATE(created_at) >= ?');
    params.push(fromDate);
  }

  if (toDate) {
    conditions.push('DATE(created_at) <= ?');
    params.push(toDate);
  }

  const whereClause = conditions.join(' AND ');
  const rows = await queryRows<{ count: number }>(
    `SELECT COUNT(*) AS count FROM orders WHERE ${whereClause}`,
    params
  );
  return Number(rows[0]?.count ?? 0);
}

// ==========================================
// یک سفارش کامل
// ==========================================

export interface AdminOrderDetail {
  order: OrderRow;
  items: OrderItemRow[];
  branch: {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
  } | null;
  customer: {
    id: number;
    full_name: string | null;
    phone: string;
    email: string | null;
    order_count: number;
  } | null;
}

export async function getAdminOrderByNumber(
  orderNumber: string
): Promise<AdminOrderDetail | null> {
  const orders = await queryRows<OrderRow>(
    `SELECT * FROM orders WHERE order_number = ? LIMIT 1`,
    [orderNumber]
  );

  const order = orders[0];
  if (!order) return null;

  const [items, branches, customers] = await Promise.all([
    queryRows<OrderItemRow>(
      `SELECT id, order_id, product_id, variant_id, product_name,
              weight_gram, price, quantity, created_at
       FROM order_items
       WHERE order_id = ?
       ORDER BY id ASC`,
      [order.id]
    ),
    order.branch_id
      ? queryRows<{
          id: number;
          name: string;
          address: string | null;
          phone: string | null;
        }>(
          `SELECT id, name, address, phone FROM branches WHERE id = ? LIMIT 1`,
          [order.branch_id]
        )
      : Promise.resolve([]),
    order.customer_id
      ? queryRows<{
          id: number;
          full_name: string | null;
          phone: string;
          email: string | null;
          order_count: number;
        }>(
          `SELECT id, full_name, phone, email, order_count
           FROM customers WHERE id = ? LIMIT 1`,
          [order.customer_id]
        )
      : Promise.resolve([]),
  ]);

  return {
    order,
    items,
    branch: branches[0] ?? null,
    customer: customers[0] ?? null,
  };
}

// ==========================================
// آمار برای فیلتر سریع
// ==========================================

export interface OrderStatusStats {
  all: number;
  pending: number;
  paid: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export async function getOrderStatusStats(): Promise<OrderStatusStats> {
  const rows = await queryRows<{ status: string; cnt: number }>(
    `SELECT status, COUNT(*) AS cnt FROM orders GROUP BY status`
  );

  const result: OrderStatusStats = {
    all: 0,
    pending: 0,
    paid: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  for (const row of rows) {
    const cnt = Number(row.cnt);
    result.all += cnt;

    switch (row.status) {
      case 'PENDING':
        result.pending = cnt;
        break;
      case 'PAID':
        result.paid = cnt;
        break;
      case 'PROCESSING':
        result.processing = cnt;
        break;
      case 'SHIPPED':
        result.shipped = cnt;
        break;
      case 'DELIVERED':
        result.delivered = cnt;
        break;
      case 'CANCELLED':
        result.cancelled = cnt;
        break;
    }
  }

  return result;
}