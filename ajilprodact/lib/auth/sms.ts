// lib/auth/sms.ts
// ماژول ارتباط با سرویس پیامکی SMS.ir

// ==========================================
// تایپ‌های پاسخ SMS.ir
// ==========================================

interface SmsIrResponse {
  status: number;
  message: string;
  data?: {
    messageId: number;
    cost: number;
  };
}

// ==========================================
// تنظیمات
// ==========================================

const SMSIR_VERIFY_URL = 'https://api.sms.ir/v1/send/verify';

// ==========================================
// خواندن تنظیمات از محیط
// ==========================================

function getApiKey(): string {
  const key = process.env.SMSIR_API_KEY;
  if (!key) {
    throw new Error('SMSIR_API_KEY در .env.local تنظیم نشده است');
  }
  return key;
}

function getTemplateId(): number {
  const id = process.env.SMSIR_TEMPLATE_ID;
  if (!id) {
    throw new Error('SMSIR_TEMPLATE_ID در .env.local تنظیم نشده است');
  }
  const num = Number(id);
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error('SMSIR_TEMPLATE_ID باید یک عدد صحیح باشد');
  }
  return num;
}

// ==========================================
// اعتبارسنجی شماره موبایل
// ==========================================

export function isValidIranMobile(phone: string): boolean {
  return /^09\d{9}$/.test(phone);
}

export function normalizePhone(input: string): string | null {
  const cleaned = input.replace(/[\s\-()]/g, '');

  if (cleaned.startsWith('+98')) {
    const rest = cleaned.slice(3);
    if (rest.length === 10 && rest.startsWith('9')) {
      return '0' + rest;
    }
  }

  if (cleaned.startsWith('0098')) {
    const rest = cleaned.slice(4);
    if (rest.length === 10 && rest.startsWith('9')) {
      return '0' + rest;
    }
  }

  if (cleaned.startsWith('98') && cleaned.length === 12) {
    const rest = cleaned.slice(2);
    if (rest.startsWith('9')) {
      return '0' + rest;
    }
  }

  if (cleaned.length === 11 && cleaned.startsWith('09')) {
    return cleaned;
  }

  if (cleaned.length === 10 && cleaned.startsWith('9')) {
    return '0' + cleaned;
  }

  return null;
}

// ==========================================
// ارسال کد تایید
// ==========================================

interface SendVerifyParams {
  mobile: string;
  code: string;
}

interface SendVerifyResult {
  ok: true;
  messageId: number;
  cost: number;
}

interface SendVerifyError {
  ok: false;
  error: string;
}

export async function sendOtpSms(
  params: SendVerifyParams
): Promise<SendVerifyResult | SendVerifyError> {
  if (!isValidIranMobile(params.mobile)) {
    return { ok: false, error: 'شماره موبایل نامعتبر است' };
  }

  if (!/^\d{6}$/.test(params.code)) {
    return { ok: false, error: 'کد OTP باید 6 رقم باشد' };
  }

  try {
    const response = await fetch(SMSIR_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
        'x-api-key': getApiKey(),
      },
      body: JSON.stringify({
        mobile: params.mobile,
        templateId: getTemplateId(),
        parameters: [
          {
            name: 'CODE',
            value: params.code,
          },
        ],
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `خطای سرویس پیامک (کد ${response.status})`,
      };
    }

    const data = (await response.json()) as SmsIrResponse;

    if (data.status !== 1) {
      return {
        ok: false,
        error: data.message || 'خطای نامشخص از سرویس پیامک',
      };
    }

    if (!data.data) {
      return {
        ok: false,
        error: 'پاسخ سرویس پیامک نامعتبر است',
      };
    }

    return {
      ok: true,
      messageId: data.data.messageId,
      cost: data.data.cost,
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      return { ok: false, error: 'سرویس پیامک پاسخ نداد (timeout)' };
    }
    return {
      ok: false,
      error: 'خطا در ارتباط با سرویس پیامک',
    };
  }
}

// ==========================================
// ارسال پیامک تایید سفارش
// ==========================================

interface OrderSmsParams {
  mobile: string;
  orderNumber: string;
  amount: number;
}

interface OrderSmsResult {
  ok: true;
}

interface OrderSmsError {
  ok: false;
  error: string;
}

export async function sendOrderConfirmationSms(
  params: OrderSmsParams
): Promise<OrderSmsResult | OrderSmsError> {
  const templateId = process.env.SMSIR_ORDER_TEMPLATE_ID;

  // اگر قالب سفارش تنظیم نشده، نادیده بگیر
  if (!templateId) {
    console.warn(
      '[SMS] قالب پیامک سفارش تنظیم نشده - پیامک ارسال نشد'
    );
    return { ok: false, error: 'قالب پیامک سفارش تنظیم نشده' };
  }

  if (!isValidIranMobile(params.mobile)) {
    return { ok: false, error: 'شماره موبایل نامعتبر است' };
  }

  try {
    const response = await fetch(SMSIR_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
        'x-api-key': getApiKey(),
      },
      body: JSON.stringify({
        mobile: params.mobile,
        templateId: Number(templateId),
        parameters: [
          { name: 'ORDER_NUMBER', value: params.orderNumber },
          {
            name: 'AMOUNT',
            value: params.amount.toLocaleString('fa-IR'),
          },
        ],
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return { ok: false, error: `خطای پیامک (کد ${response.status})` };
    }

    const data = (await response.json()) as SmsIrResponse;

    if (data.status !== 1) {
      return { ok: false, error: data.message ?? 'خطای پیامک' };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: 'خطا در ارتباط با سرویس پیامک' };
  }
}