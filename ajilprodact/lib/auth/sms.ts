// lib/auth/sms.ts
// ماژول ارتباط با سرویس پیامکی SMS.ir
// از fetch داخلی Node.js استفاده می‌کند، بدون پکیج خارجی

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

// آدرس endpoint ارسال با قالب
const SMSIR_VERIFY_URL = 'https://api.sms.ir/v1/send/verify';

// ==========================================
// خواندن تنظیمات از محیط
// ==========================================

function getApiKey(): string {
  const key = process.env.SMSIR_API_KEY;
  if (!key) {
    throw new Error(
      'SMSIR_API_KEY در .env.local تنظیم نشده است'
    );
  }
  return key;
}

function getTemplateId(): number {
  const id = process.env.SMSIR_TEMPLATE_ID;
  if (!id) {
    throw new Error(
      'SMSIR_TEMPLATE_ID در .env.local تنظیم نشده است'
    );
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

/**
 * بررسی اینکه شماره موبایل با فرمت ایران است
 * فرمت مورد قبول: 09xxxxxxxxx (11 رقم، شروع با 09)
 */
export function isValidIranMobile(phone: string): boolean {
  return /^09\d{9}$/.test(phone);
}

/**
 * تبدیل شماره به فرمت استاندارد 09xxxxxxxxx
 * ورودی‌های ممکن: +98912..., 00989..., 0912...
 */
export function normalizePhone(input: string): string | null {
  // حذف فاصله و خط تیره و پرانتز
  const cleaned = input.replace(/[\s\-()]/g, '');

  // +98xxxxxxxxxx
  if (cleaned.startsWith('+98')) {
    const rest = cleaned.slice(3);
    if (rest.length === 10 && rest.startsWith('9')) {
      return '0' + rest;
    }
  }

  // 0098xxxxxxxxxx
  if (cleaned.startsWith('0098')) {
    const rest = cleaned.slice(4);
    if (rest.length === 10 && rest.startsWith('9')) {
      return '0' + rest;
    }
  }

  // 98xxxxxxxxxx (بدون صفر و +)
  if (cleaned.startsWith('98') && cleaned.length === 12) {
    const rest = cleaned.slice(2);
    if (rest.startsWith('9')) {
      return '0' + rest;
    }
  }

  // 09xxxxxxxxx (فرمت اصلی)
  if (cleaned.length === 11 && cleaned.startsWith('09')) {
    return cleaned;
  }

  // 9xxxxxxxxx (بدون صفر ابتدایی)
  if (cleaned.length === 10 && cleaned.startsWith('9')) {
    return '0' + cleaned;
  }

  return null;
}

// ==========================================
// ارسال کد تایید با قالب
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

/**
 * ارسال کد OTP با سرویس SMS.ir
 * از قالب از پیش تعریف‌شده در پنل SMS.ir استفاده می‌کند
 */
export async function sendOtpSms(
  params: SendVerifyParams
): Promise<SendVerifyResult | SendVerifyError> {
  // اعتبارسنجی شماره
  if (!isValidIranMobile(params.mobile)) {
    return { ok: false, error: 'شماره موبایل نامعتبر است' };
  }

  // اعتبارسنجی کد
  if (!/^\d{6}$/.test(params.code)) {
    return { ok: false, error: 'کد OTP باید 6 رقم باشد' };
  }

  try {
    // فراخوانی API SMS.ir
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
      // timeout 10 ثانیه
      // جلوگیری از انتظار بی‌پایان اگر SMS.ir کند بود
      signal: AbortSignal.timeout(10_000),
    });

    // بررسی HTTP status
    if (!response.ok) {
      return {
        ok: false,
        error: `خطای سرویس پیامک (کد ${response.status})`,
      };
    }

    // خواندن پاسخ JSON
    const data = (await response.json()) as SmsIrResponse;

    // بررسی وضعیت API
    // در SMS.ir، status=1 یعنی موفق
    if (data.status !== 1) {
      return {
        ok: false,
        error: data.message || 'خطای نامشخص از سرویس پیامک',
      };
    }

    // بررسی اینکه data برگشته باشد
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
    // خطای شبکه یا timeout
    if (err instanceof Error && err.name === 'TimeoutError') {
      return { ok: false, error: 'سرویس پیامک پاسخ نداد (timeout)' };
    }
    return {
      ok: false,
      error: 'خطا در ارتباط با سرویس پیامک',
    };
  }
}