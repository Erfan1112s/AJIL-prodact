// app/auth/actions.ts
// Server Actions احراز هویت مشتری

'use server';

import { db, queryRows, execute } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { requestOtp, verifyOtp } from '@/lib/auth/otp';
import {
  setCustomerSessionCookie,
  clearCustomerSessionCookie,
  getCurrentCustomerId,
} from '@/lib/auth/customer-session';
import { isValidIranMobile } from '@/lib/auth/sms';
import type { CustomerRow } from '@/lib/types';

type ActionResult<T = Record<string, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; code?: string };

// ==========================================
// مرحله 1: درخواست OTP
// ==========================================

export async function requestRegisterOtpAction(
  formData: FormData
): Promise<ActionResult<{ expiresIn: number }>> {
  const phone = String(formData.get('phone') ?? '').trim();

  if (!isValidIranMobile(phone)) {
    return { ok: false, error: 'شماره موبایل نامعتبر است' };
  }

  const [existingRows] = await db.query<
    Array<{ id: number; password_hash: string | null }>
  >(
    `SELECT id, password_hash FROM customers WHERE phone = ? LIMIT 1`,
    [phone]
  );

  const existing = (existingRows as Array<{
    id: number;
    password_hash: string | null;
  }>)[0];

  if (existing?.password_hash) {
    return {
      ok: false,
      error: 'این شماره قبلاً ثبت‌نام کرده است. لطفاً وارد شوید.',
      code: 'ALREADY_REGISTERED',
    };
  }

  const result = await requestOtp({ phone, createIfNotExists: true });

  if (!result.ok) {
    return { ok: false, error: result.error, code: result.code };
  }

  return { ok: true, expiresIn: result.expiresInSeconds };
}

// ==========================================
// مرحله 2: تایید OTP
// ==========================================

export async function verifyRegisterOtpAction(
  formData: FormData
): Promise<ActionResult> {
  const phone = String(formData.get('phone') ?? '').trim();
  const code = String(formData.get('code') ?? '').trim();

  if (!isValidIranMobile(phone)) {
    return { ok: false, error: 'شماره موبایل نامعتبر است' };
  }

  if (!/^\d{6}$/.test(code)) {
    return { ok: false, error: 'کد وارد شده باید 6 رقم باشد' };
  }

  const result = await verifyOtp({ phone, code });
  if (!result.ok) {
    return { ok: false, error: result.error, code: result.code };
  }

  return { ok: true };
}

// ==========================================
// مرحله 3: تکمیل اطلاعات (بدون کد ملی)
// ==========================================

export async function completeRegisterAction(
  formData: FormData
): Promise<ActionResult> {
  const phone = String(formData.get('phone') ?? '').trim();
  const fullName = String(formData.get('fullName') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  // اعتبارسنجی
  if (!isValidIranMobile(phone)) {
    return { ok: false, error: 'شماره موبایل نامعتبر است' };
  }

  if (fullName.length < 3 || fullName.length > 100) {
    return { ok: false, error: 'نام باید بین 3 تا 100 کاراکتر باشد' };
  }

  if (password.length < 8) {
    return { ok: false, error: 'رمز عبور باید حداقل 8 کاراکتر باشد' };
  }

  if (password.length > 200) {
    return { ok: false, error: 'رمز عبور بیش از حد طولانی است' };
  }

  // خواندن مشتری
  const [rows] = await db.query<
    Array<{
      id: number;
      password_hash: string | null;
      otp_verified_at: Date | null;
    }>
  >(
    `SELECT id, password_hash, otp_verified_at
     FROM customers WHERE phone = ? LIMIT 1`,
    [phone]
  );

  const customer = (rows as Array<{
    id: number;
    password_hash: string | null;
    otp_verified_at: Date | null;
  }>)[0];

  if (!customer) {
    return {
      ok: false,
      error: 'شماره تایید نشده است. لطفاً از ابتدا شروع کنید.',
      code: 'NOT_VERIFIED',
    };
  }

  if (customer.password_hash) {
    return {
      ok: false,
      error: 'این شماره قبلاً ثبت‌نام کرده است.',
      code: 'ALREADY_REGISTERED',
    };
  }

  if (!customer.otp_verified_at) {
    return {
      ok: false,
      error: 'کد تایید نشده است. لطفاً از ابتدا شروع کنید.',
      code: 'NOT_VERIFIED',
    };
  }

  // بررسی انقضای تایید (30 دقیقه)
  const verifiedAt = new Date(customer.otp_verified_at).getTime();
  const thirtyMinutes = 30 * 60 * 1000;
  if (Date.now() - verifiedAt > thirtyMinutes) {
    return {
      ok: false,
      error: 'زمان تایید به پایان رسیده. لطفاً از ابتدا شروع کنید.',
      code: 'VERIFICATION_EXPIRED',
    };
  }

  // هش رمز
  const passwordHash = await hashPassword(password);

  // به‌روزرسانی
  await db.query(
    `UPDATE customers
     SET full_name = ?, password_hash = ?
     WHERE id = ?`,
    [fullName, passwordHash, customer.id]
  );

  // ساخت session
  await setCustomerSessionCookie(customer.id);

  return { ok: true };
}

// ==========================================
// ورود
// ==========================================

export async function customerLoginAction(
  formData: FormData
): Promise<ActionResult> {
  const phone = String(formData.get('phone') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const genericError = 'شماره موبایل یا رمز عبور اشتباه است';

  if (!isValidIranMobile(phone) || !password) {
    return { ok: false, error: genericError };
  }

  const rows = await queryRows<CustomerRow>(
    `SELECT id, password_hash, is_active FROM customers WHERE phone = ? LIMIT 1`,
    [phone]
  );

  const customer = rows[0];

  if (!customer || !customer.password_hash) {
    await verifyPassword(password, 'aa:bb');
    return { ok: false, error: genericError };
  }

  if (customer.is_active !== 1) {
    return { ok: false, error: 'این حساب غیرفعال است' };
  }

  const valid = await verifyPassword(password, customer.password_hash);
  if (!valid) {
    return { ok: false, error: genericError };
  }

  await setCustomerSessionCookie(customer.id);
  return { ok: true };
}

// ==========================================
// درخواست OTP بازیابی
// ==========================================

export async function requestResetOtpAction(
  formData: FormData
): Promise<ActionResult<{ expiresIn: number }>> {
  const phone = String(formData.get('phone') ?? '').trim();

  if (!isValidIranMobile(phone)) {
    return { ok: false, error: 'شماره موبایل نامعتبر است' };
  }

  const [existingRows] = await db.query<
    Array<{ id: number; password_hash: string | null }>
  >(
    `SELECT id, password_hash FROM customers WHERE phone = ? LIMIT 1`,
    [phone]
  );

  const existing = (existingRows as Array<{
    id: number;
    password_hash: string | null;
  }>)[0];

  if (!existing || !existing.password_hash) {
    return {
      ok: false,
      error: 'این شماره ثبت‌نام نکرده است. لطفاً ابتدا ثبت‌نام کنید.',
      code: 'NOT_REGISTERED',
    };
  }

  const result = await requestOtp({ phone, createIfNotExists: false });

  if (!result.ok) {
    return { ok: false, error: result.error, code: result.code };
  }

  return { ok: true, expiresIn: result.expiresInSeconds };
}

// ==========================================
// تایید OTP و تنظیم رمز جدید
// ==========================================

export async function resetPasswordAction(
  formData: FormData
): Promise<ActionResult> {
  const phone = String(formData.get('phone') ?? '').trim();
  const code = String(formData.get('code') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!isValidIranMobile(phone)) {
    return { ok: false, error: 'شماره موبایل نامعتبر است' };
  }

  if (!/^\d{6}$/.test(code)) {
    return { ok: false, error: 'کد وارد شده باید 6 رقم باشد' };
  }

  if (password.length < 8) {
    return { ok: false, error: 'رمز عبور باید حداقل 8 کاراکتر باشد' };
  }

  const result = await verifyOtp({ phone, code });
  if (!result.ok) {
    return { ok: false, error: result.error, code: result.code };
  }

  const passwordHash = await hashPassword(password);

  await db.query(
    `UPDATE customers SET password_hash = ? WHERE id = ?`,
    [passwordHash, result.customerId]
  );

  return { ok: true };
}

// ==========================================
// خروج
// ==========================================

export async function customerLogoutAction(): Promise<void> {
  await clearCustomerSessionCookie();
}

// ==========================================
// خواندن مشتری فعلی
// ==========================================

export async function getCurrentCustomerAction(): Promise<
  ActionResult<{ customer: CustomerRow }>
> {
  const id = await getCurrentCustomerId();
  if (!id) return { ok: false, error: 'وارد نشده‌اید' };

  const rows = await queryRows<CustomerRow>(
    `SELECT id, phone, full_name, email, default_address,
            order_count, last_order_at, is_active, created_at
     FROM customers WHERE id = ? AND is_active = 1 LIMIT 1`,
    [id]
  );

  const customer = rows[0];
  if (!customer) return { ok: false, error: 'حساب یافت نشد' };

  return { ok: true, customer };
}