// app/api/auth/me/route.ts
// API برای خواندن اطلاعات مشتری فعلی

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentCustomerId } from '@/lib/auth/customer-session';
import type { CustomerRow } from '@/lib/types';

export async function GET() {
  const id = await getCurrentCustomerId();
  if (!id) {
    return NextResponse.json({ ok: false, error: 'وارد نشده‌اید' });
  }

  const [rows] = await db.query<CustomerRow[]>(
    `SELECT id, phone, full_name, email, order_count
     FROM customers WHERE id = ? AND is_active = 1 LIMIT 1`,
    [id]
  );

  const list = rows as CustomerRow[];
  const customer = list[0];

  if (!customer) {
    return NextResponse.json({ ok: false, error: 'حساب یافت نشد' });
  }

  return NextResponse.json({ ok: true, customer });
}