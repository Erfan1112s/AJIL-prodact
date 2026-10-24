// lib/auth/sync-users.ts
// همگام‌سازی جداول قدیمی (customers, admin_users) با جدول users
// این فایل موقتی است و در فاز 1.3 (ورود یکپارچه) حذف می‌شود

import { queryRows, execute } from '@/lib/db';
import { ROLE_NAMES } from '@/lib/auth/roles';

// ==========================================
// نقش‌ها به شناسه (طبق seed)
// ==========================================

const ROLE_IDS = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  ACCOUNTANT: 3,
  SUPPORT_AGENT: 4,
  CUSTOMER: 5,
} as const;

// ==========================================
// همگام‌سازی مشتری
// ==========================================

export async function syncCustomerToUsers(customerId: number): Promise<void> {
  const customers = await queryRows<{
    id: number;
    phone: string;
    full_name: string | null;
    email: string | null;
    password_hash: string | null;
    national_code: string | null;
    is_active: number;
  }>(
    `SELECT id, phone, full_name, email, password_hash,
            national_code, is_active
     FROM customers
     WHERE id = ?
     LIMIT 1`,
    [customerId]
  );

  const customer = customers[0];
  if (!customer) {
    await execute(
      `UPDATE users
       SET is_active = 0
       WHERE customer_id = ? AND is_active = 1`,
      [customerId]
    );
    return;
  }

  const existing = await queryRows<{ id: number }>(
    `SELECT id FROM users WHERE customer_id = ? LIMIT 1`,
    [customerId]
  );

  if (existing.length > 0) {
    await execute(
      `UPDATE users
       SET phone = ?, email = ?, password_hash = ?,
           full_name = ?, national_code = ?,
           is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE customer_id = ?`,
      [
        customer.phone,
        customer.email,
        customer.password_hash,
        customer.full_name,
        customer.national_code,
        customer.is_active,
        customerId,
      ]
    );
  } else {
    await execute(
      `INSERT INTO users (
         phone, username, email, password_hash, full_name, national_code,
         user_type, role_id, customer_id, is_active
       ) VALUES (?, NULL, ?, ?, ?, ?, 'CUSTOMER', ?, ?, ?)`,
      [
        customer.phone,
        customer.email,
        customer.password_hash,
        customer.full_name,
        customer.national_code,
        ROLE_IDS.CUSTOMER,
        customerId,
        customer.is_active,
      ]
    );
  }
}

// ==========================================
// همگام‌سازی ادمین
// ==========================================

export async function syncAdminToUsers(adminId: number): Promise<void> {
  const admins = await queryRows<{
    id: number;
    username: string;
    password_hash: string;
    full_name: string | null;
    role: string;
    is_active: number;
  }>(
    `SELECT id, username, password_hash, full_name, role, is_active
     FROM admin_users
     WHERE id = ?
     LIMIT 1`,
    [adminId]
  );

  const admin = admins[0];
  if (!admin) {
    await execute(
      `UPDATE users
       SET is_active = 0
       WHERE staff_id = ? AND is_active = 1`,
      [adminId]
    );
    return;
  }

  let roleId: number = ROLE_IDS.ADMIN;
  if (admin.role === 'SUPER_ADMIN') {
    roleId = ROLE_IDS.SUPER_ADMIN;
  } else if (admin.role === 'ADMIN') {
    roleId = ROLE_IDS.ADMIN;
  } else if (admin.role === 'EDITOR') {
    roleId = ROLE_IDS.ADMIN;
  }

  const existing = await queryRows<{ id: number }>(
    `SELECT id FROM users WHERE staff_id = ? LIMIT 1`,
    [adminId]
  );

  if (existing.length > 0) {
    await execute(
      `UPDATE users
       SET username = ?, password_hash = ?, full_name = ?,
           role_id = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE staff_id = ?`,
      [
        admin.username,
        admin.password_hash,
        admin.full_name,
        roleId,
        admin.is_active,
        adminId,
      ]
    );
  } else {
    await execute(
      `INSERT INTO users (
         phone, username, email, password_hash, full_name, national_code,
         user_type, role_id, staff_id, is_active
       ) VALUES (NULL, ?, NULL, ?, ?, NULL, 'STAFF', ?, ?, ?)`,
      [
        admin.username,
        admin.password_hash,
        admin.full_name,
        roleId,
        adminId,
        admin.is_active,
      ]
    );
  }
}

// ==========================================
// به‌روزرسانی زمان آخرین ورود
// ==========================================

export async function updateUserLastLogin(
  userId: number,
  ip: string | null = null
): Promise<void> {
  await execute(
    `UPDATE users
     SET last_login_at = CURRENT_TIMESTAMP,
         last_login_ip = ?,
         failed_login_count = 0,
         is_locked = 0,
         locked_until = NULL
     WHERE id = ?`,
    [ip, userId]
  );
}

export async function updateCustomerLastLogin(
  customerId: number,
  ip: string | null = null
): Promise<void> {
  await execute(
    `UPDATE users
     SET last_login_at = CURRENT_TIMESTAMP,
         last_login_ip = ?
     WHERE customer_id = ?`,
    [ip, customerId]
  );
}

export async function updateStaffLastLogin(
  staffId: number,
  ip: string | null = null
): Promise<void> {
  await execute(
    `UPDATE users
     SET last_login_at = CURRENT_TIMESTAMP,
         last_login_ip = ?
     WHERE staff_id = ?`,
    [ip, staffId]
  );
}

// ==========================================
// ابزار تشخیصی (برای دیباگ)
// ==========================================

export async function checkDataConsistency(): Promise<{
  customersWithoutUser: number;
  adminsWithoutUser: number;
  phoneMismatch: number;
  usernameMismatch: number;
}> {
  const [c1] = await queryRows<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM customers c
     LEFT JOIN users u ON u.customer_id = c.id
     WHERE u.id IS NULL`
  );

  const [c2] = await queryRows<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM admin_users a
     LEFT JOIN users u ON u.staff_id = a.id
     WHERE u.id IS NULL`
  );

  const [c3] = await queryRows<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM customers c
     INNER JOIN users u ON u.customer_id = c.id
     WHERE c.phone != u.phone OR u.phone IS NULL`
  );

  const [c4] = await queryRows<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM admin_users a
     INNER JOIN users u ON u.staff_id = a.id
     WHERE a.username != u.username OR u.username IS NULL`
  );

  return {
    customersWithoutUser: Number(c1?.count ?? 0),
    adminsWithoutUser: Number(c2?.count ?? 0),
    phoneMismatch: Number(c3?.count ?? 0),
    usernameMismatch: Number(c4?.count ?? 0),
  };
}