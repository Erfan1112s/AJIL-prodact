// lib/auth/shahkar.ts
// بررسی تطبیق کد ملی با شماره موبایل (سرویس شاهکار)
// فعلاً پیاده‌سازی نشده - ساختار آماده برای اتصال آینده

// ==========================================
// تایپ‌های نتیجه
// ==========================================

interface ShahkarCheckResult {
  ok: true;
  matched: boolean;
}

interface ShahkarCheckError {
  ok: false;
  error: string;
  code?: 'NOT_CONFIGURED' | 'NETWORK_ERROR' | 'INVALID_INPUT';
}

// ==========================================
// اعتبارسنجی فرمت کد ملی
// ==========================================

/**
 * بررسی صحت ساختار کد ملی ایران
 * الگوریتم رسمی بررسی رقم کنترل (mod 11)
 */
export function isValidIranianNationalCode(code: string): boolean {
  // باید دقیقاً 10 رقم باشد
  if (!/^\d{10}$/.test(code)) return false;

  // کدهای تکراری مثل 1111111111 نامعتبر هستند
  if (/^(\d)\1{9}$/.test(code)) return false;

  // بررسی رقم کنترل
  const check = Number(code[9]);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(code[i]) * (10 - i);
  }
  const remainder = sum % 11;

  // اگر باقیمانده کمتر از 2 بود، با رقم کنترل مقایسه کن
  // وگرنه 11 منهای باقیمانده
  if (remainder < 2) {
    return check === remainder;
  }
  return check === 11 - remainder;
}

// ==========================================
// بررسی تطبیق با شاهکار
// ==========================================

interface CheckParams {
  phone: string;
  nationalCode: string;
}

/**
 * بررسی تطبیق کد ملی با شماره موبایل از طریق سرویس شاهکار
 *
 * وضعیت فعلی: پیاده‌سازی نشده
 * چون سرویس شاهکار نیاز به قرارداد جداگانه با اپراتور دارد.
 *
 * وقتی قرارداد امضا شد:
 *   1. متغیرهای محیطی SHAHKAR_API_URL و SHAHKAR_API_KEY را اضافه کن
 *   2. کد داخل try را با فراخوانی واقعی جایگزین کن
 */
export async function checkShahkar(
  params: CheckParams
): Promise<ShahkarCheckResult | ShahkarCheckError> {
  const { phone, nationalCode } = params;

  // اعتبارسنجی اولیه
  if (!/^09\d{9}$/.test(phone)) {
    return {
      ok: false,
      error: 'شماره موبایل نامعتبر',
      code: 'INVALID_INPUT',
    };
  }

  if (!isValidIranianNationalCode(nationalCode)) {
    return {
      ok: false,
      error: 'کد ملی نامعتبر',
      code: 'INVALID_INPUT',
    };
  }

  // ==========================================
  // بررسی پیکربندی
  // ==========================================
  const apiUrl = process.env.SHAHKAR_API_URL;
  const apiKey = process.env.SHAHKAR_API_KEY;

  if (!apiUrl || !apiKey) {
    // سرویس شاهکار پیکربندی نشده
    // برای توسعه، تطبیق را موفق در نظر می‌گیریم
    // در production این باید با قرارداد واقعی جایگزین شود
    return { ok: true, matched: true };
  }

  // ==========================================
  // فراخوانی واقعی (وقتی پیکربندی شد)
  // ==========================================
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ mobile: phone, nationalCode }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: 'خطای سرویس شاهکار',
        code: 'NETWORK_ERROR',
      };
    }

    const data = (await response.json()) as { matched?: boolean };
    return { ok: true, matched: Boolean(data.matched) };
  } catch {
    return {
      ok: false,
      error: 'خطا در ارتباط با سرویس شاهکار',
      code: 'NETWORK_ERROR',
    };
  }
}
