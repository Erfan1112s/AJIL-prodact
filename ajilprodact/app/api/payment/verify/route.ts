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

  // ارسال پیامک (اگر قالب تنظیم شده)
  await sendOrderConfirmationSms({
    mobile: order.customer_phone,
    orderNumber: order.order_number,
    amount: Number(order.total_amount),
  });

  return NextResponse.redirect(
    `${baseUrl}/checkout/success?order=${orderNumber}`
  );
}