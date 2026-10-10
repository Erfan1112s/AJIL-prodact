// lib/payment/zarinpal.ts
// ماژول ارتباط با درگاه زرین‌پال
// حالت mock فقط در development فعال است
// در production اگر Merchant ID نباشد، مسدود می‌شود

// ==========================================
// تایپ‌ها
// ==========================================

export interface PaymentRequestParams {
  amount: number;
  description: string;
  callbackUrl: string;
  email?: string;
  mobile?: string;
  orderId?: string;
}

export interface PaymentRequestResult {
  ok: true;
  authority: string;
  paymentUrl: string;
  isMock: boolean;
}

export interface PaymentRequestError {
  ok: false;
  error: string;
  code?: string;
}

export interface PaymentVerifyParams {
  amount: number;
  authority: string;
}

export interface PaymentVerifyResult {
  ok: true;
  refId: string;
  cardPan?: string;
  isMock: boolean;
}

export interface PaymentVerifyError {
  ok: false;
  error: string;
  code?: string;
}

// ==========================================
// URL های زرین‌پال
// ==========================================

const ZARINPAL_PROD_URL = 'https://payment.zarinpal.com/pg';
const ZARINPAL_SANDBOX_URL = 'https://sandbox.zarinpal.com/pg';
const ZARINPAL_PROD_API = 'https://api.zarinpal.com/pg/v4/payment';
const ZARINPAL_SANDBOX_API = 'https://sandbox.zarinpal.com/pg/v4/payment';

// ==========================================
// تنظیمات
// ==========================================

interface Config {
  merchantId: string;
  isSandbox: boolean;
  isMock: boolean;
  isBlocked: boolean;
  apiUrl: string;
  paymentUrl: string;
  blockReason?: string;
}

function getConfig(): Config {
  const merchantId = process.env.ZARINPAL_MERCHANT_ID ?? '';
  const isSandbox = process.env.ZARINPAL_SANDBOX === 'true';
  const isProduction = process.env.NODE_ENV === 'production';
  const hasMerchant = merchantId.length >= 30;

  let isMock = false;
  let isBlocked = false;
  let blockReason: string | undefined;

  if (!hasMerchant) {
    if (isProduction) {
      isBlocked = true;
      blockReason =
        'درگاه پرداخت در حال راه‌اندازی است. لطفاً بعداً تلاش کنید.';
    } else {
      isMock = true;
    }
  }

  return {
    merchantId,
    isSandbox,
    isMock,
    isBlocked,
    blockReason,
    apiUrl: isSandbox ? ZARINPAL_SANDBOX_API : ZARINPAL_PROD_API,
    paymentUrl: isSandbox ? ZARINPAL_SANDBOX_URL : ZARINPAL_PROD_URL,
  };
}

/**
 * آیا سیستم پرداخت مسدود است؟
 */
export function isPaymentBlocked(): { blocked: boolean; reason?: string } {
  const config = getConfig();
  return { blocked: config.isBlocked, reason: config.blockReason };
}

/**
 * آیا در حالت mock هستیم؟
 */
export function isMockMode(): boolean {
  return getConfig().isMock;
}

// ==========================================
// درخواست پرداخت
// ==========================================

export async function requestPayment(
  params: PaymentRequestParams
): Promise<PaymentRequestResult | PaymentRequestError> {
  const config = getConfig();

  // اگر مسدود است، اجازه نده
  if (config.isBlocked) {
    return {
      ok: false,
      error: config.blockReason ?? 'درگاه پرداخت در دسترس نیست',
      code: 'PAYMENT_BLOCKED',
    };
  }

  // اعتبارسنجی مبلغ
  if (!Number.isInteger(params.amount) || params.amount < 1000) {
    return {
      ok: false,
      error: 'مبلغ پرداخت نامعتبر است (حداقل 1000 تومان)',
      code: 'INVALID_AMOUNT',
    };
  }

  // ==========================================
  // حالت mock (فقط development)
  // ==========================================
  if (config.isMock) {
    const fakeAuthority = `MOCK-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    console.warn(
      '[Zarinpal Mock] پرداخت شبیه‌سازی شد. مبلغ:',
      params.amount.toLocaleString('fa-IR'),
      'تومان | سفارش:',
      params.orderId
    );

    return {
      ok: true,
      authority: fakeAuthority,
      paymentUrl: `${params.callbackUrl}?Authority=${fakeAuthority}&Status=OK&mock=1`,
      isMock: true,
    };
  }

  // ==========================================
  // حالت واقعی
  // ==========================================
  try {
    const response = await fetch(`${config.apiUrl}/request.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        merchant_id: config.merchantId,
        amount: params.amount,
        description: params.description,
        callback_url: params.callbackUrl,
        metadata: {
          email: params.email ?? '',
          mobile: params.mobile ?? '',
          order_id: params.orderId ?? '',
        },
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `خطای ارتباط با زرین‌پال (کد ${response.status})`,
        code: 'HTTP_ERROR',
      };
    }

    const data = (await response.json()) as {
      data?: { authority?: string; code?: number };
      errors?: unknown;
    };

    const authority = data.data?.authority;
    const code = data.data?.code;

    if (code !== 100 || !authority) {
      return {
        ok: false,
        error: 'زرین‌پال درخواست را رد کرد',
        code: String(code ?? 'UNKNOWN'),
      };
    }

    return {
      ok: true,
      authority,
      paymentUrl: `${config.paymentUrl}/StartPay/${authority}`,
      isMock: false,
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      return {
        ok: false,
        error: 'درگاه پرداخت پاسخ نداد (timeout)',
        code: 'TIMEOUT',
      };
    }
    return {
      ok: false,
      error: 'خطا در ارتباط با درگاه پرداخت',
      code: 'NETWORK_ERROR',
    };
  }
}

// ==========================================
// تایید پرداخت
// ==========================================

export async function verifyPayment(
  params: PaymentVerifyParams
): Promise<PaymentVerifyResult | PaymentVerifyError> {
  const config = getConfig();

  if (config.isBlocked) {
    return {
      ok: false,
      error: 'درگاه پرداخت در دسترس نیست',
      code: 'PAYMENT_BLOCKED',
    };
  }

  if (!params.authority) {
    return {
      ok: false,
      error: 'کد پرداخت نامعتبر است',
      code: 'INVALID_AUTHORITY',
    };
  }

  if (!Number.isInteger(params.amount) || params.amount < 1000) {
    return {
      ok: false,
      error: 'مبلغ تایید نامعتبر است',
      code: 'INVALID_AMOUNT',
    };
  }

  // ==========================================
  // حالت mock
  // ==========================================
  if (config.isMock) {
    console.warn(
      '[Zarinpal Mock] پرداخت تایید شد (شبیه‌سازی). Authority:',
      params.authority
    );

    return {
      ok: true,
      refId: `MOCK-REF-${Date.now()}`,
      isMock: true,
    };
  }

  // ==========================================
  // حالت واقعی
  // ==========================================
  try {
    const response = await fetch(`${config.apiUrl}/verify.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        merchant_id: config.merchantId,
        amount: params.amount,
        authority: params.authority,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `خطای تایید پرداخت (کد ${response.status})`,
        code: 'HTTP_ERROR',
      };
    }

    const data = (await response.json()) as {
      data?: {
        code?: number;
        ref_id?: number;
        card_pan?: string;
      };
    };

    const code = data.data?.code;
    const refId = data.data?.ref_id;

    if (code === 100 || code === 101) {
      return {
        ok: true,
        refId: String(refId ?? ''),
        cardPan: data.data?.card_pan,
        isMock: false,
      };
    }

    return {
      ok: false,
      error: 'پرداخت تایید نشد',
      code: String(code ?? 'UNKNOWN'),
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      return {
        ok: false,
        error: 'درگاه پرداخت پاسخ نداد (timeout)',
        code: 'TIMEOUT',
      };
    }
    return {
      ok: false,
      error: 'خطا در تایید پرداخت',
      code: 'NETWORK_ERROR',
    };
  }
}