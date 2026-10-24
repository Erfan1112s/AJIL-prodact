// app/admin/reviews/actions.ts
// Server Actions مدیریت نظرات

'use server';

import { revalidatePath } from 'next/cache';
import { execute, queryRows } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth/session';

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

// ==========================================
// تایید نظر
// ==========================================

export async function approveReviewAction(
  reviewId: number
): Promise<ActionResult> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };

  await execute(
    `UPDATE product_reviews
     SET is_approved = 1, approved_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [reviewId]
  );

  revalidatePath('/admin/reviews');
  revalidatePath('/admin');
  revalidatePath('/products');

  return { ok: true };
}

// ==========================================
// لغو تایید نظر
// ==========================================

export async function unapproveReviewAction(
  reviewId: number
): Promise<ActionResult> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };

  await execute(
    `UPDATE product_reviews
     SET is_approved = 0, approved_at = NULL
     WHERE id = ?`,
    [reviewId]
  );

  revalidatePath('/admin/reviews');
  revalidatePath('/admin');
  revalidatePath('/products');

  return { ok: true };
}

// ==========================================
// حذف نظر
// ==========================================

export async function deleteReviewAction(
  reviewId: number
): Promise<ActionResult> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };

  await execute(`DELETE FROM product_reviews WHERE id = ?`, [reviewId]);

  revalidatePath('/admin/reviews');
  revalidatePath('/admin');
  revalidatePath('/products');

  return { ok: true };
}

// ==========================================
// پاسخ ادمین به نظر
// ==========================================

export async function replyToReviewAction(
  reviewId: number,
  reply: string
): Promise<ActionResult> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };

  const trimmed = reply.trim();

  if (trimmed.length === 0) {
    // حذف پاسخ
    await execute(
      `UPDATE product_reviews
       SET admin_reply = NULL, admin_reply_at = NULL
       WHERE id = ?`,
      [reviewId]
    );
  } else {
    if (trimmed.length > 1000) {
      return { ok: false, error: 'پاسخ نمی‌تواند بیش از ۱۰۰۰ کاراکتر باشد' };
    }

    await execute(
      `UPDATE product_reviews
       SET admin_reply = ?, admin_reply_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [trimmed, reviewId]
    );
  }

  revalidatePath('/admin/reviews');
  revalidatePath('/products');

  return { ok: true };
}

// ==========================================
// خواندن پاسخ فعلی (برای مودال)
// ==========================================

export async function getReviewReplyAction(
  reviewId: number
): Promise<
  | { ok: true; reply: string | null; reviewTitle: string | null }
  | { ok: false; error: string }
> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };

  const rows = await queryRows<{
    admin_reply: string | null;
    title: string | null;
  }>(
    `SELECT admin_reply, title FROM product_reviews WHERE id = ? LIMIT 1`,
    [reviewId]
  );

  const row = rows[0];
  if (!row) return { ok: false, error: 'نظر یافت نشد' };

  return {
    ok: true,
    reply: row.admin_reply,
    reviewTitle: row.title,
  };
}