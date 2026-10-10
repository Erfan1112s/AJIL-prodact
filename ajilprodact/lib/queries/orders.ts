// lib/queries/orders.ts
// توابع خواندن سفارشات

import { queryRows } from '@/lib/db';
import type { OrderRow, OrderItemRow } from '@/lib/types';

// ==========================================
// لیست سفارشات یک مشتری
// ==========================================

export async function getCustomerOrders(
  customerId: number,
  limit = 20,
  offset = 0
): Promise<OrderRow[]> {
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 100);
  const safeOffset = Math.max(0, Math.floor(offset));

  const rows = await queryRows<OrderRow>(
    `SELECT id, order_number, customer_id, customer_name, customer_phone,
            customer_email, address, city, province, postal_code,
            subtotal, shipping_cost, total_amount,
            status, delivery_method, shipping_provider,
            payment_method, payment_ref, payment_authority, payment_verified_at,
            branch_id, tracking_code, note,
            created_at, updated_at
     FROM orders
     WHERE customer_id = ?
     ORDER BY created_at DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    [customerId]
  );
  return rows;
}

// ==========================================
// تعداد کل سفارشات مشتری
// ==========================================

export async function getCustomerOrdersCount(
  customerId: number
): Promise<number> {
  const rows = await queryRows<{ count: number }>(
    `SELECT COUNT(*) AS count FROM orders WHERE customer_id = ?`,
    [customerId]
  );
  return rows[0]?.count ?? 0;
}

// ==========================================
// سفارش با شماره سفارش (برای مشتری)
// ==========================================

export async function getCustomerOrderByNumber(
  customerId: number,
  orderNumber: string
): Promise<OrderRow | null> {
  const rows = await queryRows<OrderRow>(
    `SELECT id, order_number, customer_id, customer_name, customer_phone,
            customer_email, address, city, province, postal_code,
            subtotal, shipping_cost, total_amount,
            status, delivery_method, shipping_provider,
            payment_method, payment_ref, payment_authority, payment_verified_at,
            branch_id, tracking_code, note,
            created_at, updated_at
     FROM orders
     WHERE order_number = ? AND customer_id = ?
     LIMIT 1`,
    [orderNumber, customerId]
  );
  return rows[0] ?? null;
}

// ==========================================
// اقلام یک سفارش
// ==========================================

export async function getOrderItems(
  orderId: number
): Promise<OrderItemRow[]> {
  const rows = await queryRows<OrderItemRow>(
    `SELECT id, order_id, product_id, variant_id, product_name,
            weight_gram, price, quantity, created_at
     FROM order_items
     WHERE order_id = ?
     ORDER BY id ASC`,
    [orderId]
  );
  return rows;
}

// ==========================================
// اطلاعات شعبه (برای سفارش‌های حضوری)
// ==========================================

export interface OrderBranchInfo {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
}

export async function getOrderBranch(
  branchId: number
): Promise<OrderBranchInfo | null> {
  const rows = await queryRows<OrderBranchInfo>(
    `SELECT id, name, address, phone FROM branches WHERE id = ? LIMIT 1`,
    [branchId]
  );
  return rows[0] ?? null;
}