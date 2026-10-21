// lib/queries/reviews.ts
// توابع خواندن نظرات کاربران

import { queryRows } from '@/lib/db';
import type {
  ProductReviewRow,
  ProductReviewWithDetails,
  ProductReviewStats,
  ReviewMediaRow,
  ReviewAuthor,
  AdminReviewListItem,
  ReviewMediaType,
} from '@/lib/types';
import type { ReviewMediaRow as MediaRow } from '@/lib/types';


// ==========================================
// تایپ‌های داخلی (شکل خام کوئری)
// ==========================================

// ردیف خام نظرات از کوئری با JOIN
// این تایپ فقط داخلی استفاده می‌شود
interface ReviewWithAuthorRaw {
  id: number;
  product_id: number;
  customer_id: number;
  rating: number;
  title: string | null;
  body: string | null;
  is_verified_purchase: number;
  admin_reply: string | null;
  admin_reply_at: Date | null;
  helpful_count: number;
  created_at: Date;
  author_full_name: string | null;
  has_voted: number;
}

// ==========================================
// تابع کمکی: ساخت ReviewAuthor از نام
// ==========================================

function makeAuthor(id: number, fullName: string | null): ReviewAuthor {
  // نام خالی = "کاربر ناشناس"
  const displayName = fullName && fullName.trim() ? fullName.trim() : null;

  // حرف اول برای avatar
  // اگر نام خالی بود، '؟' می‌گذاریم
  const initial = displayName ? displayName.charAt(0) : '؟';

  return {
    id,
    full_name: displayName,
    initial,
  };
}

// ==========================================
// تابع 1: لیست نظرات تاییدشده یک محصول
// برای نمایش در سایت
// ==========================================

export interface GetProductReviewsOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'newest' | 'highest' | 'lowest' | 'helpful';
  ratingFilter?: 1 | 2 | 3 | 4 | 5;
  withMediaOnly?: boolean;
  verifiedOnly?: boolean;
  // برای تشخیص has_voted
  currentCustomerId?: number | null;
}

export async function getProductReviews(
  productId: number,
  options: GetProductReviewsOptions = {}
): Promise<ProductReviewWithDetails[]> {
  const {
    limit = 10,
    offset = 0,
    sortBy = 'newest',
    ratingFilter,
    withMediaOnly = false,
    verifiedOnly = false,
    currentCustomerId = null,
  } = options;

  // شرط‌های پایه: فقط تاییدشده‌ها
  const conditions: string[] = [
    'pr.product_id = ?',
    'pr.is_approved = 1',
  ];

  // پارامترها به ترتیب ظاهر شدن در کوئری
  // اولین ? = customer_id برای LEFT JOIN
  // دومین ? = product_id
  const params: unknown[] = [currentCustomerId ?? 0, productId];

  // فیلتر امتیاز
  if (ratingFilter !== undefined) {
    conditions.push('pr.rating = ?');
    params.push(ratingFilter);
  }

  // فیلتر دارای رسانه
  if (withMediaOnly) {
    conditions.push(
      'EXISTS (SELECT 1 FROM review_media rm WHERE rm.review_id = pr.id)'
    );
  }

  // فیلتر خریداران تاییدشده
  if (verifiedOnly) {
    conditions.push('pr.is_verified_purchase = 1');
  }

  // مرتب‌سازی
  const orderByMap: Record<string, string> = {
    newest: 'pr.created_at DESC',
    highest: 'pr.rating DESC, pr.created_at DESC',
    lowest: 'pr.rating ASC, pr.created_at DESC',
    helpful: 'pr.helpful_count DESC, pr.created_at DESC',
  };
  const orderBy = orderByMap[sortBy] ?? orderByMap.newest;

  // پاک‌سازی limit و offset
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 50);
  const safeOffset = Math.max(0, Math.floor(offset));

  const whereClause = conditions.join(' AND ');

  // کوئری 1: نظرات با نویسنده و has_voted
  const rawReviews = await queryRows<ReviewWithAuthorRaw>(
    `SELECT
       pr.id,
       pr.product_id,
       pr.customer_id,
       pr.rating,
       pr.title,
       pr.body,
       pr.is_verified_purchase,
       pr.admin_reply,
       pr.admin_reply_at,
       pr.helpful_count,
       pr.created_at,
       c.full_name AS author_full_name,
       CASE WHEN rv.id IS NOT NULL THEN 1 ELSE 0 END AS has_voted
     FROM product_reviews pr
     INNER JOIN customers c ON c.id = pr.customer_id
     LEFT JOIN review_votes rv
       ON rv.review_id = pr.id AND rv.customer_id = ?
     WHERE ${whereClause}
     ORDER BY ${orderBy}
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  // اگر نظری نبود، آرایه خالی برگردان
  if (rawReviews.length === 0) return [];

  // کوئری 2: رسانه‌های همه این نظرات
  const reviewIds = rawReviews.map((r) => r.id);
  const placeholders = reviewIds.map(() => '?').join(',');

  const mediaRows = await queryRows<ReviewMediaRow>(
    `SELECT id, review_id, media_type, url, thumbnail_url, sort_order, created_at
     FROM review_media
     WHERE review_id IN (${placeholders})
     ORDER BY review_id ASC, sort_order ASC`,
    reviewIds
  );

  // گروه‌بندی رسانه‌ها بر اساس review_id
  const mediaByReview = new Map<number, ReviewMediaRow[]>();
  for (const media of mediaRows) {
    const list = mediaByReview.get(media.review_id) ?? [];
    list.push(media);
    mediaByReview.set(media.review_id, list);
  }

  // ترکیب همه در ProductReviewWithDetails
  return rawReviews.map((row) => ({
    id: row.id,
    product_id: row.product_id,
    rating: Number(row.rating),
    title: row.title,
    body: row.body,
    is_verified_purchase: row.is_verified_purchase === 1,
    admin_reply: row.admin_reply,
    admin_reply_at: row.admin_reply_at,
    helpful_count: Number(row.helpful_count),
    created_at: row.created_at,
    author: makeAuthor(row.customer_id, row.author_full_name),
    media: mediaByReview.get(row.id) ?? [],
    has_voted: row.has_voted === 1,
  }));
}

// ==========================================
// تابع 2: آمار نظرات یک محصول
// برای بخش خلاصه در صفحه محصول
// ==========================================

export async function getProductReviewStats(
  productId: number
): Promise<ProductReviewStats> {
  // یک کوئری با conditional aggregation
  const rows = await queryRows<{
    total_count: number;
    average_rating: number;
    r1: number;
    r2: number;
    r3: number;
    r4: number;
    r5: number;
    verified_count: number;
    with_media_count: number;
  }>(
    `SELECT
       COUNT(*) AS total_count,
       COALESCE(AVG(pr.rating), 0) AS average_rating,
       SUM(CASE WHEN pr.rating = 1 THEN 1 ELSE 0 END) AS r1,
       SUM(CASE WHEN pr.rating = 2 THEN 1 ELSE 0 END) AS r2,
       SUM(CASE WHEN pr.rating = 3 THEN 1 ELSE 0 END) AS r3,
       SUM(CASE WHEN pr.rating = 4 THEN 1 ELSE 0 END) AS r4,
       SUM(CASE WHEN pr.rating = 5 THEN 1 ELSE 0 END) AS r5,
       SUM(CASE WHEN pr.is_verified_purchase = 1 THEN 1 ELSE 0 END) AS verified_count,
       SUM(CASE WHEN EXISTS (
         SELECT 1 FROM review_media rm WHERE rm.review_id = pr.id
       ) THEN 1 ELSE 0 END) AS with_media_count
     FROM product_reviews pr
     WHERE pr.product_id = ? AND pr.is_approved = 1`,
    [productId]
  );

  const row = rows[0];

  // اگر نظری نبود، همه صفر
  if (!row || Number(row.total_count) === 0) {
    return {
      total_count: 0,
      average_rating: 0,
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      with_media_count: 0,
      verified_count: 0,
    };
  }

  // گرد کردن میانگین به 1 رقم اعشار
  // مثلاً 4.2534 → 4.3
  const avg = Math.round(Number(row.average_rating) * 10) / 10;

  return {
    total_count: Number(row.total_count),
    average_rating: avg,
    rating_distribution: {
      1: Number(row.r1),
      2: Number(row.r2),
      3: Number(row.r3),
      4: Number(row.r4),
      5: Number(row.r5),
    },
    with_media_count: Number(row.with_media_count),
    verified_count: Number(row.verified_count),
  };
}

// ==========================================
// تابع 3: نظر کاربر فعلی برای یک محصول
// برای ویرایش نظر قبلی
// ==========================================

export async function getUserReviewForProduct(
  customerId: number,
  productId: number
): Promise<ProductReviewRow | null> {
  const rows = await queryRows<ProductReviewRow>(
    `SELECT
       id, product_id, customer_id, rating, title, body,
       is_verified_purchase, is_approved, approved_at,
       admin_reply, admin_reply_at, helpful_count,
       created_at, updated_at
     FROM product_reviews
     WHERE customer_id = ? AND product_id = ?
     LIMIT 1`,
    [customerId, productId]
  );
  return rows[0] ?? null;
}

// ==========================================
// تابع 4: بررسی امکان نظر دادن
// کاربر باید این محصول را با وضعیت DELIVERED خریده باشد
// ==========================================

export async function canUserReviewProduct(
  customerId: number,
  productId: number
): Promise<boolean> {
  const rows = await queryRows<{ found: number }>(
    `SELECT 1 AS found
     FROM orders o
     INNER JOIN order_items oi ON oi.order_id = o.id
     WHERE o.customer_id = ?
       AND oi.product_id = ?
       AND o.status = 'DELIVERED'
     LIMIT 1`,
    [customerId, productId]
  );
  return rows.length > 0;
}

// ==========================================
// تابع 5: لیست نظرات برای پنل ادمین
// همه وضعیت‌ها، با فیلتر
// ==========================================

export interface GetAdminReviewsOptions {
  search?: string;
  status?: 'all' | 'approved' | 'pending';
  productId?: number;
  ratingFilter?: 1 | 2 | 3 | 4 | 5;
  limit?: number;
  offset?: number;
}

export async function getAdminReviews(
  options: GetAdminReviewsOptions = {}
): Promise<AdminReviewListItem[]> {
  const {
    search,
    status = 'all',
    productId,
    ratingFilter,
    limit = 20,
    offset = 0,
  } = options;

  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];

  // جست‌وجو در نام مشتری یا موبایل یا عنوان نظر
  if (search && search.trim()) {
    conditions.push(
      '(c.full_name LIKE ? OR c.phone LIKE ? OR pr.title LIKE ?)'
    );
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  // فیلتر وضعیت
  if (status === 'approved') {
    conditions.push('pr.is_approved = 1');
  } else if (status === 'pending') {
    conditions.push('pr.is_approved = 0');
  }

  // فیلتر محصول
  if (productId) {
    conditions.push('pr.product_id = ?');
    params.push(productId);
  }

  // فیلتر امتیاز
  if (ratingFilter !== undefined) {
    conditions.push('pr.rating = ?');
    params.push(ratingFilter);
  }

  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 100);
  const safeOffset = Math.max(0, Math.floor(offset));
  const whereClause = conditions.join(' AND ');

  const rows = await queryRows<{
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
    is_verified_purchase: number;
    is_approved: number;
    admin_reply: string | null;
    helpful_count: number;
    created_at: Date;
    media_count: number;
  }>(
    `SELECT
       pr.id,
       pr.product_id,
       p.name AS product_name,
       p.slug AS product_slug,
       pr.customer_id,
       c.full_name AS customer_name,
       c.phone AS customer_phone,
       pr.rating,
       pr.title,
       pr.body,
       pr.is_verified_purchase,
       pr.is_approved,
       pr.admin_reply,
       pr.helpful_count,
       pr.created_at,
       (SELECT COUNT(*) FROM review_media rm WHERE rm.review_id = pr.id) AS media_count
     FROM product_reviews pr
     INNER JOIN products p ON p.id = pr.product_id
     INNER JOIN customers c ON c.id = pr.customer_id
     WHERE ${whereClause}
     ORDER BY pr.created_at DESC, pr.id DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  return rows.map((r) => ({
    id: r.id,
    product_id: r.product_id,
    product_name: r.product_name,
    product_slug: r.product_slug,
    customer_id: r.customer_id,
    customer_name: r.customer_name,
    customer_phone: r.customer_phone,
    rating: Number(r.rating),
    title: r.title,
    body: r.body,
    is_verified_purchase: r.is_verified_purchase === 1,
    is_approved: r.is_approved === 1,
    has_admin_reply: Boolean(r.admin_reply),
    media_count: Number(r.media_count),
    helpful_count: Number(r.helpful_count),
    created_at: r.created_at,
  }));
}

// ==========================================
// تابع 6: تعداد نظرات ادمین (برای صفحه‌بندی)
// ==========================================

export async function getAdminReviewsCount(
  options: GetAdminReviewsOptions = {}
): Promise<number> {
  const { search, status = 'all', productId, ratingFilter } = options;

  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];

  if (search && search.trim()) {
    conditions.push(
      '(c.full_name LIKE ? OR c.phone LIKE ? OR pr.title LIKE ?)'
    );
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  if (status === 'approved') {
    conditions.push('pr.is_approved = 1');
  } else if (status === 'pending') {
    conditions.push('pr.is_approved = 0');
  }

  if (productId) {
    conditions.push('pr.product_id = ?');
    params.push(productId);
  }

  if (ratingFilter !== undefined) {
    conditions.push('pr.rating = ?');
    params.push(ratingFilter);
  }

  const whereClause = conditions.join(' AND ');

  const rows = await queryRows<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM product_reviews pr
     INNER JOIN customers c ON c.id = pr.customer_id
     WHERE ${whereClause}`,
    params
  );
  return Number(rows[0]?.count ?? 0);
}

// ==========================================
// تابع 7: نظرات یک محصول برای صفحه اختصاصی
// (/products/[slug]/reviews)
// این تابع نسخه کامل‌تر getProductReviews است
// با پشتیبانی از همه فیلترها و صفحه‌بندی
// ==========================================

export interface GetProductReviewsFullOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'newest' | 'highest' | 'lowest' | 'helpful';
  ratingFilter?: 1 | 2 | 3 | 4 | 5;
  withMediaOnly?: boolean;
  verifiedOnly?: boolean;
  currentCustomerId?: number | null;
}

// این تابع در واقع wrapper است
// به‌خاطر سازگاری با API سایت
export async function getProductReviewsFull(
  productId: number,
  options: GetProductReviewsFullOptions = {}
): Promise<ProductReviewWithDetails[]> {
  return getProductReviews(productId, options);
}

// ==========================================
// تابع 8: تعداد کل نظرات تاییدشده یک محصول
// برای صفحه‌بندی
// ==========================================

export async function getProductReviewsCount(
  productId: number,
  options: {
    ratingFilter?: 1 | 2 | 3 | 4 | 5;
    withMediaOnly?: boolean;
    verifiedOnly?: boolean;
  } = {}
): Promise<number> {
  const { ratingFilter, withMediaOnly = false, verifiedOnly = false } = options;

  const conditions: string[] = [
    'pr.product_id = ?',
    'pr.is_approved = 1',
  ];
  const params: unknown[] = [productId];

  if (ratingFilter !== undefined) {
    conditions.push('pr.rating = ?');
    params.push(ratingFilter);
  }

  if (withMediaOnly) {
    conditions.push(
      'EXISTS (SELECT 1 FROM review_media rm WHERE rm.review_id = pr.id)'
    );
  }

  if (verifiedOnly) {
    conditions.push('pr.is_verified_purchase = 1');
  }

  const whereClause = conditions.join(' AND ');

  const rows = await queryRows<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM product_reviews pr
     WHERE ${whereClause}`,
    params
  );
  return Number(rows[0]?.count ?? 0);
}

// ==========================================
// تابع 9: آیا کاربر فعلی به یک نظر خاص رأی داده؟
// برای بررسی سریع در صفحه تک نظر (اگر لازم شد)
// ==========================================

export async function hasUserVotedReview(
  reviewId: number,
  customerId: number
): Promise<boolean> {
  const rows = await queryRows<{ found: number }>(
    `SELECT 1 AS found FROM review_votes
     WHERE review_id = ? AND customer_id = ?
     LIMIT 1`,
    [reviewId, customerId]
  );
  return rows.length > 0;
}

// ==========================================
// تابع 10: نظر کاربر فعلی با رسانه‌ها (برای ویرایش)
// ==========================================


export interface UserReviewWithMedia {
  id: number;
  rating: number;
  title: string | null;
  body: string | null;
  is_approved: boolean;
  media: ReviewMediaRow[];
}

export async function getUserReviewWithMedia(
  customerId: number,
  productId: number
): Promise<UserReviewWithMedia | null> {
  const rows = await queryRows<{
    id: number;
    rating: number;
    title: string | null;
    body: string | null;
    is_approved: number;
  }>(
    `SELECT id, rating, title, body, is_approved
     FROM product_reviews
     WHERE customer_id = ? AND product_id = ?
     LIMIT 1`,
    [customerId, productId]
  );

  const review = rows[0];
  if (!review) return null;

  // گرفتن رسانه‌ها
  const mediaRows = await queryRows<MediaRow>(
    `SELECT id, review_id, media_type, url, thumbnail_url, sort_order, created_at
     FROM review_media
     WHERE review_id = ?
     ORDER BY sort_order ASC`,
    [review.id]
  );

  return {
    id: review.id,
    rating: Number(review.rating),
    title: review.title,
    body: review.body,
    is_approved: review.is_approved === 1,
    media: mediaRows,
  };
}