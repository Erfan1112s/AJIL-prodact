import { NextResponse, type NextRequest } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { queryRows, transaction } from '@/lib/db';
import { getPaymentGateway } from '@/lib/payment';
import { isPaymentBlocked } from '@/lib/payment/zarinpal';
import type { OrderStatus } from '@/lib/types';

interface PaymentOrderRow extends RowDataPacket {
  id: number;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  payment_method: string | null;
  payment_gateway: string | null;
  payment_authority: string | null;
  branch_id: number | null;
}

interface PaymentOrderItemRow extends RowDataPacket {
  product_id: number;
  weight_gram: number;
  quantity: number;
}

function paymentRedirect(baseUrl: URL, path: string, params: Record<string, string>) {
  const destination = new URL(path, baseUrl);
  for (const [key, value] of Object.entries(params)) {
    destination.searchParams.set(key, value);
  }
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!configuredBaseUrl) {
    return NextResponse.json(
      { error: 'Payment return URL is not configured.' },
      { status: 500 }
    );
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(configuredBaseUrl);
  } catch {
    return NextResponse.json(
      { error: 'Payment return URL is invalid.' },
      { status: 500 }
    );
  }
  if (
    baseUrl.username ||
    baseUrl.password ||
    baseUrl.pathname !== '/' ||
    baseUrl.search ||
    baseUrl.hash ||
    (process.env.NODE_ENV === 'production' && baseUrl.protocol !== 'https:')
  ) {
    return NextResponse.json(
      { error: 'Payment return URL must be a public HTTPS origin.' },
      { status: 500 }
    );
  }

  const { searchParams } = request.nextUrl;
  const authority = searchParams.get('Authority');
  const orderNumber = searchParams.get('order');

  if (!orderNumber || orderNumber.length > 20) {
    return paymentRedirect(baseUrl, '/checkout/error', {
      reason: 'missing_order',
    });
  }

  const orders = await queryRows<PaymentOrderRow>(
    `SELECT id, order_number, status, total_amount, payment_method,
            payment_gateway,
            payment_authority, branch_id
     FROM orders
     WHERE order_number = ?
     LIMIT 1`,
    [orderNumber]
  );
  const order = orders[0];
  if (!order) {
    return paymentRedirect(baseUrl, '/checkout/error', {
      reason: 'order_not_found',
    });
  }

  if (!authority || authority !== order.payment_authority) {
    return paymentRedirect(baseUrl, '/checkout/error', {
      order: order.order_number,
      reason: 'invalid_authority',
    });
  }

  if (
    order.status === 'PAID' ||
    order.status === 'PROCESSING' ||
    order.status === 'SHIPPED' ||
    order.status === 'DELIVERED'
  ) {
    return paymentRedirect(baseUrl, '/checkout/success', {
      order: order.order_number,
    });
  }

  if (order.status !== 'PENDING') {
    return paymentRedirect(baseUrl, '/checkout/error', {
      order: order.order_number,
      reason: 'order_not_pending',
    });
  }

  const method = order.payment_method;
  const gatewayName =
    order.payment_gateway ??
    (method === 'zarinpal-mock' ? 'zarinpal' : method);
  if (!gatewayName || (gatewayName !== 'zarinpal' && gatewayName !== 'tikart')) {
    return paymentRedirect(baseUrl, '/checkout/error', {
      order: order.order_number,
      reason: 'unknown_gateway',
    });
  }

  if (gatewayName === 'zarinpal') {
    const blocked = isPaymentBlocked();
    if (blocked.blocked) {
      return paymentRedirect(baseUrl, '/checkout/error', {
        order: order.order_number,
        reason: 'payment_blocked',
      });
    }
  }

  if (searchParams.get('Status') !== 'OK') {
    return paymentRedirect(baseUrl, '/checkout/error', {
      order: order.order_number,
      reason: 'cancelled',
    });
  }

  const verification = await getPaymentGateway(gatewayName).verifyPayment({
    amount: Number(order.total_amount),
    authority,
  });
  const refId = verification.refId;
  if (!verification.success || !refId) {
    return paymentRedirect(baseUrl, '/checkout/error', {
      order: order.order_number,
      reason: 'verify_failed',
    });
  }

  const finalized = await transaction(async (conn) => {
    const [lockedRows] = await conn.query<PaymentOrderRow[]>(
      `SELECT id, order_number, status, total_amount, payment_method,
              payment_gateway,
              payment_authority, branch_id
       FROM orders
       WHERE order_number = ?
       LIMIT 1
       FOR UPDATE`,
      [order.order_number]
    );
    const lockedOrder = lockedRows[0];

    if (
      !lockedOrder ||
      lockedOrder.payment_authority !== authority ||
      lockedOrder.payment_method !== method ||
      lockedOrder.payment_gateway !== order.payment_gateway ||
      Number(lockedOrder.total_amount) !== Number(order.total_amount)
    ) {
      return 'invalid' as const;
    }

    if (
      lockedOrder.status === 'PAID' ||
      lockedOrder.status === 'PROCESSING' ||
      lockedOrder.status === 'SHIPPED' ||
      lockedOrder.status === 'DELIVERED'
    ) {
      return 'already-paid' as const;
    }
    if (lockedOrder.status !== 'PENDING') return 'invalid' as const;

    const [updateResult] = await conn.execute<ResultSetHeader>(
      `UPDATE orders
       SET status = 'PAID',
           payment_ref = ?,
           payment_verified_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'PENDING' AND payment_authority = ?`,
      [refId, lockedOrder.id, authority]
    );
    if (updateResult.affectedRows !== 1) return 'invalid' as const;

    const [items] = await conn.query<PaymentOrderItemRow[]>(
      `SELECT product_id, weight_gram, quantity
       FROM order_items
       WHERE order_id = ?`,
      [lockedOrder.id]
    );
    if (items.length === 0) {
      throw new Error(`Paid order ${lockedOrder.order_number} has no items.`);
    }

    let branchId = lockedOrder.branch_id;
    if (!branchId) {
      const [branches] = await conn.query<Array<RowDataPacket & { id: number }>>(
        `SELECT id FROM branches WHERE is_active = 1 ORDER BY id ASC LIMIT 1`
      );
      branchId = branches[0]?.id ?? null;
    }
    if (!branchId) {
      throw new Error(`No fulfillment branch is available for order ${lockedOrder.order_number}.`);
    }

    for (const item of items) {
      const weight = Number(item.weight_gram) * Number(item.quantity);
      const [stockResult] = await conn.execute<ResultSetHeader>(
        `UPDATE product_branch_stock
         SET total_weight_grams = total_weight_grams - ?
         WHERE branch_id = ? AND product_id = ?
           AND total_weight_grams - reserved_weight_grams >= ?`,
        [weight, branchId, item.product_id, weight]
      );
      if (stockResult.affectedRows !== 1) {
        throw new Error(
          `Insufficient fulfillment stock for order ${lockedOrder.order_number}.`
        );
      }
    }

    return 'paid' as const;
  });

  if (finalized === 'invalid') {
    return paymentRedirect(baseUrl, '/checkout/error', {
      order: order.order_number,
      reason: 'order_not_pending',
    });
  }

  return paymentRedirect(baseUrl, '/checkout/success', {
    order: order.order_number,
  });
}
