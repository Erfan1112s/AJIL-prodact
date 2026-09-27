// lib/types.ts
// تایپ‌های TypeScript متناظر با جدول‌های دیتابیس
// نام‌گذاری: هر تایپ به Row ختم می‌شود اگر مستقیماً یک ردیف جدول باشد

// ==========================================
// بخش 1: تایپ‌های پایه (هر کدام یک ردیف جدول)
// ==========================================

// ردیف جدول categories
// TINYINT(1) در mysql2 به صورت number برمی‌گردد: 0 یا 1
export interface CategoryRow {
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

// ردیف جدول products
// DECIMAL با تنظیم decimalNumbers به number تبدیل می‌شود
export interface ProductRow {
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

// ردیف جدول product_variants
export interface ProductVariantRow {
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

// ردیف جدول product_images
export interface ProductImageRow {
  id: number;
  product_id: number;
  url: string;
  alt: string | null;
  sort_order: number;
  is_primary: number;
  created_at: Date;
}

// ردیف جدول batches
export interface BatchRow {
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

// ردیف جدول branches
export interface BranchRow {
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

// ردیف جدول branch_inventory
export interface BranchInventoryRow {
  id: number;
  branch_id: number;
  variant_id: number;
  stock: number;
  reserved: number;
  updated_at: Date;
}

// ردیف جدول customers
// توجه: admin_note در queries به کلاینت عمومی نمی‌رود
export interface CustomerRow {
  id: number;
  phone: string;
  full_name: string | null;
  email: string | null;
  default_address: string | null;
  admin_note: string | null;
  order_count: number;
  last_order_at: Date | null;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

// ردیف جدول orders
export interface OrderRow {
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

// ردیف جدول order_items
export interface OrderItemRow {
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
// بخش 2: تایپ‌های ترکیبی (برای خروجی کوئری‌های پیچیده)
// ==========================================

// دسته‌بندی با فرزندانش (برای منوی درختی)
export interface CategoryWithChildren extends CategoryRow {
  children: CategoryWithChildren[];
}

// خلاصه دسته‌بندی (فقط فیلدهای لازم برای نمایش در کارت محصول)
export interface CategorySummary {
  id: number;
  name: string;
  slug: string;
}

// محصول با اطلاعات خلاصه
// این تایپ برای کارت محصول در لیست استفاده می‌شود
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

// محصول کامل با همه جزئیات
// برای صفحه تک محصول استفاده می‌شود
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

// موجودی یک واریانت در یک شعبه
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