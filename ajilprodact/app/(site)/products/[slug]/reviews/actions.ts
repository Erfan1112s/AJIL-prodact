// app/products/[slug]/reviews/actions.ts
// Server Actions برای ثبت، ویرایش، حذف نظر و رأی مفید

'use server';

import { revalidatePath } from 'next/cache';
import { execute, queryRows, transaction } from '@/lib/db';
import { getCurrentCustomerId } from '@/lib/auth/customer-session';
import { canUserReviewProduct } from '@/lib/queries/reviews';

// ==========================================
// تایپ‌های ورودی
// ==========================================

export type ReviewMediaInput = {
  id?: number;
  media_type: 'IMAGE' | 'VIDEO';
  url: string;
  thumbnail_url: string | null;
};

export interface SubmitReviewInput {
  productId: number;
  productSlug: string;
  rating: number;
  title: string;
  body: string;
  media: ReviewMediaInput[];
}

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; field?: string };

// ==========================================
// اعتبارسنجی URL رسانه
// ==========================================

// فقط URLهای امن را می‌پذیریم
// جلوگیری از javascript:، data:، و هر چیز مشکوک
function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();

  // مسیر نسبی (برای تصاویر آپلود شده در public/)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true;
  }

  // URLهای HTTPS و HTTP
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://')
  ) {
    return true;
  }

  return false;
}

// ==========================================
// اعتبارسنجی ورودی
// ==========================================

function validateReviewInput(
  input: SubmitReviewInput
): string | null {
  // امتیاز
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return 'امتیاز باید بین ۱ تا ۵ ستاره باشد';
  }

  // عنوان (اختیاری)
  if (input.title.length > 100) {
    return 'عنوان نمی‌تواند بیش از ۱۰۰ کاراکتر باشد';
  }

  // متن
  if (input.body.length > 1000) {
    return 'متن نظر نمی‌تواند بیش از ۱۰۰۰ کاراکتر باشد';
  }

  // حداقل یکی از عنوان/متن/رسانه باید وجود داشته باشد
  const hasText = input.body.trim().length > 0 || input.title.trim().length > 0;
  const hasMedia = input.media.length > 0;

  if (!hasText && !hasMedia) {
    return 'حداقل متن نظر یا یک عکس/ویدیو الزامی است';
  }

  // تعداد رسانه‌ها
  const imageCount = input.media.filter((m) => m.media_type === 'IMAGE').length;
  const videoCount = input.media.filter((m) => m.media_type === 'VIDEO').length;

  if (imageCount > 5) {
    return 'حداکثر ۵ عکس مجاز است';
  }

  if (videoCount > 1) {
    return 'حداکثر ۱ ویدیو مجاز است';
  }

  // بررسی URLها
  for (const media of input.media) {
    if (!isSafeUrl(media.url)) {
      return 'یکی از فایل‌های رسانه نامعتبر است';
    }
    if (media.thumbnail_url && !isSafeUrl(media.thumbnail_url)) {
      return 'یکی از تصاویر بندانگشتی نامعتبر است';
    }
  }

  return null;
}

// ==========================================
// Action 1: ثبت یا ویرایش نظر
// ==========================================

export async function submitReviewAction(
  input: SubmitReviewInput
): Promise<ActionResult<{ reviewId: number; isEdit: boolean }>> {
  // ۱. احراز هویت
  const customerId = await getCurrentCustomerId();
  if (!customerId) {
    return {
      ok: false,
      error: 'برای ثبت نظر باید وارد حساب خود شوید',
    };
  }

  // ۲. اعتبارسنجی
  const validationError = validateReviewInput(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  // ۳. بررسی وجود نظر قبلی
  const existingRows = await queryRows<{ id: number; is_approved: number }>(
    `SELECT id, is_approved FROM product_reviews
     WHERE customer_id = ? AND product_id = ?
     LIMIT 1`,
    [customerId, input.productId]
  );
  const existing = existingRows[0];
  const isEdit = Boolean(existing);

  // ۴. اگر نظر جدید است، خرید چک شود
  // برای ویرایش، نیازی نیست چون قبلاً بررسی شده
  let isVerifiedPurchase = existing ? false : false;

  if (!isEdit) {
    const canReview = await canUserReviewProduct(customerId, input.productId);
    if (!canReview) {
      return {
        ok: false,
        error:
          'فقط خریداران این محصول می‌توانند نظر بدهند. پس از تحویل سفارش می‌توانید نظر خود را ثبت کنید.',
      };
    }
    isVerifiedPurchase = true;
  } else {
    // در ویرایش، مقدار قبلی را نگه می‌داریم
    const verifiedRows = await queryRows<{ is_verified_purchase: number }>(
      `SELECT is_verified_purchase FROM product_reviews
       WHERE id = ? LIMIT 1`,
      [existing.id]
    );
    isVerifiedPurchase = verifiedRows[0]?.is_verified_purchase === 1;
  }

  // ۵. ذخیره در تراکنش
  try {
    const reviewId = await transaction(async (conn) => {
      let rid: number;

      if (isEdit && existing) {
        // ویرایش: ریست تایید، حفظ verified
        await conn.query(
          `UPDATE product_reviews SET
             rating = ?, title = ?, body = ?,
             is_verified_purchase = ?,
             is_approved = 0,
             approved_at = NULL
           WHERE id = ?`,
          [
            input.rating,
            input.title.trim() || null,
            input.body.trim() || null,
            isVerifiedPurchase ? 1 : 0,
            existing.id,
          ]
        );
        rid = existing.id;
      } else {
        // ایجاد جدید
        const [result] = await conn.query(
          `INSERT INTO product_reviews
             (product_id, customer_id, rating, title, body,
              is_verified_purchase, is_approved)
           VALUES (?, ?, ?, ?, ?, ?, 0)`,
          [
            input.productId,
            customerId,
            input.rating,
            input.title.trim() || null,
            input.body.trim() || null,
            isVerifiedPurchase ? 1 : 0,
          ]
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rid = (result as any).insertId as number;
      }

      // مدیریت رسانه‌ها
      // در ویرایش: حذف رسانه‌های حذف‌شده
      const keptMediaIds = input.media
        .filter((m) => m.id)
        .map((m) => m.id);

      if (keptMediaIds.length > 0) {
        const placeholders = keptMediaIds.map(() => '?').join(',');
        await conn.query(
          `DELETE FROM review_media
           WHERE review_id = ? AND id NOT IN (${placeholders})`,
          [rid, ...keptMediaIds]
        );
      } else {
        // هیچ رسانه قبلی نگه داشته نشد
        await conn.query(
          `DELETE FROM review_media WHERE review_id = ?`,
          [rid]
        );
      }

      // درج رسانه‌های جدید
      let sortOrder = 0;
      for (const media of input.media) {
        sortOrder += 1;

        if (media.id) {
          // به‌روزرسانی رسانه موجود
          await conn.query(
            `UPDATE review_media SET sort_order = ?
             WHERE id = ? AND review_id = ?`,
            [sortOrder, media.id, rid]
          );
        } else {
          // درج رسانه جدید
          await conn.query(
            `INSERT INTO review_media
               (review_id, media_type, url, thumbnail_url, sort_order)
             VALUES (?, ?, ?, ?, ?)`,
            [
              rid,
              media.media_type,
              media.url.trim(),
              media.thumbnail_url?.trim() || null,
              sortOrder,
            ]
          );
        }
      }

      return rid;
    });

    // ۶. رفرش صفحات مرتبط
    revalidatePath(`/products/${input.productSlug}`);
    revalidatePath(`/products/${input.productSlug}/reviews`);
    revalidatePath('/admin/reviews');
    revalidatePath('/admin');

    return {
      ok: true,
      reviewId,
      isEdit,
    };
  } catch (err) {
    console.error('خطا در ثبت نظر:', err);

    const message = err instanceof Error ? err.message : '';
    if (message.includes('uk_review_customer_product')) {
      return {
        ok: false,
        error: 'شما قبلاً برای این محصول نظر ثبت کرده‌اید',
      };
    }

    return { ok: false, error: 'خطا در ثبت نظر. لطفاً دوباره تلاش کنید.' };
  }
}

// ==========================================
// Action 2: حذف نظر خودم
// ==========================================

export async function deleteMyReviewAction(
  reviewId: number,
  productSlug: string
): Promise<ActionResult> {
  const customerId = await getCurrentCustomerId();
  if (!customerId) {
    return { ok: false, error: 'دسترسی غیرمجاز' };
  }

  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return { ok: false, error: 'شناسه نظر نامعتبر است' };
  }

  // بررسی مالکیت
  const ownerRows = await queryRows<{ customer_id: number }>(
    `SELECT customer_id FROM product_reviews WHERE id = ? LIMIT 1`,
    [reviewId]
  );
  const owner = ownerRows[0];

  if (!owner) {
    return { ok: false, error: 'نظر یافت نشد' };
  }

  if (owner.customer_id !== customerId) {
    return { ok: false, error: 'شما فقط می‌توانید نظر خودتان را حذف کنید' };
  }

  // حذف (media و votes با CASCADE حذف می‌شوند)
  await execute(`DELETE FROM product_reviews WHERE id = ?`, [reviewId]);

  revalidatePath(`/products/${productSlug}`);
  revalidatePath(`/products/${productSlug}/reviews`);
  revalidatePath('/admin/reviews');
  revalidatePath('/admin');

  return { ok: true };
}

// ==========================================
// Action 3: رأی مفید (toggle)
// ==========================================

export type VoteHelpfulResult =
  | { ok: true; hasVoted: boolean; newCount: number }
  | { ok: false; error: string };

export async function voteHelpfulAction(
  reviewId: number,
  productSlug: string
): Promise<VoteHelpfulResult> {
  const customerId = await getCurrentCustomerId();
  if (!customerId) {
    return { ok: false, error: 'برای رأی دادن باید وارد حساب خود شوید' };
  }

  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return { ok: false, error: 'شناسه نظر نامعتبر است' };
  }

  // بررسی وجود نظر و تاییدشده بودن
  const reviewRows = await queryRows<{ is_approved: number; customer_id: number }>(
    `SELECT is_approved, customer_id FROM product_reviews WHERE id = ? LIMIT 1`,
    [reviewId]
  );
  const review = reviewRows[0];

  if (!review) {
    return { ok: false, error: 'نظر یافت نشد' };
  }

  if (review.is_approved !== 1) {
    return { ok: false, error: 'این نظر هنوز تایید نشده است' };
  }

  // نمی‌تواند به نظر خودش رأی بدهد
  if (review.customer_id === customerId) {
    return { ok: false, error: 'نمی‌توانید به نظر خودتان رأی بدهید' };
  }

  // بررسی رأی قبلی
  const existingVote = await queryRows<{ id: number }>(
    `SELECT id FROM review_votes
     WHERE review_id = ? AND customer_id = ?
     LIMIT 1`,
    [reviewId, customerId]
  );

  try {
    const result = await transaction(async (conn) => {
      let hasVoted: boolean;

      if (existingVote.length > 0) {
        // برداشتن رأی
        await conn.query(
          `DELETE FROM review_votes WHERE review_id = ? AND customer_id = ?`,
          [reviewId, customerId]
        );
        await conn.query(
          `UPDATE product_reviews
           SET helpful_count = GREATEST(0, helpful_count - 1)
           WHERE id = ?`,
          [reviewId]
        );
        hasVoted = false;
      } else {
        // اضافه کردن رأی
        await conn.query(
          `INSERT INTO review_votes (review_id, customer_id)
           VALUES (?, ?)`,
          [reviewId, customerId]
        );
        await conn.query(
          `UPDATE product_reviews
           SET helpful_count = helpful_count + 1
           WHERE id = ?`,
          [reviewId]
        );
        hasVoted = true;
      }

      return hasVoted;
    });

    // خواندن تعداد جدید
    const countRows = await queryRows<{ helpful_count: number }>(
      `SELECT helpful_count FROM product_reviews WHERE id = ? LIMIT 1`,
      [reviewId]
    );
    const newCount = Number(countRows[0]?.helpful_count ?? 0);

    revalidatePath(`/products/${productSlug}/reviews`);

    return {
      ok: true,
      hasVoted: result,
      newCount,
    };
  } catch (err) {
    console.error('خطا در ثبت رأی:', err);
    return { ok: false, error: 'خطا در ثبت رأی. لطفاً دوباره تلاش کنید.' };
  }
}