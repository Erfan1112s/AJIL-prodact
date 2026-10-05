// lib/types.ts
// تایپ‌های TypeScript متناظر با جدول‌های دیتابیس
// نام‌گذاری: هر تایپ به Row ختم می‌شود اگر مستقیماً یک ردیف جدول باشد

import type { RowDataPacket } from 'mysql2';

// ==========================================
// بخش 1: تایپ‌های پایه (هر کدام یک ردیف جدول)
// ==========================================

export interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: number | null;
  sort_order: number;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProductRow extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  short_desc: string | null;
  category_id: number;
  meta_title: string | null;
  meta_desc: string | null;
  is_active: number;
  is_featured: number;
  view_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProductVariantRow extends RowDataPacket {
  id: number;
  product_id: number;
  weight_gram: number;
  price: number;
  compare_price: number | null;
  sku: string | null;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProductImageRow extends RowDataPacket {
  id: number;
  product_id: number;
  url: string;
  alt: string | null;
  sort_order: number;
  is_primary: number;
  created_at: Date;
}

export interface BatchRow extends RowDataPacket {
  id: number;
  batch_code: string;
  product_id: number;
  supplier_name: string | null;
  harvest_date: Date | null;
  roast_date: Date | null;
  pack_date: Date | null;
  expiry_date: Date | null;
  freshness_score: number;
  qc_note: string | null;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

export interface BranchRow extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

export interface BranchInventoryRow extends RowDataPacket {
  id: number;
  branch_id: number;
  variant_id: number;
  stock: number;
  reserved: number;
  updated_at: Date;
}

// ردیف جدول customers (به‌روزرسانی‌شده)
export interface CustomerRow {
  id: number;
  phone: string;
  full_name: string | null;
  email: string | null;
  password_hash: string | null;
  otp_code: string | null;
  otp_expires_at: Date | null;
  otp_attempts: number;
  otp_last_sent_at: Date | null;
  default_address: string | null;
  admin_note: string | null;
  order_count: number;
  last_order_at: Date | null;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

export interface OrderRow extends RowDataPacket {
  id: number;
  order_number: string;
  customer_id: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  address: string | null;
  total_amount: number;
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  payment_method: string | null;
  payment_ref: string | null;
  order_type: 'ONLINE' | 'IN_STORE';
  branch_id: number | null;
  note: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItemRow extends RowDataPacket {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number;
  product_name: string;
  weight_gram: number;
  price: number;
  quantity: number;
  created_at: Date;
}

// ==========================================
// بخش 2: تایپ‌های ترکیبی (شکل خروجی، نه ردیف خام)
// این‌ها به db.query پاس داده نمی‌شوند، پس نیازی به RowDataPacket ندارند
// ==========================================

// خلاصه دسته‌بندی (شکل خروجی برای کارت محصول)
export interface CategorySummary {
  id: number;
  name: string;
  slug: string;
}

// دسته‌بندی با فرزندانش (برای منوی درختی)
export interface CategoryWithChildren {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: number | null;
  sort_order: number;
  is_active: number;
  created_at: Date;
  updated_at: Date;
  children: CategoryWithChildren[];
}

// محصول با اطلاعات خلاصه (برای کارت محصول در لیست)
export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  short_desc: string | null;
  category: CategorySummary;
  variants: ProductVariantRow[];
  primary_image: ProductImageRow | null;
  min_price: number;
  is_featured: number;
}

// محصول کامل با همه جزئیات (برای صفحه تک محصول)
export interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  short_desc: string | null;
  meta_title: string | null;
  meta_desc: string | null;
  category: CategorySummary;
  variants: ProductVariantRow[];
  images: ProductImageRow[];
  latest_batch: BatchRow | null;
}

// موجودی یک واریانت در یک شعبه (شکل خروجی)
export interface VariantBranchStock {
  branch_id: number;
  branch_name: string;
  branch_slug: string;
  branch_address: string | null;
  branch_phone: string | null;
  stock: number;
  reserved: number;
  available: number;
}

// ==========================================
// بخش 3: تایپ‌های کمکی برای کوئری‌های تجمیعی
// این‌ها فقط به db.query پاس داده می‌شوند، پس RowDataPacket هستند
// ==========================================

// نتیجه COUNT(*)
export interface CountResult extends RowDataPacket {
  count: number;
}

// نتیجه SUM(...)
export interface TotalResult extends RowDataPacket {
  total: number;
}

// ردیف خام دسته برای کوئری (قابل پاس دادن به db.query)
export interface CategorySummaryRow extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
}

// ردیف خام موجودی شعبه (بدون فیلد available که در حافظه محاسبه می‌شود)
export interface VariantStockRow extends RowDataPacket {
  branch_id: number;
  branch_name: string;
  branch_slug: string;
  branch_address: string | null;
  branch_phone: string | null;
  stock: number;
  reserved: number;
}

// ردیف محصول با اطلاعات دسته (برای کوئری INNER JOIN)
export interface ProductWithCategoryRow extends ProductRow {
  category_name: string;
  category_slug: string;
}