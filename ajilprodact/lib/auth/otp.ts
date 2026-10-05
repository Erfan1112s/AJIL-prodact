// lib/auth/otp.ts
// تولید، ذخیره و بررسی کد OTP

import { randomInt } from 'node:crypto';
import { db } from '@/lib/db';
import { sendOtpSms, isValidIranMobile } from '@/lib/auth/sms';

// ==========================================
// تنظیمات
// ==========================================

// طول کد
const OTP_LENGTH = 6;

// مدت اعتبار کد به ثانیه (۲ دقیقه)
const OTP_TTL_SECONDS = 120;

// حداقل فاصله بین دو ارسال به ثانیه (۶۰ ثانیه)
const OTP_RESEND_INTERVAL_SECONDS = 60;

// حداکثر تلاش ناموفق برای یک کد
const OTP_MAX_ATTEMPTS = 5;

// ==========================================
// تولید کد تصادفی امن
// ==========================================

/**
 * تولید کد ۶ رقمی با randomInt امن
 * randomInt از crypto داخلی Node می‌آید و برای کاربردهای امنیتی مناسب است
 * Math.random() برای OTP مناسب نیست چون قابل پیش‌بینی است
 */
function generateOtpCode(): string {
  // بازه: 0 تا 999999
  // padStart برای پر کردن صفرهای ابتدایی (مثل 004521)
  return randomInt(0, 1_000_000).toString().padStart(OTP_LENGTH, '0');
}

// ==========================================
// تایپ‌های نتیجه
// ==========================================

export type RequestOtpResult =
  | { ok: true; expiresInSeconds: number }
  | { ok: false; error: string; code?: 'RATE_LIMIT' | 'INVALID_PHONE' | 'SMS_FAILED' };

export type VerifyOtpResult =
  | { ok: true; customerId: number }
  | {
      ok: false;
      error: string;
      code?: 'EXPIRED' | 'MAX_ATTEMPTS' | 'WRONG_CODE' | 'NOT_FOUND';
    };

// ==========================================
// درخواست ارسال OTP
// ==========================================

interface RequestOtpParams {
  phone: string;
  // createIfNotExists: اگر کاربر وجود ندارد، بساز
  // برای ثبت‌نام true، برای بازیابی رمز هم true
  // برای سایر موارد false
  createIfNotExists?: boolean;
}

/**
 * درخواست ارسال کد OTP به شماره مشخص
 * مراحل:
 *   1. بررسی فرمت شماره
 *   2. بررسی محدودیت نرخ ارسال
 *   3. تولید کد
 *   4. ذخیره کد در دیتابیس
 *   5. ارسال پیامک
 */
export async function requestOtp(
  params: RequestOtpParams
): Promise<RequestOtpResult> {
  const { phone, createIfNotExists = false } = params;

  // ۱. بررسی فرمت شماره
  if (!isValidIranMobile(phone)) {
    return {
      ok: false,
      error: 'شماره موبایل نامعتبر است',
      code: 'INVALID_PHONE',
    };
  }

  // ۲. چک وجود کاربر
  const [existingRows] = await db.query<
    Array<{
      id: number;
      otp_last_sent_at: Date | null;
      is_active: number;
    }>
  >(
    `SELECT id, otp_last_sent_at, is_active
     FROM customers
     WHERE phone = ?
     LIMIT 1`,
    [phone]
  );

  const existing = (existingRows as Array<{
    id: number;
    otp_last_sent_at: Date | null;
    is_active: number;
  }>)[0];

  // اگر کاربر وجود ندارد و مجاز به ساخت نیستیم
  if (!existing && !createIfNotExists) {
    return {
      ok: false,
      error: 'حسابی با این شماره یافت نشد',
      code: 'INVALID_PHONE',
    };
  }

  // اگر کاربر وجود دارد ولی غیرفعال است
  if (existing && existing.is_active !== 1) {
    return {
      ok: false,
      error: 'این حساب غیرفعال است',
      code: 'INVALID_PHONE',
    };
  }

  // ۳. بررسی محدودیت نرخ ارسال
  if (existing?.otp_last_sent_at) {
    const lastSent = new Date(existing.otp_last_sent_at).getTime();
    const elapsed = Date.now() - lastSent;
    const minInterval = OTP_RESEND_INTERVAL_SECONDS * 1000;

    if (elapsed < minInterval) {
      const remaining = Math.ceil((minInterval - elapsed) / 1000);
      return {
        ok: false,
        error: `لطفا ${remaining} ثانیه دیگر تلاش کنید`,
        code: 'RATE_LIMIT',
      };
    }
  }

  // ۴. تولید کد
  const code = generateOtpCode();

  // محاسبه زمان انقضا
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

  // ۵. ذخیره در دیتابیس
  if (existing) {
    // به‌روزرسانی کد
    await db.query(
      `UPDATE customers
       SET otp_code = ?,
           otp_expires_at = ?,
           otp_attempts = 0,
           otp_last_sent_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [code, expiresAt, existing.id]
    );
  } else {
    // ساخت کاربر جدید
    await db.query(
      `INSERT INTO customers
         (phone, otp_code, otp_expires_at, otp_attempts, otp_last_sent_at)
       VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)`,
      [phone, code, expiresAt]
    );
  }

  // ۶. ارسال پیامک
  const smsResult = await sendOtpSms({ mobile: phone, code });

  if (!smsResult.ok) {
    // اگر پیامک ارسال نشد، کد را پاک کن تا کاربر گیر نکند
    await db.query(
      `UPDATE customers
       SET otp_code = NULL, otp_expires_at = NULL
       WHERE phone = ?`,
      [phone]
    );

    return {
      ok: false,
      error: smsResult.error,
      code: 'SMS_FAILED',
    };
  }

  return {
    ok: true,
    expiresInSeconds: OTP_TTL_SECONDS,
  };
}

// ==========================================
// بررسی کد OTP
// ==========================================

interface VerifyOtpParams {
  phone: string;
  code: string;
}

/**
 * بررسی صحت کد OTP
 * در صورت موفقیت، customerId را برمی‌گرداند
 * در صورت موفقیت، کد را پاک می‌کند تا دوباره قابل استفاده نباشد
 */
export async function verifyOtp(
  params: VerifyOtpParams
): Promise<VerifyOtpResult> {
  const { phone, code } = params;

  // اعتبارسنجی ورودی
  if (!isValidIranMobile(phone)) {
    return { ok: false, error: 'شماره موبایل نامعتبر است', code: 'NOT_FOUND' };
  }

  if (!/^\d{6}$/.test(code)) {
    return { ok: false, error: 'کد وارد شده نامعتبر است', code: 'WRONG_CODE' };
  }

  // خواندن کاربر و کد فعال
  const [rows] = await db.query<
    Array<{
      id: number;
      otp_code: string | null;
      otp_expires_at: Date | null;
      otp_attempts: number;
    }>
  >(
    `SELECT id, otp_code, otp_expires_at, otp_attempts
     FROM customers
     WHERE phone = ?
     LIMIT 1`,
    [phone]
  );

  const customer = (rows as Array<{
    id: number;
    otp_code: string | null;
    otp_expires_at: Date | null;
    otp_attempts: number;
  }>)[0];

  if (!customer) {
    return { ok: false, error: 'حسابی یافت نشد', code: 'NOT_FOUND' };
  }

  // اگر کدی فعال نیست
  if (!customer.otp_code || !customer.otp_expires_at) {
    return {
      ok: false,
      error: 'کد فعالی وجود ندارد. درخواست جدید بدهید',
      code: 'EXPIRED',
    };
  }

  // بررسی انقضا
  const expiresAt = new Date(customer.otp_expires_at).getTime();
  if (Date.now() > expiresAt) {
    // پاک کردن کد منقضی
    await db.query(
      `UPDATE customers SET otp_code = NULL, otp_expires_at = NULL WHERE id = ?`,
      [customer.id]
    );
    return {
      ok: false,
      error: 'کد منقضی شده است. درخواست جدید بدهید',
      code: 'EXPIRED',
    };
  }

  // بررسی تلاش‌های ناموفق
  if (customer.otp_attempts >= OTP_MAX_ATTEMPTS) {
    // پاک کردن کد پس از حداکثر تلاش
    await db.query(
      `UPDATE customers SET otp_code = NULL, otp_expires_at = NULL WHERE id = ?`,
      [customer.id]
    );
    return {
      ok: false,
      error: 'تعداد تلاش‌های ناموفق زیاد است. درخواست جدید بدهید',
      code: 'MAX_ATTEMPTS',
    };
  }

  // مقایسه کد
  if (customer.otp_code !== code) {
    // افزایش شمارنده تلاش
    await db.query(
      `UPDATE customers SET otp_attempts = otp_attempts + 1 WHERE id = ?`,
      [customer.id]
    );
    return {
      ok: false,
      error: 'کد وارد شده اشتباه است',
      code: 'WRONG_CODE',
    };
  }

  // موفق: پاک کردن کد
  await db.query(
    `UPDATE customers
     SET otp_code = NULL,
         otp_expires_at = NULL,
         otp_attempts = 0
     WHERE id = ?`,
    [customer.id]
  );

  return { ok: true, customerId: customer.id };
}