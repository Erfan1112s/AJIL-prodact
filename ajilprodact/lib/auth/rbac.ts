// lib/auth/rbac.ts
// توابع کنترل دسترسی مبتنی بر نقش و مجوز (RBAC)
// این فایل فقط در Server اجرا می‌شود (به‌خاطر use of next/headers)

import { queryRows } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth/session';
import {
  ROLE_NAMES,
  type PermissionKey,
  type RoleName,
} from '@/lib/auth/roles';
import type {
  RoleRow,
  UserRow,
  UserWithPermissions,
  UserWithRole,
} from '@/lib/types';

// ==========================================
// خطاهای اختصاصی
// ==========================================

/**
 * خطای «وارد نشده‌اید»
 * معمولاً به redirect به صفحه ورود تبدیل می‌شود
 */
export class UnauthorizedError extends Error {
  constructor(message = 'برای این عملیات باید وارد حساب خود شوید') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * خطای «دسترسی ندارید»
 * کاربر وارد شده ولی مجوز ندارد
 */
export class ForbiddenError extends Error {
  constructor(message = 'شما به این بخش دسترسی ندارید') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

// ==========================================
// خواندن کاربر با نقش
// ==========================================

/**
 * گرفتن کاربر با اطلاعات نقش
 * اگر کاربر وجود نداشته باشد یا غیرفعال باشد، null برمی‌گرداند
 */
export async function getUserWithRole(
  userId: number
): Promise<UserWithRole | null> {
  // JOIN users با roles برای گرفتن همه اطلاعات در یک کوئری
  const rows = await queryRows<
    UserRow & {
      role_name: string;
      role_display_name: string;
      role_description: string | null;
      role_is_system: number;
      role_created_at: Date;
      role_updated_at: Date;
    }
  >(
    `SELECT
       u.id, u.phone, u.username, u.email, u.password_hash,
       u.full_name, u.national_code, u.user_type, u.role_id,
       u.customer_id, u.staff_id, u.is_active, u.is_locked,
       u.failed_login_count, u.locked_until, u.last_login_at,
       u.last_login_ip, u.created_at, u.updated_at,
       r.name AS role_name,
       r.display_name AS role_display_name,
       r.description AS role_description,
       r.is_system AS role_is_system,
       r.created_at AS role_created_at,
       r.updated_at AS role_updated_at
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE u.id = ? AND u.is_active = 1
     LIMIT 1`,
    [userId]
  );

  const row = rows[0];
  if (!row) return null;

  // جدا کردن فیلدهای نقش از فیلدهای کاربر
  const {
    role_name,
    role_display_name,
    role_description,
    role_is_system,
    role_created_at,
    role_updated_at,
    ...userFields
  } = row;

  const role: RoleRow = {
    id: userFields.role_id,
    name: role_name,
    display_name: role_display_name,
    description: role_description,
    is_system: role_is_system,
    created_at: role_created_at,
    updated_at: role_updated_at,
  };

  return {
    ...userFields,
    role,
  };
}

// ==========================================
// خواندن مجوزهای کاربر
// ==========================================

/**
 * گرفتن لیست کلیدهای مجوز کاربر
 * اگر کاربر غیرفعال باشد یا وجود نداشته باشد، آرایه خالی برمی‌گرداند
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  const rows = await queryRows<{ permission_key: string }>(
    `SELECT p.permission_key
     FROM users u
     INNER JOIN role_permissions rp ON rp.role_id = u.role_id
     INNER JOIN permissions p ON p.id = rp.permission_id
     WHERE u.id = ? AND u.is_active = 1`,
    [userId]
  );

  return rows.map((r) => r.permission_key);
}

// ==========================================
// گرفتن کاربر فعلی (از session + دیتابیس)
// ==========================================

/**
 * کاربر فعلی با نقش و مجوزها
 * اگر وارد نشده باشد یا کاربر غیرفعال باشد، null برمی‌گرداند
 *
 * این تابع در Server Components و Server Actions استفاده می‌شود
 */
export async function getCurrentUser(): Promise<UserWithPermissions | null> {
  // ۱. خواندن userId از کوکی
  const userId = await getCurrentUserId();
  if (!userId) return null;

  // ۲. گرفتن اطلاعات کاربر و مجوزها به صورت موازی
  const [userWithRole, permissions] = await Promise.all([
    getUserWithRole(userId),
    getUserPermissions(userId),
  ]);

  if (!userWithRole) return null;

  return {
    ...userWithRole,
    permissions,
  };
}

// ==========================================
// بررسی مجوز
// ==========================================

/**
 * آیا کاربر مجوز مشخصی دارد؟
 */
export async function can(
  userId: number,
  permission: PermissionKey
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
}

/**
 * نیاز به مجوز (اگر ندارد، throw می‌کند)
 * در Server Actions استفاده می‌شود
 */
export async function requirePermission(
  userId: number,
  permission: PermissionKey
): Promise<void> {
  const allowed = await can(userId, permission);
  if (!allowed) {
    throw new ForbiddenError(
      `برای انجام این عملیات به مجوز «${permission}» نیاز دارید`
    );
  }
}

// ==========================================
// بررسی نقش
// ==========================================

/**
 * آیا کاربر نقش مشخصی دارد؟
 */
export async function hasRole(
  userId: number,
  roleName: RoleName
): Promise<boolean> {
  const rows = await queryRows<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE u.id = ? AND r.name = ? AND u.is_active = 1`,
    [userId, roleName]
  );

  return Number(rows[0]?.count ?? 0) > 0;
}

/**
 * نیاز به نقش (اگر ندارد، throw می‌کند)
 */
export async function requireRole(
  userId: number,
  roleName: RoleName
): Promise<void> {
  const has = await hasRole(userId, roleName);
  if (!has) {
    throw new ForbiddenError(
      `این عملیات فقط برای نقش «${roleName}» مجاز است`
    );
  }
}

// ==========================================
// بررسی نوع کاربر
// ==========================================

/**
 * آیا کاربر کارمند (STAFF) است؟
 * هر نقش ادمینی (SUPER_ADMIN, ADMIN, ACCOUNTANT, SUPPORT_AGENT)
 */
export async function isStaff(userId: number): Promise<boolean> {
  const rows = await queryRows<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM users
     WHERE id = ? AND user_type = 'STAFF' AND is_active = 1`,
    [userId]
  );

  return Number(rows[0]?.count ?? 0) > 0;
}

/**
 * آیا کاربر مشتری (CUSTOMER) است؟
 */
export async function isCustomer(userId: number): Promise<boolean> {
  const rows = await queryRows<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM users
     WHERE id = ? AND user_type = 'CUSTOMER' AND is_active = 1`,
    [userId]
  );

  return Number(rows[0]?.count ?? 0) > 0;
}

/**
 * نیاز به کارمند بودن (اگر مشتری است، throw)
 */
export async function requireStaff(userId: number): Promise<void> {
  const has = await isStaff(userId);
  if (!has) {
    throw new ForbiddenError('این بخش فقط برای کارمندان مجاز است');
  }
}

// ==========================================
// ترکیب‌های راحتی (برای Server Actions)
// ==========================================

/**
 * نیاز به لاگین بودن (اگر نبود، throw)
 * userId را برمی‌گرداند
 */
export async function requireAuth(): Promise<number> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}

/**
 * نیاز به لاگین + مجوز (اگر نبود، throw)
 * userId را برمی‌گرداند
 *
 * نمونه استفاده در Server Actions:
 *   const adminId = await requireCurrentPermission(PERMISSIONS.PRODUCTS_WRITE);
 *   // از اینجا به بعد مطمئنیم که مجوز دارد
 */
export async function requireCurrentPermission(
  permission: PermissionKey
): Promise<number> {
  const userId = await requireAuth();
  await requirePermission(userId, permission);
  return userId;
}

/**
 * نیاز به لاگین + کارمند بودن
 */
export async function requireCurrentStaff(): Promise<number> {
  const userId = await requireAuth();
  await requireStaff(userId);
  return userId;
}

/**
 * آیا کاربر فعلی مجوزی دارد؟ (بدون throw)
 */
export async function currentUserCan(
  permission: PermissionKey
): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;
  return can(userId, permission);
}