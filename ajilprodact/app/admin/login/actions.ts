// app/admin/login/actions.ts
// Server Action ورود ادمین

'use server';

import { db, queryRows, execute } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { setSessionCookie } from '@/lib/auth/session';

// تایپ خروجی
type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

// تایپ ردیف کاربر ادمین
interface AdminUserRow {
  id: number;
  username: string;
  password_hash: string;
  is_active: number;
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  // خواندن ورودی‌ها
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  // اعتبارسنجی اولیه
  if (!username || !password) {
    return { ok: false, error: 'نام کاربری و رمز عبور الزامی است' };
  }

  if (username.length > 50 || password.length > 200) {
    return { ok: false, error: 'نام کاربری یا رمز عبور نامعتبر' };
  }

  // گرفتن کاربر از دیتابیس
  const rows = await queryRows<AdminUserRow>(
    `SELECT id, username, password_hash, is_active
     FROM admin_users
     WHERE username = ?
     LIMIT 1`,
    [username]
  );

  const list = rows;
  const user = list[0];

  // پیام خطای یکسان برای همه حالات
  // جلوگیری از افشای اطلاعات (کاربر وجود دارد یا نه)
  const genericError = 'نام کاربری یا رمز عبور اشتباه است';

  if (!user) {
    // برای جلوگیری از timing attack، یک هش انجام بده
    // حتی وقتی کاربر وجود ندارد
    await verifyPassword(password, 'aa:bb');
    return { ok: false, error: genericError };
  }

  if (user.is_active !== 1) {
    return { ok: false, error: 'حساب کاربری غیرفعال است' };
  }

  // بررسی رمز
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return { ok: false, error: genericError };
  }

  // به‌روزرسانی last_login_at
  await db.query(
    `UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [user.id]
  );

  // ست کردن کوکی session
  await setSessionCookie(user.id);

  return { ok: true };
}