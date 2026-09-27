// lib/queries/customers.ts
// توابع خواندن مشتریان

import { db } from '@/lib/db';
import type { CustomerRow } from '@/lib/types';

// ==========================================
// تابع 1: مشتری با شماره موبایل
// ==========================================
export async function getCustomerByPhone(
  phone: string
): Promise<CustomerRow | null> {
  const [rows] = await db.query<CustomerRow[]>(
    `SELECT
       id, phone, full_name, email, default_address, admin_note,
       order_count, last_order_at, is_active,
       created_at, updated_at
     FROM customers
     WHERE phone = ?
     LIMIT 1`,
    [phone]
  );

  const list = rows as CustomerRow[];
  return list[0] ?? null;
}

// ==========================================
// تابع 2: مشتری با id
// ==========================================
export async function getCustomerById(id: number): Promise<CustomerRow | null> {
  const [rows] = await db.query<CustomerRow[]>(
    `SELECT
       id, phone, full_name, email, default_address, admin_note,
       order_count, last_order_at, is_active,
       created_at, updated_at
     FROM customers
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  const list = rows as CustomerRow[];
  return list[0] ?? null;
}

// ==========================================
// تابع 3: لیست مشتریان با صفحه‌بندی
// برای پنل ادمین
// ==========================================
export interface GetCustomersOptions {
  limit?: number;
  offset?: number;
  search?: string;
}

export async function getCustomers(
  options: GetCustomersOptions = {}
): Promise<CustomerRow[]> {
  const { limit = 20, offset = 0, search } = options;

  const conditions: string[] = ['is_active = 1'];
  const params: unknown[] = [];

  // اگر search داده شد، در نام یا شماره جست‌وجو کن
  if (search && search.trim().length > 0) {
    conditions.push('(full_name LIKE ? OR phone LIKE ?)');
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }

  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 100);
  const safeOffset = Math.max(0, Math.floor(offset));

  const whereClause = conditions.join(' AND ');

  const [rows] = await db.query<CustomerRow[]>(
    `SELECT
       id, phone, full_name, email, default_address, admin_note,
       order_count, last_order_at, is_active,
       created_at, updated_at
     FROM customers
     WHERE ${whereClause}
     ORDER BY last_order_at DESC, created_at DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  return rows as CustomerRow[];
}

// ==========================================
// تابع 4: تعداد کل مشتریان
// برای صفحه‌بندی
// ==========================================
export async function getCustomersCount(search?: string): Promise<number> {
  const conditions: string[] = ['is_active = 1'];
  const params: unknown[] = [];

  if (search && search.trim().length > 0) {
    conditions.push('(full_name LIKE ? OR phone LIKE ?)');
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }

  const whereClause = conditions.join(' AND ');

  const [rows] = await db.query<Array<{ count: number }>>(
    `SELECT COUNT(*) AS count FROM customers WHERE ${whereClause}`,
    params
  );

  const list = rows as Array<{ count: number }>;
  return list[0]?.count ?? 0;
}