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
// بخش 2: تایپ‌های نظرات (جدید)
// ==========================================

// نوع رسانه در نظرات
export type ReviewMediaType = 'IMAGE' | 'VIDEO';

// ردیف جدول product_reviews
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

// ردیف جدول review_media
export interface ReviewMediaRow {
  id: number;
  review_id: number;
  media_type: ReviewMediaType;
  url: string;
  thumbnail_url: string | null;
  sort_order: number;
  created_at: Date;
}

// ردیف جدول review_votes
export interface ReviewVoteRow {
  id: number;
  review_id: number;
  customer_id: number;
  created_at: Date;
}

// ==========================================
// بخش 3: تایپ‌های ترکیبی
// ==========================================

// دسته‌بندی با فرزندانش
export interface CategoryWithChildren extends CategoryRow {
  children: CategoryWithChildren[];
}

// خلاصه دسته‌بندی
export interface CategorySummary {
  id: number;
  name: string;
  slug: string;
}

// محصول با اطلاعات خلاصه (برای کارت)
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

// محصول کامل (برای صفحه تک محصول)
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
  total_grams: number;
  reserved_grams: number;
  available_grams: number;
  available_units: number;
}

// ==========================================
// بخش 4: تایپ‌های ترکیبی نظرات (جدید)
// ==========================================

// اطلاعات مشتری که نظر داده (برای نمایش در کارت نظر)
export interface ReviewAuthor {
  id: number;
  full_name: string | null;
  // حرف اول نام برای avatar
  initial: string;
}

// نظر کامل با همه اطلاعات برای نمایش در سایت
// شامل: اطلاعات نظر + نویسنده + رسانه‌ها + آیا کاربر فعلی رای داده
export interface ProductReviewWithDetails {
  // اطلاعات نظر
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

  // اطلاعات نویسنده
  author: ReviewAuthor;

  // رسانه‌ها
  media: ReviewMediaRow[];

  // آیا کاربر فعلی به این نظر رای داده؟
  has_voted: boolean;
}

// آمار نظرات یک محصول
export interface ProductReviewStats {
  total_count: number;
  average_rating: number; // 0 اگر هیچ نظری نیست
  // تعداد نظرات به تفکیک امتیاز (index 0 = 1 ستاره، index 4 = 5 ستاره)
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  // تعداد نظرات با عکس یا ویدیو
  with_media_count: number;
  // تعداد نظرات خریداران تاییدشده
  verified_count: number;
}

// نظر در پنل ادمین (با اطلاعات بیشتر)
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