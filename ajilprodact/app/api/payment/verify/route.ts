// app/api/payment/verify/route.ts
// بازگشت از درگاه پرداخت

import { NextResponse, type NextRequest } from 'next/server';
import { queryRows, execute } from '@/lib/db';
import { verifyPayment, isPaymentBlocked } from '@/lib/payment/zarinpal';
import { sendOrderConfirmationSms } from '@/lib/auth/sms';
import type { OrderRow } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const authority = searchParams.get('Authority');
  const status = searchParams.get('Status');
  const orderNumber = searchParams.get('order');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  // اگر درگاه مسدود است
  const blocked = isPaymentBlocked();
  if (blocked.blocked) {
    return NextResponse.redirect(
      `${baseUrl}/checkout/error?reason=payment_blocked`
    );
  }

  if (!orderNumber) {
    return NextResponse.redirect(
      `${baseUrl}/checkout/error?reason=missing_order`
    );
  }

  // خواندن سفارش
  const orders = await queryRows<OrderRow>(
    `SELECT * FROM orders WHERE order_number = ? LIMIT 1`,
    [orderNumber]
  );

  const order = orders[0];
  if (!order) {
    return NextResponse.redirect(
      `${baseUrl}/checkout/error?reason=order_not_found`
    );
  }

  // اگر قبلاً پرداخت شده
  if (order.status === 'PAID' || order.status === 'PROCESSING') {
    return NextResponse.redirect(
      `${baseUrl}/checkout/success?order=${orderNumber}`
    );
  }

  // چک وضعیت از زرین‌پال
  if (status !== 'OK') {
    await execute(
      `UPDATE orders SET status = 'CANCELLED' WHERE order_number = ?`,
      [orderNumber]
    );
    return NextResponse.redirect(
      `${baseUrl}/checkout/error?order=${orderNumber}&reason=cancelled`
    );
  }

  if (!authority) {
    return NextResponse.redirect(
      `${baseUrl}/checkout/error?order=${orderNumber}&reason=missing_authority`
    );
  }

  // تایید پرداخت
  const verifyResult = await verifyPayment({
    amount: Number(order.total_amount),
    authority,
  });

if (!verifyResult.ok) {
  // آزاد کردن رزرو
  const items = await queryRows<{
    product_id: number;
    weight_gram: number;
    quantity: number;
  }>(
    `SELECT product_id, weight_gram, quantity FROM order_items WHERE order_id = ?`,
    [order.id]
  );

  let targetBranchId = order.branch_id;
  if (!targetBranchId) {
    const branches = await queryRows<{ id: number }>(
      `SELECT id FROM branches WHERE is_active = 1 ORDER BY id ASC LIMIT 1`
    );
    targetBranchId = branches[0]?.id;
  }

  if (targetBranchId) {
    for (const item of items) {
      const weight = Number(item.weight_gram) * Number(item.quantity);
      await execute(
        `UPDATE product_branch_stock
         SET reserved_weight_grams = GREATEST(0, reserved_weight_grams - ?)
         WHERE branch_id = ? AND product_id = ?`,
        [weight, targetBranchId, item.product_id]
      );
    }
  }

  await execute(
    `UPDATE orders SET status = 'CANCELLED' WHERE order_number = ?`,
    [orderNumber]
  );

  return NextResponse.redirect(
    `${baseUrl}/checkout/error?order=${orderNumber}&reason=verify_failed`
  );
}

// پرداخت موفق
await execute(
  `UPDATE orders
   SET status = 'PAID',
       payment_ref = ?,
       payment_verified_at = CURRENT_TIMESTAMP
   WHERE order_number = ?`,
  [verifyResult.refId, orderNumber]
);

// مصرف رزرو از موجودی
const items = await queryRows<{
  product_id: number;
  weight_gram: number;
  quantity: number;
}>(
  `SELECT product_id, weight_gram, quantity FROM order_items WHERE order_id = ?`,
  [order.id]
);

// تعیین شعبه
let targetBranchId = order.branch_id;
if (!targetBranchId) {
  const branches = await queryRows<{ id: number }>(
    `SELECT id FROM branches WHERE is_active = 1 ORDER BY id ASC LIMIT 1`
  );
  targetBranchId = branches[0]?.id;
}

if (targetBranchId) {
  for (const item of items) {
    const weight = Number(item.weight_gram) * Number(item.quantity);
    await execute(
      `UPDATE product_branch_stock
       SET total_weight_grams = GREATEST(0, total_weight_grams - ?),
           reserved_weight_grams = GREATEST(0, reserved_weight_grams - ?)
       WHERE branch_id = ? AND product_id = ?`,
      [weight, weight, targetBranchId, item.product_id]
    );
  }
}
}