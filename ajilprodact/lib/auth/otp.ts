// lib/auth/otp.ts
// تولید، ذخیره و بررسی کد OTP

import { randomInt } from 'node:crypto';
import { db } from '@/lib/db';
import { sendOtpSms, isValidIranMobile } from '@/lib/auth/sms';

// ==========================================
// تنظیمات
// ==========================================

const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 120;
const OTP_RESEND_INTERVAL_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;

// ==========================================
// تولید کد تصادفی امن
// ==========================================

function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(OTP_LENGTH, '0');
}

// ==========================================
// تایپ‌های نتیجه
// ==========================================

export type RequestOtpResult =
  | { ok: true; expiresInSeconds: number }
  | {
      ok: false;
      error: string;
      code?: 'RATE_LIMIT' | 'INVALID_PHONE' | 'SMS_FAILED';
    };

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
  createIfNotExists?: boolean;
}

export async function requestOtp(
  params: RequestOtpParams
): Promise<RequestOtpResult> {
  const { phone, createIfNotExists = false } = params;

  // 1. بررسی فرمت شماره
  if (!isValidIranMobile(phone)) {
    return {
      ok: false,
      error: 'شماره موبایل نامعتبر است',
      code: 'INVALID_PHONE',
    };
  }

  // 2. چک وجود کاربر
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

  // 3. بررسی محدودیت نرخ ارسال
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

  // 4. تولید کد و زمان انقضا
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

  // 5. ذخیره در دیتابیس
  if (existing) {
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
    await db.query(
      `INSERT INTO customers
         (phone, otp_code, otp_expires_at, otp_attempts, otp_last_sent_at)
       VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)`,
      [phone, code, expiresAt]
    );
  }

  // 6. ارسال پیامک
  const smsResult = await sendOtpSms({ mobile: phone, code });

  if (!smsResult.ok) {
    // پاک کردن کد در صورت خطای ارسال
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

export async function verifyOtp(
  params: VerifyOtpParams
): Promise<VerifyOtpResult> {
  const { phone, code } = params;

  // اعتبارسنجی ورودی
  if (!isValidIranMobile(phone)) {
    return {
      ok: false,
      error: 'شماره موبایل نامعتبر است',
      code: 'NOT_FOUND',
    };
  }

  if (!/^\d{6}$/.test(code)) {
    return {
      ok: false,
      error: 'کد وارد شده نامعتبر است',
      code: 'WRONG_CODE',
    };
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
    await db.query(
      `UPDATE customers
       SET otp_code = NULL, otp_expires_at = NULL
       WHERE id = ?`,
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
    await db.query(
      `UPDATE customers
       SET otp_code = NULL, otp_expires_at = NULL
       WHERE id = ?`,
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
    await db.query(
      `UPDATE customers
       SET otp_attempts = otp_attempts + 1
       WHERE id = ?`,
      [customer.id]
    );

    return {
      ok: false,
      error: 'کد وارد شده اشتباه است',
      code: 'WRONG_CODE',
    };
  }

  // موفق: پاک کردن کد و ثبت زمان تایید
  await db.query(
    `UPDATE customers
     SET otp_code = NULL,
         otp_expires_at = NULL,
         otp_attempts = 0,
         otp_verified_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [customer.id]
  );

  return { ok: true, customerId: customer.id };
}