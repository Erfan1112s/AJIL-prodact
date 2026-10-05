// app/auth/actions.ts
// Server Actions احراز هویت مشتری

'use server';

import { db } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { requestOtp, verifyOtp } from '@/lib/auth/otp';
import {
  setCustomerSessionCookie,
  clearCustomerSessionCookie,
  getCurrentCustomerId,
} from '@/lib/auth/customer-session';
import { isValidIranMobile } from '@/lib/auth/sms';
import type { CustomerRow } from '@/lib/types';

// ==========================================
// تایپ‌های نتیجه
// ==========================================

type ActionOk<T = Record<string, never>> = { ok: true } & T;
type ActionErr = { ok: false; error: string; code?: string };
type ActionResult<T = Record<string, never>> = ActionOk<T> | ActionErr;

// ==========================================
// 1. درخواست OTP ثبت‌نام
// ==========================================

export async function requestRegisterOtpAction(
  formData: FormData
): Promise<ActionResult<{ expiresIn: number }>> {
  const phone = String(formData.get('phone') ?? '').trim();

  if (!isValidIranMobile(phone)) {
    return { ok: false, error: 'شماره موبایل نامعتبر است' };
  }

  // چک نکن که شماره وجود دارد یا نه چون اینجا ثبت‌نام است
  // requestOtp با createIfNotExists=true خودش بررسی می‌کند
  const result = await requestOtp({
    phone,
    createIfNotExists: true,
  });

  if (!result.ok) {
    return { ok: false, error: result.error, code: result.code };
  }

  return { ok: true, expiresIn: result.expiresInSeconds };
}

// ==========================================
// 2. تایید OTP و ساخت حساب + تنظیم رمز
// ==========================================

export async function verifyRegisterAction(
  formData: FormData
): Promise<ActionResult> {
  const phone = String(formData.get('phone') ?? '').trim();
  const code = String(formData.get('code') ?? '').trim();
  const fullName = String(formData.get('fullName') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!isValidIranMobile(phone)) {
    return { ok: false, error: 'شماره موبایل نامعتبر است' };
  }

  if (!/^\d{6}$/.test(code)) {
    return { ok: false, error: 'کد وارد شده باید 6 رقم باشد' };
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

  // بررسی کد
  const verifyResult = await verifyOtp({ phone, code });
  if (!verifyResult.ok) {
    return { ok: false, error: verifyResult.error, code: verifyResult.code };
  }

  // هش رمز
  const passwordHash = await hashPassword(password);

  // به‌روزرسانی مشتری با نام و رمز
  await db.query(
    `UPDATE customers
     SET full_name = ?, password_hash = ?
     WHERE id = ?`,
    [fullName, passwordHash, verifyResult.customerId]
  );

  // ساخت session
  await setCustomerSessionCookie(verifyResult.customerId);

  return { ok: true };
}

// ==========================================
// 3. ورود با رمز عبور
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

  const [rows] = await db.query<CustomerRow[]>(
    `SELECT id, password_hash, is_active
     FROM customers
     WHERE phone = ?
     LIMIT 1`,
    [phone]
  );

  const list = rows as CustomerRow[];
  const customer = list[0];

  // اگر کاربر وجود ندارد یا رمز تنظیم نکرده
  if (!customer || !customer.password_hash) {
    // برای جلوگیری از timing attack، یک verify الکی انجام بده
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
// 4. درخواست OTP بازیابی رمز
// ==========================================

export async function requestResetOtpAction(
  formData: FormData
): Promise<ActionResult<{ expiresIn: number }>> {
  const phone = String(formData.get('phone') ?? '').trim();

  if (!isValidIranMobile(phone)) {
    return { ok: false, error: 'شماره موبایل نامعتبر است' };
  }

  // این بار createIfNotExists=false است
  // چون می‌خواهیم فقط برای حساب‌های موجود بازیابی کنیم
  const result = await requestOtp({
    phone,
    createIfNotExists: false,
  });

  if (!result.ok) {
    return { ok: false, error: result.error, code: result.code };
  }

  return { ok: true, expiresIn: result.expiresInSeconds };
}

// ==========================================
// 5. تایید OTP و تنظیم رمز جدید
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

  const verifyResult = await verifyOtp({ phone, code });
  if (!verifyResult.ok) {
    return { ok: false, error: verifyResult.error, code: verifyResult.code };
  }

  const passwordHash = await hashPassword(password);

  await db.query(
    `UPDATE customers SET password_hash = ? WHERE id = ?`,
    [passwordHash, verifyResult.customerId]
  );

  return { ok: true };
}

// ==========================================
// 6. خروج مشتری
// ==========================================

export async function customerLogoutAction(): Promise<void> {
  await clearCustomerSessionCookie();
}

// ==========================================
// 7. خواندن اطلاعات مشتری فعلی
// ==========================================

export async function getCurrentCustomerAction(): Promise<
  ActionResult<{ customer: CustomerRow }>
> {
  const id = await getCurrentCustomerId();
  if (!id) {
    return { ok: false, error: 'وارد نشده‌اید' };
  }

  const [rows] = await db.query<CustomerRow[]>(
    `SELECT id, phone, full_name, email, default_address,
            order_count, last_order_at, is_active, created_at
     FROM customers
     WHERE id = ? AND is_active = 1
     LIMIT 1`,
    [id]
  );

  const list = rows as CustomerRow[];
  const customer = list[0];

  if (!customer) {
    return { ok: false, error: 'حساب یافت نشد' };
  }

  return { ok: true, customer };
}