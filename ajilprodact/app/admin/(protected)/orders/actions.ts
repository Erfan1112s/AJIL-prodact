// app/admin/orders/actions.ts
// Server Actions مدیریت سفارشات

'use server';

import { revalidatePath } from 'next/cache';
import { execute, queryRows } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth/session';
import { sendOrderConfirmationSms } from '@/lib/auth/sms';
import type { OrderStatus } from '@/lib/types';

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

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