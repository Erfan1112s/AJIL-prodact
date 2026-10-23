// lib/auth/roles.ts
// ثابت‌های نقش‌ها و مجوزها
// این فایل باید هماهنگ با دیتابیس باشد (roles.name, permissions.permission_key)

// ==========================================
// نام نقش‌ها
// ==========================================

export const ROLE_NAMES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  ACCOUNTANT: 'ACCOUNTANT',
  SUPPORT_AGENT: 'SUPPORT_AGENT',
  CUSTOMER: 'CUSTOMER',
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

// ==========================================
// کلیدهای مجوز
// ==========================================

export const PERMISSIONS = {
  // محصولات
  PRODUCTS_READ: 'products.read',
  PRODUCTS_WRITE: 'products.write',
  PRODUCTS_DELETE: 'products.delete',
  PRODUCTS_PRICE: 'products.price',

  // دسته‌بندی
  CATEGORIES_READ: 'categories.read',
  CATEGORIES_WRITE: 'categories.write',
  CATEGORIES_DELETE: 'categories.delete',

  // سفارشات
  ORDERS_READ: 'orders.read',
  ORDERS_UPDATE: 'orders.update',
  ORDERS_DELETE: 'orders.delete',

  // مشتریان
  CUSTOMERS_READ: 'customers.read',
  CUSTOMERS_UPDATE: 'customers.update',

  // نظرات
  REVIEWS_READ: 'reviews.read',
  REVIEWS_MODERATE: 'reviews.moderate',
  REVIEWS_REPLY: 'reviews.reply',
  REVIEWS_DELETE: 'reviews.delete',

  // شعبات
  BRANCHES_READ: 'branches.read',
  BRANCHES_WRITE: 'branches.write',

  // موجودی
  INVENTORY_READ: 'inventory.read',
  INVENTORY_UPDATE: 'inventory.update',

  // مالی
  FINANCE_READ: 'finance.read',
  FINANCE_CHECKS: 'finance.checks',

  // تیکت‌ها
  TICKETS_READ: 'tickets.read',
  TICKETS_REPLY: 'tickets.reply',
  TICKETS_ASSIGN: 'tickets.assign',
  TICKETS_CLOSE: 'tickets.close',
  TICKETS_MANAGE: 'tickets.manage',

  // تخفیف‌ها
  DISCOUNTS_READ: 'discounts.read',
  DISCOUNTS_WRITE: 'discounts.write',
  DISCOUNTS_DELETE: 'discounts.delete',

  // کاربران ادمین
  USERS_READ: 'users.read',
  USERS_MANAGE: 'users.manage',
  ROLES_MANAGE: 'roles.manage',

  // تنظیمات
  SETTINGS_READ: 'settings.read',
  SETTINGS_WRITE: 'settings.write',

  // لاگ
  AUDIT_READ: 'audit.read',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ==========================================
// گروه‌بندی مجوزها (برای UI)
// ==========================================

export interface PermissionGroup {
  key: string;
  label: string;
  permissions: Array<{
    key: PermissionKey;
    label: string;
  }>;
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: 'products',
    label: 'محصولات',
    permissions: [
      { key: PERMISSIONS.PRODUCTS_READ, label: 'مشاهده محصولات' },
      { key: PERMISSIONS.PRODUCTS_WRITE, label: 'افزودن/ویرایش محصول' },
      { key: PERMISSIONS.PRODUCTS_DELETE, label: 'حذف محصول' },
      { key: PERMISSIONS.PRODUCTS_PRICE, label: 'تغییر قیمت' },
    ],
  },
  {
    key: 'categories',
    label: 'دسته‌بندی‌ها',
    permissions: [
      { key: PERMISSIONS.CATEGORIES_READ, label: 'مشاهده دسته‌ها' },
      { key: PERMISSIONS.CATEGORIES_WRITE, label: 'افزودن/ویرایش دسته' },
      { key: PERMISSIONS.CATEGORIES_DELETE, label: 'حذف دسته' },
    ],
  },
  {
    key: 'orders',
    label: 'سفارشات',
    permissions: [
      { key: PERMISSIONS.ORDERS_READ, label: 'مشاهده سفارشات' },
      { key: PERMISSIONS.ORDERS_UPDATE, label: 'تغییر وضعیت سفارش' },
      { key: PERMISSIONS.ORDERS_DELETE, label: 'حذف سفارش' },
    ],
  },
  {
    key: 'customers',
    label: 'مشتریان',
    permissions: [
      { key: PERMISSIONS.CUSTOMERS_READ, label: 'مشاهده مشتریان' },
      { key: PERMISSIONS.CUSTOMERS_UPDATE, label: 'ویرایش مشتری' },
    ],
  },
  {
    key: 'reviews',
    label: 'نظرات',
    permissions: [
      { key: PERMISSIONS.REVIEWS_READ, label: 'مشاهده نظرات' },
      { key: PERMISSIONS.REVIEWS_MODERATE, label: 'تایید/رد نظر' },
      { key: PERMISSIONS.REVIEWS_REPLY, label: 'پاسخ به نظر' },
      { key: PERMISSIONS.REVIEWS_DELETE, label: 'حذف نظر' },
    ],
  },
  {
    key: 'branches',
    label: 'شعبات',
    permissions: [
      { key: PERMISSIONS.BRANCHES_READ, label: 'مشاهده شعبات' },
      { key: PERMISSIONS.BRANCHES_WRITE, label: 'افزودن/ویرایش شعبه' },
    ],
  },
  {
    key: 'inventory',
    label: 'موجودی',
    permissions: [
      { key: PERMISSIONS.INVENTORY_READ, label: 'مشاهده موجودی' },
      { key: PERMISSIONS.INVENTORY_UPDATE, label: 'تغییر موجودی' },
    ],
  },
  {
    key: 'finance',
    label: 'مالی',
    permissions: [
      { key: PERMISSIONS.FINANCE_READ, label: 'مشاهده گزارش مالی' },
      { key: PERMISSIONS.FINANCE_CHECKS, label: 'مدیریت چک‌ها' },
    ],
  },
  {
    key: 'tickets',
    label: 'تیکت‌ها',
    permissions: [
      { key: PERMISSIONS.TICKETS_READ, label: 'مشاهده تیکت‌ها' },
      { key: PERMISSIONS.TICKETS_REPLY, label: 'پاسخ به تیکت' },
      { key: PERMISSIONS.TICKETS_ASSIGN, label: 'تخصیص تیکت' },
      { key: PERMISSIONS.TICKETS_CLOSE, label: 'بستن تیکت' },
      { key: PERMISSIONS.TICKETS_MANAGE, label: 'مدیریت کامل تیکت‌ها' },
    ],
  },
  {
    key: 'discounts',
    label: 'تخفیف‌ها',
    permissions: [
      { key: PERMISSIONS.DISCOUNTS_READ, label: 'مشاهده تخفیف‌ها' },
      { key: PERMISSIONS.DISCOUNTS_WRITE, label: 'ایجاد/ویرایش تخفیف' },
      { key: PERMISSIONS.DISCOUNTS_DELETE, label: 'حذف تخفیف' },
    ],
  },
  {
    key: 'users',
    label: 'کاربران ادمین',
    permissions: [
      { key: PERMISSIONS.USERS_READ, label: 'مشاهده کاربران' },
      { key: PERMISSIONS.USERS_MANAGE, label: 'مدیریت کاربران' },
      { key: PERMISSIONS.ROLES_MANAGE, label: 'مدیریت نقش‌ها' },
    ],
  },
  {
    key: 'settings',
    label: 'تنظیمات',
    permissions: [
      { key: PERMISSIONS.SETTINGS_READ, label: 'مشاهده تنظیمات' },
      { key: PERMISSIONS.SETTINGS_WRITE, label: 'ویرایش تنظیمات' },
    ],
  },
  {
    key: 'audit',
    label: 'لاگ حسابرسی',
    permissions: [
      { key: PERMISSIONS.AUDIT_READ, label: 'مشاهده لاگ‌ها' },
    ],
  },
];

// ==========================================
// تایپ‌های کمکی
// ==========================================

// آیا نام داده‌شده یک نقش معتبر است؟
export function isValidRoleName(name: string): name is RoleName {
  return Object.values(ROLE_NAMES).includes(name as RoleName);
}

// آیا کلید داده‌شده یک مجوز معتبر است؟
export function isValidPermissionKey(key: string): key is PermissionKey {
  return Object.values(PERMISSIONS).includes(key as PermissionKey);
}