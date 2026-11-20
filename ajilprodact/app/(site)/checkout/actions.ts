// app/checkout/actions.ts
// Server Actions تسویه حساب

'use server';

import { queryRows, execute, transaction } from '@/lib/db';
import { getCurrentCustomerId } from '@/lib/auth/customer-session';
import { calculateShippingOptions } from '@/lib/shipping/calculator';
import { generateOrderNumber } from '@/lib/utils';
import type { ResultSetHeader } from 'mysql2/promise';
import type {
  CustomerRow,
  ProductVariantRow,
  DeliveryMethod,
  ShippingProvider,
} from '@/lib/types';
import { getPaymentGateway } from '@/lib/payment';

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
  if (!input || typeof input !== 'object') {
    return 'اطلاعات سفارش نامعتبر است';
  }
  if (
    typeof input.fullName !== 'string' ||
    typeof input.phone !== 'string' ||
    typeof input.email !== 'string' ||
    typeof input.note !== 'string' ||
    !Array.isArray(input.items)
  ) {
    return 'اطلاعات سفارش ناقص است';
  }
  if (input.items.length === 0 || input.items.length > 50) {
    return input.items.length === 0 ? 'سبد خرید خالی است' : 'تعداد اقلام سفارش نامعتبر است';
  }
  if (
    input.items.some(
      (item) =>
        !item ||
        !Number.isSafeInteger(item.variantId) ||
        item.variantId <= 0 ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 10
    ) ||
    new Set(input.items.map((item) => item.variantId)).size !== input.items.length
  ) {
    return 'تعداد یا شناسه یکی از محصولات نامعتبر است';
  }

  if (!input.fullName || input.fullName.trim().length < 3) {
    return 'نام و نام خانوادگی را وارد کنید';
  }
  if (input.fullName.trim().length > 100) {
    return 'نام و نام خانوادگی بیش از حد طولانی است';
  }

  if (!/^09\d{9}$/.test(input.phone)) {
    return 'شماره موبایل نامعتبر است';
  }

  if (
    input.deliveryMethod !== 'SHIPPING' &&
    input.deliveryMethod !== 'PICKUP'
  ) {
    return 'روش تحویل نامعتبر است';
  }

  if (
    input.email.length > 100 ||
    (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
  ) {
    return 'نشانی ایمیل نامعتبر است';
  }
  if (input.note.trim().length > 1000) {
    return 'یادداشت سفارش نمی‌تواند بیش از 1000 کاراکتر باشد';
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
    if (
      input.shippingProvider !== 'SNAPP' &&
      input.shippingProvider !== 'POST'
    ) {
      return 'روش ارسال را انتخاب کنید';
    }
  }

  if (input.deliveryMethod === 'PICKUP') {
    if (!Number.isSafeInteger(input.branchId) || !input.branchId) {
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
  const customerId = await getCurrentCustomerId();
  if (!customerId) {
    return {
      ok: false,
      error: 'برای ثبت سفارش باید وارد حساب خود شوید',
      code: 'NOT_AUTHENTICATED',
    };
  }

  const validationError = validateInput(input);
  if (validationError) {
    return { ok: false, error: validationError, code: 'INVALID_INPUT' };
  }

  let gateway: ReturnType<typeof getPaymentGateway>;
  try {
    gateway = getPaymentGateway();
  } catch {
    console.error('تنظیم درگاه پرداخت نامعتبر است');
    return {
      ok: false,
      error: 'درگاه پرداخت به‌درستی پیکربندی نشده است.',
      code: 'PAYMENT_CONFIG',
    };
  }

  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');
  let baseUrl: URL;
  try {
    baseUrl = new URL(configuredBaseUrl);
  } catch {
    return {
      ok: false,
      error: 'نشانی بازگشت از پرداخت پیکربندی نشده است.',
      code: 'PAYMENT_CONFIG',
    };
  }
  if (
    (baseUrl.protocol !== 'https:' &&
      !(process.env.NODE_ENV !== 'production' && baseUrl.protocol === 'http:')) ||
    baseUrl.username ||
    baseUrl.password ||
    baseUrl.pathname !== '/' ||
    baseUrl.search ||
    baseUrl.hash
  ) {
    return {
      ok: false,
      error: 'نشانی بازگشت از پرداخت نامعتبر است.',
      code: 'PAYMENT_CONFIG',
    };
  }

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

  if (input.deliveryMethod === 'PICKUP') {
    const activeBranches = await queryRows<{ id: number }>(
      `SELECT id FROM branches WHERE id = ? AND is_active = 1 LIMIT 1`,
      [input.branchId]
    );
    if (!activeBranches[0]) {
      return {
        ok: false,
        error: 'شعبه انتخاب‌شده در دسترس نیست',
        code: 'BRANCH_UNAVAILABLE',
      };
    }
  }

  const variantIds = input.items.map((item) => item.variantId);
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
    const variant = variants.find((entry) => entry.id === item.variantId);
    if (!variant) continue;

    if (!Number.isSafeInteger(variant.price) || variant.price <= 0) {
      return {
        ok: false,
        error: `قیمت محصول «${variant.product_name}» نامعتبر است`,
        code: 'INVALID_PRODUCT_PRICE',
      };
    }

    const quantity = item.quantity;
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

  let shippingCost = 0;
  let shippingProvider: ShippingProvider =
    input.deliveryMethod === 'SHIPPING' ? input.shippingProvider : 'NONE';

  if (input.deliveryMethod === 'SHIPPING') {
    const shippingCalculation = calculateShippingOptions({
      province: input.province,
      city: input.city,
      totalWeightGram: totalWeight,
      subtotal,
    });

    if (!shippingCalculation.canShip) {
      return {
        ok: false,
        error: shippingCalculation.message ?? 'امکان ارسال وجود ندارد',
        code: 'SHIPPING_UNAVAILABLE',
      };
    }

    const selectedShippingOption = shippingCalculation.options.find(
      (option) => option.provider === input.shippingProvider
    );

    if (!selectedShippingOption) {
      return {
        ok: false,
        error: 'روش ارسال نامعتبر است',
        code: 'INVALID_SHIPPING_PROVIDER',
      };
    }

    shippingCost = selectedShippingOption.cost;
    shippingProvider = selectedShippingOption.provider;
  }

  const totalAmount = subtotal + shippingCost;
  if (!Number.isSafeInteger(totalAmount) || totalAmount < 1000) {
    return {
      ok: false,
      error: 'مبلغ نهایی سفارش نامعتبر است',
      code: 'INVALID_TOTAL',
    };
  }
  const orderNumber = generateOrderNumber();

  try {
    await transaction(async (conn) => {
      const [orderResult] = await conn.query(
        `INSERT INTO orders (
          order_number, customer_id, customer_name, customer_phone, customer_email,
          address, city, province, postal_code,
          subtotal, shipping_cost, total_amount,
          status, delivery_method, shipping_provider,
          branch_id, note, payment_gateway
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?)`,
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
          gateway.name,
        ]
      );

      const orderId = (orderResult as { insertId: number }).insertId;

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
  } catch (error) {
    console.error('خطا در ثبت سفارش:', {
      errorName: error instanceof Error ? error.name : 'unknown',
    });
    return {
      ok: false,
      error: 'خطا در ثبت سفارش. لطفاً دوباره تلاش کنید.',
      code: 'DB_ERROR',
    };
  }

  const callbackUrl = new URL('/api/payment/verify', baseUrl);
  callbackUrl.searchParams.set('order', orderNumber);
  const paymentResult = await gateway.requestPayment({
    amount: totalAmount,
    description: `پرداخت سفارش ${orderNumber}`,
    callbackUrl: callbackUrl.toString(),
    email: input.email.trim() || undefined,
    mobile: input.phone,
    orderId: orderNumber,
    orderNumber,
  });

  const paymentAuthority = paymentResult.authority;
  const paymentUrl = paymentResult.redirectUrl;
  if (!paymentResult.success || !paymentAuthority || !paymentUrl) {
    await execute(
      `UPDATE orders SET status = 'CANCELLED'
       WHERE order_number = ? AND status = 'PENDING'`,
      [orderNumber]
    );

    return {
      ok: false,
      error: paymentResult.errorMessage ?? 'ایجاد پرداخت ناموفق بود.',
      code: 'PAYMENT_REQUEST_FAILED',
    };
  }

  let paymentStored: boolean;
  try {
    paymentStored = await transaction(async (conn) => {
      const [result] = await conn.execute<ResultSetHeader>(
        `UPDATE orders
         SET payment_method = ?,
             payment_authority = ?
         WHERE order_number = ? AND status = 'PENDING'`,
        [
          paymentResult.isMock ? `${gateway.name}-mock` : gateway.name,
          paymentAuthority,
          orderNumber,
        ]
      );
      return result.affectedRows === 1;
    });
  } catch (error) {
    console.error('ذخیره اطلاعات پرداخت ناموفق بود:', {
      orderNumber,
      errorName: error instanceof Error ? error.name : 'unknown',
    });
    return {
      ok: false,
      error: 'در ثبت اطلاعات پرداخت خطایی رخ داد. برای پیگیری با پشتیبانی تماس بگیرید.',
      code: 'PAYMENT_STORAGE_FAILED',
    };
  }
  if (!paymentStored) {
    return {
      ok: false,
      error: 'وضعیت سفارش تغییر کرده است و امکان ادامه پرداخت وجود ندارد.',
      code: 'ORDER_STATE_CHANGED',
    };
  }

  return {
    ok: true,
    orderNumber,
    paymentUrl,
    isMock: paymentResult.isMock ?? false,
  };
}