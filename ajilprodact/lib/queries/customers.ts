// lib/queries/customers.ts
import { queryRows } from '@/lib/db';
import type { CustomerRow } from '@/lib/types';

export async function getCustomerByPhone(phone: string): Promise<CustomerRow | null> {
  const rows = await queryRows<CustomerRow>(
    `SELECT id, phone, national_code, full_name, email, default_address,
            admin_note, order_count, last_order_at, is_active,
            created_at, updated_at
     FROM customers
     WHERE phone = ?
     LIMIT 1`,
    [phone]
  );
  return rows[0] ?? null;
}

export async function getCustomerById(id: number): Promise<CustomerRow | null> {
  const rows = await queryRows<CustomerRow>(
    `SELECT id, phone, national_code, full_name, email, default_address,
            admin_note, order_count, last_order_at, is_active,
            created_at, updated_at
     FROM customers
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

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

  if (search && search.trim().length > 0) {
    conditions.push('(full_name LIKE ? OR phone LIKE ?)');
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }

  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 100);
  const safeOffset = Math.max(0, Math.floor(offset));
  const whereClause = conditions.join(' AND ');

  const rows = await queryRows<CustomerRow>(
    `SELECT id, phone, national_code, full_name, email, default_address,
            admin_note, order_count, last_order_at, is_active,
            created_at, updated_at
     FROM customers
     WHERE ${whereClause}
     ORDER BY last_order_at DESC, created_at DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );
  return rows;
}

export async function getCustomersCount(search?: string): Promise<number> {
  const conditions: string[] = ['is_active = 1'];
  const params: unknown[] = [];

  if (search && search.trim().length > 0) {
    conditions.push('(full_name LIKE ? OR phone LIKE ?)');
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }

  const whereClause = conditions.join(' AND ');
  const rows = await queryRows<{ count: number }>(
    `SELECT COUNT(*) AS count FROM customers WHERE ${whereClause}`,
    params
  );
  return rows[0]?.count ?? 0;
}