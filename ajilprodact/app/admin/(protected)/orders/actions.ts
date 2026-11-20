// app/admin/orders/actions.ts
// Server Actions مدیریت سفارشات

'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/lib/auth/session';
import { sendOrderConfirmationSms } from '@/lib/auth/sms';
import type { OrderStatus } from '@/lib/types';
import { requirePermission } from '@/lib/auth/rbac';
import { execute, queryRows, transaction } from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

class ManualPaymentStockError extends Error {}

export async function confirmManualPayment(
  orderId: number,
  note?: string
): Promise<ActionResult> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };

  await requirePermission(adminId, 'orders.update');

  const cleanedNote = note?.trim();
  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    return { ok: false, error: 'شناسه سفارش نامعتبر است' };
  }
  if (!cleanedNote) {
    return { ok: false, error: 'ثبت دلیل تایید دستی الزامی است' };
  }
  if (cleanedNote.length > 500) {
    return { ok: false, error: 'یادداشت نمی‌تواند بیش از 500 کاراکتر باشد' };
  }

  let result: ActionResult<{ orderNumber: string }>;
  try {
    result = await transaction(async (conn) => {
      const [orders] = await conn.query<
        Array<
          RowDataPacket & {
            order_number: string;
            status: OrderStatus;
            branch_id: number | null;
          }
        >
      >(
        `SELECT order_number, status, branch_id
         FROM orders
        WHERE id = ? AND payment_gateway = 'manual'
        LIMIT 1
        FOR UPDATE`,
        [orderId],
      );
      const order = orders[0];
      if (!order) return { ok: false as const, error: 'سفارش پرداخت دستی یافت نشد' };
      if (order.status !== 'PENDING') {
        return { ok: false as const, error: 'این سفارش دیگر در انتظار تایید پرداخت نیست' };
      }

      const [items] = await conn.query<
        Array<
          RowDataPacket & {
            product_id: number;
            weight_gram: number;
            quantity: number;
          }
        >
      >(
        `SELECT product_id, weight_gram, quantity
           FROM order_items
          WHERE order_id = ?`,
        [orderId],
      );
      if (items.length === 0) {
        return { ok: false as const, error: 'اقلام سفارش یافت نشد' };
      }

      let branchId = order.branch_id;
      if (!branchId) {
        const [branches] = await conn.query<
          Array<RowDataPacket & { id: number }>
        >(
          `SELECT id FROM branches WHERE is_active = 1 ORDER BY id ASC LIMIT 1`,
        );
        branchId = branches[0]?.id ?? null;
      }
      if (!branchId) {
        return { ok: false as const, error: 'شعبه تامین موجودی مشخص نیست' };
      }

      for (const item of items) {
        const weight = Number(item.weight_gram) * Number(item.quantity);
        const [stockResult] = await conn.execute<ResultSetHeader>(
          `UPDATE product_branch_stock
              SET total_weight_grams = total_weight_grams - ?
            WHERE branch_id = ? AND product_id = ?
              AND total_weight_grams - reserved_weight_grams >= ?`,
          [weight, branchId, item.product_id, weight],
        );
        if (stockResult.affectedRows !== 1) {
          throw new ManualPaymentStockError(
            'موجودی کافی برای تایید این سفارش وجود ندارد'
          );
        }
      }

      const [updateResult] = await conn.execute<ResultSetHeader>(
        `UPDATE orders
         SET payment_verified_by_admin = 1,
             payment_verified_at = NOW(),
             payment_verified_admin_id = ?,
             payment_admin_note = ?,
             status = 'PAID'
       WHERE id = ? AND payment_gateway = 'manual' AND status = 'PENDING'`,
        [adminId, cleanedNote, orderId],
      );
      if (updateResult.affectedRows !== 1) {
        throw new ManualPaymentStockError(
          'وضعیت سفارش تغییر کرده است؛ صفحه را تازه‌سازی کنید'
        );
      }
      return { ok: true as const, orderNumber: order.order_number };
    });
  } catch (error) {
    if (error instanceof ManualPaymentStockError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }

  if (!result.ok) return result;

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${result.orderNumber}`);

  return { ok: true };
}

// ==========================================
// اعتبارسنجی ترتیب وضعیت‌ها
// ==========================================

const STATUS_ORDER: OrderStatus[] = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
];

function canTransition(
  from: OrderStatus,
  to: OrderStatus
): boolean {
  // CANCELLED را می‌توان از هر وضعیتی به جز DELIVERED اعمال کرد
  if (to === 'CANCELLED') {
    return from !== 'DELIVERED' && from !== 'CANCELLED';
  }

  // بازگشت از CANCELLED مجاز نیست
  if (from === 'CANCELLED') return false;

  const fromIdx = STATUS_ORDER.indexOf(from);
  const toIdx = STATUS_ORDER.indexOf(to);

  if (fromIdx === -1 || toIdx === -1) return false;

  // اجازه یک پله جلو یا یک پله عقب
  return Math.abs(toIdx - fromIdx) <= 1;
}

// ==========================================
// تغییر وضعیت سفارش
// ==========================================

export async function changeOrderStatusAction(
  orderNumber: string,
  newStatus: OrderStatus
): Promise<ActionResult> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };
  await requirePermission(adminId, 'orders.update');
  if (newStatus === 'PAID') {
    return {
      ok: false,
      error: 'تایید پرداخت باید از مسیر تاییدشده پرداخت انجام شود',
    };
  }

  // خواندن سفارش فعلی
  const orders = await queryRows<{
    id: number;
    status: OrderStatus;
    customer_phone: string;
    customer_name: string;
    total_amount: number;
  }>(
    `SELECT id, status, customer_phone, customer_name, total_amount
     FROM orders WHERE order_number = ? LIMIT 1`,
    [orderNumber]
  );

  const order = orders[0];
  if (!order) return { ok: false, error: 'سفارش یافت نشد' };

  if (newStatus === 'PENDING' && order.status !== 'PENDING') {
    return {
      ok: false,
      error: 'بازگرداندن سفارش به انتظار پرداخت مجاز نیست',
    };
  }

  // اعتبارسنجی انتقال
  if (!canTransition(order.status, newStatus)) {
    return {
      ok: false,
      error: `تغییر وضعیت از «${order.status}» به «${newStatus}» مجاز نیست`,
    };
  }

  // اگر به DELIVERED تغییر می‌کند، شمارنده مشتری را زیاد کن
  const willBeDelivered =
    newStatus === 'DELIVERED' && order.status !== 'DELIVERED';

  await execute(
    `UPDATE orders SET status = ? WHERE order_number = ?`,
    [newStatus, orderNumber]
  );

  // اگر لغو شد، اطلاع بده
  if (newStatus === 'CANCELLED') {
    // TODO: ارسال پیامک لغو
  }

  // اگر ارسال شد، کد رهگیری را خواسته باشیم (بعداً با SMS)
  void willBeDelivered;
  void sendOrderConfirmationSms;

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderNumber}`);
  revalidatePath(`/profile/orders/${orderNumber}`);
  revalidatePath('/profile/orders');

  return { ok: true };
}

// ==========================================
// ذخیره کد رهگیری
// ==========================================

export async function saveTrackingCodeAction(
  orderNumber: string,
  trackingCode: string
): Promise<ActionResult> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };
  await requirePermission(adminId, 'orders.update');

  const cleaned = trackingCode.trim();
  if (cleaned.length > 50) {
    return { ok: false, error: 'کد رهگیری نمی‌تواند بیش از 50 کاراکتر باشد' };
  }

  await execute(
    `UPDATE orders SET tracking_code = ? WHERE order_number = ?`,
    [cleaned || null, orderNumber]
  );

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderNumber}`);
  revalidatePath(`/profile/orders/${orderNumber}`);

  return { ok: true };
}

// ==========================================
// ذخیره یادداشت داخلی ادمین
// ==========================================

export async function saveAdminNoteAction(
  orderNumber: string,
  note: string
): Promise<ActionResult> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };
  await requirePermission(adminId, 'orders.update');

  const cleaned = note.trim();
  if (cleaned.length > 1000) {
    return { ok: false, error: 'یادداشت نمی‌تواند بیش از 1000 کاراکتر باشد' };
  }

  // ستون note را در orders استفاده می‌کنیم (اگر internal_note اضافه شود بهتر است)
  await execute(
    `UPDATE orders SET note = ? WHERE order_number = ?`,
    [cleaned || null, orderNumber]
  );

  revalidatePath(`/admin/orders/${orderNumber}`);

  return { ok: true };
}

// ==========================================
// حذف سفارش (فقط PENDING و CANCELLED)
// ==========================================

export async function deleteOrderAction(
  orderNumber: string
): Promise<ActionResult> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };
  await requirePermission(adminId, 'orders.delete');

  const orders = await queryRows<{ id: number; status: OrderStatus }>(
    `SELECT id, status FROM orders WHERE order_number = ? LIMIT 1`,
    [orderNumber]
  );

  const order = orders[0];
  if (!order) return { ok: false, error: 'سفارش یافت نشد' };

  if (order.status !== 'PENDING' && order.status !== 'CANCELLED') {
    return {
      ok: false,
      error: 'فقط سفارشات در انتظار پرداخت یا لغو شده قابل حذف هستند',
    };
  }

  await execute(`DELETE FROM orders WHERE order_number = ?`, [orderNumber]);

  revalidatePath('/admin/orders');

  return { ok: true };
}