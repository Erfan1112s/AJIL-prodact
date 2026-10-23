-- db/migrations/006-unified-users.sql
-- این migration داده‌های موجود را حفظ می‌کند
-- و هیچ جدولی را حذف نمی‌کند

SET NAMES utf8mb4;

-- ==========================================
-- 1. جدول roles
-- نقش‌های سیستم
-- ==========================================
CREATE TABLE IF NOT EXISTS roles (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name         VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description  TEXT NULL,
  is_system    TINYINT(1) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 2. جدول permissions
-- مجوزهای ریز
-- ==========================================
CREATE TABLE IF NOT EXISTS permissions (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  permission_key VARCHAR(100) NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  group_name   VARCHAR(50) NOT NULL,
  description  VARCHAR(255) NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_permissions_key (permission_key),
  KEY idx_permissions_group (group_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 3. جدول role_permissions
-- اتصال نقش به مجوز
-- ==========================================
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  KEY idx_role_permissions_perm (permission_id),
  CONSTRAINT fk_role_permissions_role
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_role_permissions_perm
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 4. جدول users
-- کاربران یکپارچه
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  phone               VARCHAR(15) NULL,
  username            VARCHAR(50) NULL,
  email               VARCHAR(100) NULL,
  password_hash       VARCHAR(255) NULL,
  full_name           VARCHAR(100) NULL,
  national_code       VARCHAR(10) NULL,
  user_type           ENUM('CUSTOMER', 'STAFF') NOT NULL DEFAULT 'CUSTOMER',
  role_id             INT UNSIGNED NOT NULL,
  customer_id         INT UNSIGNED NULL,
  staff_id            INT UNSIGNED NULL,
  is_active           TINYINT(1) NOT NULL DEFAULT 1,
  is_locked           TINYINT(1) NOT NULL DEFAULT 0,
  failed_login_count  INT UNSIGNED NOT NULL DEFAULT 0,
  locked_until        TIMESTAMP NULL,
  last_login_at       TIMESTAMP NULL,
  last_login_ip       VARCHAR(45) NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_phone (phone),
  UNIQUE KEY uk_users_username (username),
  KEY idx_users_role (role_id),
  KEY idx_users_type (user_type),
  KEY idx_users_customer (customer_id),
  KEY idx_users_staff (staff_id),
  KEY idx_users_active (is_active),
  CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_users_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_users_staff
    FOREIGN KEY (staff_id) REFERENCES admin_users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 5. جدول user_sessions
-- برای revoke کردن session
-- ==========================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        INT UNSIGNED NOT NULL,
  token_hash     VARCHAR(128) NOT NULL,
  ip_address     VARCHAR(45) NULL,
  user_agent     VARCHAR(500) NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at     TIMESTAMP NOT NULL,
  revoked_at     TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_sessions_token (token_hash),
  KEY idx_user_sessions_user (user_id),
  KEY idx_user_sessions_expires (expires_at),
  CONSTRAINT fk_user_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 6. درج نقش‌های پیش‌فرض
-- ==========================================
INSERT INTO roles (id, name, display_name, description, is_system) VALUES
  (1, 'SUPER_ADMIN',    'مالک سیستم',      'دسترسی کامل به همه بخش‌ها', 1),
  (2, 'ADMIN',          'مدیر فروشگاه',    'مدیریت محصولات، سفارشات و محتوا', 1),
  (3, 'ACCOUNTANT',     'حسابدار',         'دسترسی به گزارش‌های مالی و موجودی', 1),
  (4, 'SUPPORT_AGENT',  'کارشناس پشتیبانی','پاسخ‌گویی به تیکت‌ها', 1),
  (5, 'CUSTOMER',       'مشتری',           'دسترسی به حساب کاربری خود', 1);


-- ==========================================
-- 7. درج مجوزهای پیش‌فرض
-- ==========================================
INSERT INTO permissions (permission_key, display_name, group_name, description) VALUES
  -- محصولات
  ('products.read',        'مشاهده محصولات',       'products',   'مشاهده لیست و جزئیات محصولات در پنل ادمین'),
  ('products.write',       'افزودن/ویرایش محصول',   'products',   'ایجاد و ویرایش محصولات'),
  ('products.delete',      'حذف محصول',             'products',   'حذف محصولات'),
  ('products.price',       'تغییر قیمت',            'products',   'ویرایش قیمت محصولات'),

  -- دسته‌بندی
  ('categories.read',      'مشاهده دسته‌ها',        'categories', 'مشاهده دسته‌بندی‌ها'),
  ('categories.write',     'افزودن/ویرایش دسته',   'categories', 'ایجاد و ویرایش دسته‌بندی‌ها'),
  ('categories.delete',    'حذف دسته',              'categories', 'حذف دسته‌بندی‌ها'),

  -- سفارشات
  ('orders.read',          'مشاهده سفارشات',        'orders',     'مشاهده سفارشات'),
  ('orders.update',        'تغییر وضعیت سفارش',     'orders',     'تغییر وضعیت، ثبت کد رهگیری'),
  ('orders.delete',        'حذف سفارش',             'orders',     'حذف سفارشات'),

  -- مشتریان
  ('customers.read',       'مشاهده مشتریان',        'customers',  'مشاهده لیست مشتریان'),
  ('customers.update',     'ویرایش مشتری',           'customers',  'ویرایش اطلاعات مشتری'),

  -- نظرات
  ('reviews.read',         'مشاهده نظرات',          'reviews',    'مشاهده لیست نظرات'),
  ('reviews.moderate',     'تایید/رد نظر',          'reviews',    'تایید یا رد نظرات'),
  ('reviews.reply',        'پاسخ به نظر',           'reviews',    'پاسخ ادمین به نظرات'),
  ('reviews.delete',       'حذف نظر',               'reviews',    'حذف نظرات'),

  -- شعبات و موجودی
  ('branches.read',        'مشاهده شعبات',          'branches',   'مشاهده شعبات'),
  ('branches.write',       'افزودن/ویرایش شعبه',    'branches',   'ایجاد و ویرایش شعبات'),
  ('inventory.read',       'مشاهده موجودی',         'inventory',  'مشاهده موجودی شعبات'),
  ('inventory.update',     'تغییر موجودی',          'inventory',  'ویرایش موجودی'),

  -- مالی
  ('finance.read',         'مشاهده گزارش مالی',     'finance',    'مشاهده گزارش فروش و درآمد'),
  ('finance.checks',       'مدیریت چک‌ها',          'finance',    'مدیریت چک‌های مشتریان'),

  -- تیکت‌ها
  ('tickets.read',         'مشاهده تیکت‌ها',        'tickets',    'مشاهده تیکت‌های پشتیبانی'),
  ('tickets.reply',        'پاسخ به تیکت',          'tickets',    'پاسخ‌گویی به تیکت‌ها'),
  ('tickets.assign',       'تخصیص تیکت',            'tickets',    'تخصیص تیکت به کارشناس'),
  ('tickets.close',        'بستن تیکت',             'tickets',    'بستن تیکت‌ها'),
  ('tickets.manage',       'مدیریت کامل تیکت‌ها',   'tickets',    'دسترسی کامل به همه تیکت‌ها'),

  -- تخفیف‌ها
  ('discounts.read',       'مشاهده کدهای تخفیف',    'discounts',  'مشاهده کدهای تخفیف'),
  ('discounts.write',      'ایجاد/ویرایش تخفیف',    'discounts',  'ایجاد و ویرایش کدهای تخفیف'),
  ('discounts.delete',     'حذف تخفیف',             'discounts',  'حذف کدهای تخفیف'),

  -- کاربران ادمین
  ('users.read',           'مشاهده کاربران ادمین',  'users',      'مشاهده لیست کاربران STAFF'),
  ('users.manage',         'مدیریت کاربران',        'users',      'ایجاد/ویرایش/غیرفعال کاربران STAFF'),
  ('roles.manage',         'مدیریت نقش‌ها',         'users',      'ایجاد/ویرایش نقش‌ها و مجوزها'),

  -- تنظیمات
  ('settings.read',        'مشاهده تنظیمات',        'settings',   'مشاهده تنظیمات فروشگاه'),
  ('settings.write',       'ویرایش تنظیمات',        'settings',   'ویرایش تنظیمات فروشگاه'),

  -- لاگ
  ('audit.read',           'مشاهده لاگ حسابرسی',    'audit',      'مشاهده لاگ عملیات ادمین‌ها');


-- ==========================================
-- 8. اتصال مجوزها به نقش‌ها
-- ==========================================

-- SUPER_ADMIN: همه مجوزها
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- ADMIN: محصولات، دسته‌ها، سفارشات، مشتریان، نظرات، شعبات، تخفیف‌ها، تنظیمات
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions
WHERE permission_key IN (
  'products.read', 'products.write', 'products.delete', 'products.price',
  'categories.read', 'categories.write', 'categories.delete',
  'orders.read', 'orders.update', 'orders.delete',
  'customers.read', 'customers.update',
  'reviews.read', 'reviews.moderate', 'reviews.reply', 'reviews.delete',
  'branches.read', 'branches.write',
  'inventory.read', 'inventory.update',
  'discounts.read', 'discounts.write', 'discounts.delete',
  'settings.read'
);

-- ACCOUNTANT: مالی، موجودی، سفارشات (خواندن)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions
WHERE permission_key IN (
  'orders.read',
  'finance.read', 'finance.checks',
  'branches.read',
  'inventory.read', 'inventory.update',
  'products.read',
  'customers.read'
);

-- SUPPORT_AGENT: تیکت‌ها، نظرات (پاسخ)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions
WHERE permission_key IN (
  'tickets.read', 'tickets.reply', 'tickets.assign', 'tickets.close',
  'reviews.read', 'reviews.reply',
  'orders.read',
  'customers.read',
  'products.read'
);

-- CUSTOMER: هیچ مجوز ادمینی ندارد
-- (دسترسی به حساب خودش در کد بررسی می‌شود، نه با permission)


-- ==========================================
-- 9. مهاجرت مشتریان موجود به users
-- ==========================================
INSERT INTO users (
  phone, username, email, password_hash, full_name,
  national_code, user_type, role_id, customer_id,
  is_active, created_at, updated_at
)
SELECT
  c.phone,
  NULL,
  c.email,
  c.password_hash,
  c.full_name,
  c.national_code,
  'CUSTOMER',
  5,
  c.id,
  c.is_active,
  c.created_at,
  c.updated_at
FROM customers c
WHERE c.phone IS NOT NULL AND c.phone != '';


-- ==========================================
-- 10. مهاجرت ادمین‌ها موجود به users
-- ==========================================
INSERT INTO users (
  phone, username, email, password_hash, full_name,
  national_code, user_type, role_id, staff_id,
  is_active, created_at, updated_at
)
SELECT
  NULL,
  a.username,
  NULL,
  a.password_hash,
  a.full_name,
  NULL,
  'STAFF',
  CASE
    WHEN a.role = 'SUPER_ADMIN' THEN 1
    WHEN a.role = 'ADMIN' THEN 2
    ELSE 2
  END,
  a.id,
  a.is_active,
  a.created_at,
  a.updated_at
FROM admin_users a;


-- ==========================================
-- 11. بررسی نهایی
-- ==========================================
SELECT 'roles' AS tbl, COUNT(*) AS cnt FROM roles
UNION ALL
SELECT 'permissions', COUNT(*) FROM permissions
UNION ALL
SELECT 'role_permissions', COUNT(*) FROM role_permissions
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'admin_users', COUNT(*) FROM admin_users;