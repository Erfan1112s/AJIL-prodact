// lib/types.ts
// تایپ‌های TypeScript متناظر با جدول‌های دیتابیس

// ==========================================
// بخش 1: تایپ‌های پایه (هر کدام یک ردیف جدول)
// ==========================================

// ردیف جدول categories
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
  packaging_type: string;
  packaging_label: string | null;
  price: number;
  compare_price: number | null;
  sku: string | null;
  image_url: string | null;
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

// وضعیت تازگی
export type FreshnessMode = 'MANUAL' | 'AUTO';

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
  freshness_mode: FreshnessMode;
  freshness_score: number;
  freshness_base_score: number;
  freshness_base_date: Date | null;
  freshness_annual_decay: number;
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

// ردیف جدول product_branch_stock
export interface ProductBranchStockRow {
  id: number;
  branch_id: number;
  product_id: number;
  total_weight_grams: number;
  reserved_weight_grams: number;
  updated_at: Date;
}

// ردیف جدول customers
export interface CustomerRow {
  id: number;
  phone: string;
  national_code: string | null;
  full_name: string | null;
  email: string | null;
  password_hash: string | null;
  otp_code: string | null;
  otp_expires_at: Date | null;
  otp_attempts: number;
  otp_last_sent_at: Date | null;
  otp_verified_at: Date | null;
  default_address: string | null;
  admin_note: string | null;
  order_count: number;
  last_order_at: Date | null;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

// تایپ‌های وضعیت سفارش
export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type DeliveryMethod = 'SHIPPING' | 'PICKUP';
export type ShippingProvider = 'SNAPP' | 'POST' | 'NONE';
export type OrderType = 'ONLINE' | 'IN_STORE';

// ردیف جدول orders
export interface OrderRow {
  id: number;
  order_number: string;
  customer_id: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  subtotal: number;
  shipping_cost: number;
  total_amount: number;
  status: OrderStatus;
  delivery_method: DeliveryMethod;
  shipping_provider: ShippingProvider;
  payment_method: string | null;
  payment_ref: string | null;
  payment_authority: string | null;
  payment_verified_at: Date | null;
  branch_id: number | null;
  tracking_code: string | null;
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
  packaging_type: string;
  packaging_label: string | null;
  price: number;
  quantity: number;
  created_at: Date;
}

// ==========================================
// بخش 2: تایپ‌های نظرات
// ==========================================

export type ReviewMediaType = 'IMAGE' | 'VIDEO';

export interface ProductReviewRow {
  id: number;
  product_id: number;
  customer_id: number;
  rating: number;
  title: string | null;
  body: string | null;
  is_verified_purchase: number;
  is_approved: number;
  approved_at: Date | null;
  admin_reply: string | null;
  admin_reply_at: Date | null;
  helpful_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ReviewMediaRow {
  id: number;
  review_id: number;
  media_type: ReviewMediaType;
  url: string;
  thumbnail_url: string | null;
  sort_order: number;
  created_at: Date;
}

export interface ReviewVoteRow {
  id: number;
  review_id: number;
  customer_id: number;
  created_at: Date;
}

// ==========================================
// بخش 3: تایپ‌های سیستم احراز هویت یکپارچه (فاز 1.1)
// ==========================================

// نوع کاربر
export type UserType = 'CUSTOMER' | 'STAFF';

// نام ثابت نقش‌ها (برای استفاده در کد)
export type RoleName =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'ACCOUNTANT'
  | 'SUPPORT_AGENT'
  | 'CUSTOMER';

// ردیف جدول roles
export interface RoleRow {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  is_system: number;
  created_at: Date;
  updated_at: Date;
}

// ردیف جدول permissions
export interface PermissionRow {
  id: number;
  permission_key: string;
  display_name: string;
  group_name: string;
  description: string | null;
  created_at: Date;
}

// ردیف جدول role_permissions
export interface RolePermissionRow {
  role_id: number;
  permission_id: number;
  created_at: Date;
}

// ردیف جدول users
export interface UserRow {
  id: number;
  phone: string | null;
  username: string | null;
  email: string | null;
  password_hash: string | null;
  full_name: string | null;
  national_code: string | null;
  user_type: UserType;
  role_id: number;
  customer_id: number | null;
  staff_id: number | null;
  is_active: number;
  is_locked: number;
  failed_login_count: number;
  locked_until: Date | null;
  last_login_at: Date | null;
  last_login_ip: string | null;
  created_at: Date;
  updated_at: Date;
}

// ردیف جدول user_sessions
export interface UserSessionRow {
  id: number;
  user_id: number;
  token_hash: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
  last_active_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
}

// کاربر با اطلاعات نقش (نتیجه JOIN)
// این تایپ در تابع getCurrentUser استفاده می‌شود
export interface UserWithRole extends UserRow {
  role: RoleRow;
}

// کاربر با نقش و لیست مجوزها
// این تایپ کامل‌ترین شکل اطلاعات کاربر است
export interface UserWithPermissions extends UserWithRole {
  permissions: string[];
}

// ==========================================
// بخش 4: تایپ‌های ترکیبی
// ==========================================

export interface CategoryWithChildren extends CategoryRow {
  children: CategoryWithChildren[];
}

export interface CategorySummary {
  id: number;
  name: string;
  slug: string;
}

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

export interface VariantBranchStock {
  branch_id: number;
  branch_name: string;
  branch_slug: string;
  branch_address: string | null;
  branch_phone: string | null;
  total_grams: number;
  reserved_grams: number;
  available_grams: number;
  available_units: number;
}

export interface ReviewAuthor {
  id: number;
  full_name: string | null;
  initial: string;
}

export interface ProductReviewWithDetails {
  id: number;
  product_id: number;
  rating: number;
  title: string | null;
  body: string | null;
  is_verified_purchase: boolean;
  admin_reply: string | null;
  admin_reply_at: Date | null;
  helpful_count: number;
  created_at: Date;
  author: ReviewAuthor;
  media: ReviewMediaRow[];
  has_voted: boolean;
}

export interface ProductReviewStats {
  total_count: number;
  average_rating: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  with_media_count: number;
  verified_count: number;
}

export interface AdminReviewListItem {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  customer_id: number;
  customer_name: string | null;
  customer_phone: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  has_admin_reply: boolean;
  media_count: number;
  helpful_count: number;
  created_at: Date;
}