// app/checkout/actions.ts
// Server Actions تسویه حساب

'use server';

import { queryRows, execute, transaction } from '@/lib/db';
import { getCurrentCustomerId } from '@/lib/auth/customer-session';
import { requestPayment, isMockMode } from '@/lib/payment/zarinpal';
import { calculateShippingOptions } from '@/lib/shipping/calculator';
import { generateOrderNumber } from '@/lib/utils';
import type {
  CustomerRow,
  ProductVariantRow,
  DeliveryMethod,
  ShippingProvider,
} from '@/lib/types';

// ==========================================
// تایپ‌های ورودی
// ==========================================

export interface CheckoutItem {
  variantId: number;
  quantity: number;
}

export interface CheckoutFormData {
  fullName: string;
  phone: string;
  email: string;
  deliveryMethod: DeliveryMethod;
  shippingProvider: ShippingProvider;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  note: string;
  branchId: number | null;
  items: CheckoutItem[];
}

export type SubmitOrderResult =
  | {
      ok: true;
      orderNumber: string;
      paymentUrl: string;
      isMock: boolean;
    }
  | { ok: false; error: string; code?: string };

// ==========================================
// اعتبارسنجی
// ==========================================

function validateInput(input: CheckoutFormData): string | null {
  if (!input.fullName || input.fullName.trim().length < 3) {
    return 'نام و نام خانوادگی را وارد کنید';
  }

  if (!/^09\d{9}$/.test(input.phone)) {
    return 'شماره موبایل نامعتبر است';
  }

  if (input.items.length === 0) {
    return 'سبد خرید خالی است';
  }

  if (input.deliveryMethod === 'SHIPPING') {
    if (!input.province) return 'استان را انتخاب کنید';
    if (!input.city) return 'شهر را انتخاب کنید';
    if (!input.address || input.address.trim().length < 10) {
      return 'آدرس کامل را وارد کنید';
    }
    if (!/^\d{10}$/.test(input.postalCode)) {
      return 'کد پستی باید 10 رقم باشد';
    }
    if (input.shippingProvider === 'NONE') {
      return 'روش ارسال را انتخاب کنید';
    }
  }

  if (input.deliveryMethod === 'PICKUP') {
    if (!input.branchId) {
      return 'شعبه مورد نظر را انتخاب کنید';
    }
  }

  return null;
}

// ==========================================
// ثبت سفارش
// ==========================================

export async function submitOrderAction(
  input: CheckoutFormData
): Promise<SubmitOrderResult> {
  // ۱. بررسی لاگین
  const customerId = await getCurrentCustomerId();
  if (!customerId) {
    return {
      ok: false,
      error: 'برای ثبت سفارش باید وارد حساب خود شوید',
      code: 'NOT_AUTHENTICATED',
    };
  }

  // ۲. اعتبارسنجی ورودی
  const validationError = validateInput(input);
  if (validationError) {
    return { ok: false, error: validationError, code: 'INVALID_INPUT' };
  }

  // ۳. خواندن مشتری
  const customers = await queryRows<CustomerRow>(
    `SELECT id, phone, full_name FROM customers WHERE id = ? AND is_active = 1 LIMIT 1`,
    [customerId]
  );

  const customer = customers[0];
  if (!customer) {
    return {
      ok: false,
      error: 'حساب کاربری یافت نشد',
      code: 'CUSTOMER_NOT_FOUND',
    };
  }

  // ۴. خواندن واریانت‌ها
  const variantIds = input.items.map((i) => i.variantId);
  const placeholders = variantIds.map(() => '?').join(',');

  const variants = await queryRows<
    ProductVariantRow & {
      product_name: string;
      product_slug: string;
      product_is_active: number;
    }
  >(
    `SELECT pv.id, pv.product_id, pv.weight_gram, pv.price, pv.compare_price,
            pv.sku, pv.is_active, pv.created_at, pv.updated_at,
            p.name AS product_name,
            p.slug AS product_slug,
            p.is_active AS product_is_active
     FROM product_variants pv
     INNER JOIN products p ON p.id = pv.product_id
     WHERE pv.id IN (${placeholders})`,
    variantIds
  );

  if (variants.length !== variantIds.length) {
    return {
      ok: false,
      error: 'برخی از محصولات انتخابی دیگر موجود نیستند',
      code: 'PRODUCT_UNAVAILABLE',
    };
  }

  for (const variant of variants) {
    if (variant.is_active !== 1 || variant.product_is_active !== 1) {
      return {
        ok: false,
        error: `محصول "${variant.product_name}" دیگر در دسترس نیست`,
        code: 'PRODUCT_UNAVAILABLE',
      };
    }
  }

  // ۵. محاسبه جمع کالاها با قیمت‌های واقعی
  interface OrderItemDraft {
    variantId: number;
    productId: number;
    productName: string;
    weightGram: number;
    price: number;
    quantity: number;
  }

  const orderItems: OrderItemDraft[] = [];
  let subtotal = 0;
  let totalWeight = 0;

  for (const item of input.items) {
    const variant = variants.find((v) => v.id === item.variantId);
    if (!variant) continue;

    const quantity = Math.min(Math.max(1, item.quantity), 10);
    const lineTotal = variant.price * quantity;

    orderItems.push({
      variantId: variant.id,
      productId: variant.product_id,
      productName: variant.product_name,
      weightGram: variant.weight_gram,
      price: variant.price,
      quantity,
    });

    subtotal += lineTotal;
    totalWeight += variant.weight_gram * quantity;
  }

  if (orderItems.length === 0) {
    return { ok: false, error: 'سبد خرید خالی است', code: 'EMPTY_CART' };
  }

  // ۶. محاسبه هزینه ارسال
  let shippingCost = 0;
  let shippingProvider: ShippingProvider = 'NONE';

  if (input.deliveryMethod === 'SHIPPING') {
    const shippingResult = calculateShippingOptions({
      province: input.province,
      city: input.city,
      totalWeightGram: totalWeight,
      subtotal,
    });

    if (!shippingResult.canShip) {
      return {
        ok: false,
        error:
          shippingResult.message ?? 'ارسال به این منطقه امکان‌پذیر نیست',
        code: 'SHIPPING_UNAVAILABLE',
      };
    }

    const selectedOption = shippingResult.options.find(
      (opt) => opt.provider === input.shippingProvider
    );

    if (!selectedOption) {
      return {
        ok: false,
        error: 'روش ارسال انتخابی در دسترس نیست',
        code: 'SHIPPING_UNAVAILABLE',
      };
    }

    shippingCost = selectedOption.cost;
    shippingProvider = selectedOption.provider;
  }

  const totalAmount = subtotal + shippingCost;

  // ۷. تولید شماره سفارش
  const orderNumber = generateOrderNumber();

  // ۸. ذخیره سفارش (تراکنش)
  try {
    await transaction(async (conn) => {
      const [orderResult] = await conn.query(
        `INSERT INTO orders (
          order_number, customer_id, customer_name, customer_phone, customer_email,
          address, city, province, postal_code,
          subtotal, shipping_cost, total_amount,
          status, delivery_method, shipping_provider,
          branch_id, note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?)`,
        [
          orderNumber,
          customerId,
          input.fullName.trim(),
          input.phone,
          input.email.trim() || null,
          input.deliveryMethod === 'SHIPPING' ? input.address.trim() : null,
          input.deliveryMethod === 'SHIPPING' ? input.city : null,
          input.deliveryMethod === 'SHIPPING' ? input.province : null,
          input.deliveryMethod === 'SHIPPING' ? input.postalCode : null,
          subtotal,
          shippingCost,
          totalAmount,
          input.deliveryMethod,
          shippingProvider,
          input.deliveryMethod === 'PICKUP' ? input.branchId : null,
          input.note.trim() || null,
        ]
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orderId = (orderResult as any).insertId as number;

      for (const item of orderItems) {
        await conn.query(
          `INSERT INTO order_items (
            order_id, product_id, variant_id, product_name,
            weight_gram, price, quantity
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.productId,
            item.variantId,
            item.productName,
            item.weightGram,
            item.price,
            item.quantity,
          ]
        );
      }
    });
  } catch (err) {
    console.error('خطا در ثبت سفارش:', err);
    return {
      ok: false,
      error: 'خطا در ثبت سفارش. لطفاً دوباره تلاش کنید.',
      code: 'DB_ERROR',
    };
  }

  // ۹. درخواست پرداخت
  const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/verify?order=${orderNumber}`;

  const paymentResult = await requestPayment({
    amount: totalAmount,
    description: `پرداخت سفارش ${orderNumber}`,
    callbackUrl,
    email: input.email.trim() || undefined,
    mobile: input.phone,
    orderId: orderNumber,
  });

  if (!paymentResult.ok) {
    await execute(
      `UPDATE orders SET status = 'CANCELLED' WHERE order_number = ?`,
      [orderNumber]
    );

    return {
      ok: false,
      error: paymentResult.error,
      code: paymentResult.code,
    };
  }

  // ۱۰. ذخیره authority
  await execute(
    `UPDATE orders
     SET payment_method = ?,
         payment_authority = ?
     WHERE order_number = ?`,
    [
      isMockMode() ? 'zarinpal-mock' : 'zarinpal',
      paymentResult.authority,
      orderNumber,
    ]
  );

  return {
    ok: true,
    orderNumber,
    paymentUrl: paymentResult.paymentUrl,
    isMock: paymentResult.isMock,
  };
}