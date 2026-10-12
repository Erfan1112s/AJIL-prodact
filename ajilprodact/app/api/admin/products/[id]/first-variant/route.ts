// app/api/admin/products/[id]/first-variant/route.ts
// دریافت اولین واریانت یک محصول برای ویرایش سریع قیمت

import { NextResponse, type NextRequest } from 'next/server';
import { queryRows } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth/session';
import type { ProductVariantRow } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await getCurrentUserId();
  if (!adminId) {
    return NextResponse.json(
      { ok: false, error: 'دسترسی غیرمجاز' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json(
      { ok: false, error: 'شناسه نامعتبر' },
      { status: 400 }
    );
  }

  const rows = await queryRows<ProductVariantRow>(
    `SELECT id, weight_gram, price, compare_price
     FROM product_variants
     WHERE product_id = ? AND is_active = 1
     ORDER BY weight_gram ASC
     LIMIT 1`,
    [productId]
  );

  const variant = rows[0];
  if (!variant) {
    return NextResponse.json({ ok: false, error: 'واریانتی یافت نشد' });
  }

  return NextResponse.json({
    ok: true,
    variant: {
      id: variant.id,
      weight_gram: variant.weight_gram,
      price: Number(variant.price),
      compare_price: variant.compare_price
        ? Number(variant.compare_price)
        : null,
    },
  });
}