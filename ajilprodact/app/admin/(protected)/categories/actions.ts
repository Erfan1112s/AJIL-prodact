// app/admin/categories/actions.ts
// Server Actions مدیریت دسته‌بندی‌ها

'use server';

import { revalidatePath } from 'next/cache';
import { execute, queryRows } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth/session';

// ==========================================
// تایپ‌ها
// ==========================================

export interface CategoryFormInput {
  id?: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  parent_id: number | null;
  sort_order: number;
  is_active: boolean;
}

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; field?: string };

// ==========================================
// اعتبارسنجی
// ==========================================

function validate(input: CategoryFormInput): string | null {
  if (!input.name || input.name.trim().length < 2) {
    return 'نام دسته باید حداقل 2 کاراکتر باشد';
  }
  if (input.name.trim().length > 100) {
    return 'نام دسته نمی‌تواند بیش از 100 کاراکتر باشد';
  }
  if (!input.slug || !/^[a-z0-9-]+$/.test(input.slug)) {
    return 'اسلاگ باید فقط شامل حروف کوچک، اعداد و خط تیره باشد';
  }
  if (input.slug.length > 120) {
    return 'اسلاگ نمی‌تواند بیش از 120 کاراکتر باشد';
  }
  return null;
}

// ==========================================
// ساخت slug از نام
// ==========================================

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ==========================================
// ذخیره دسته (ایجاد یا ویرایش)
// ==========================================

export async function saveCategoryAction(
  input: CategoryFormInput
): Promise<ActionResult<{ categoryId: number }>> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };

  // اعتبارسنجی
  const validationError = validate(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  // چک یکتا بودن slug
  const slugParams: unknown[] = [input.slug];
  let slugSql = `SELECT id FROM categories WHERE slug = ?`;
  if (input.id) {
    slugSql += ` AND id != ?`;
    slugParams.push(input.id);
  }
  slugSql += ` LIMIT 1`;

  const slugExists = await queryRows<{ id: number }>(slugSql, slugParams);
  if (slugExists.length > 0) {
    return {
      ok: false,
      error: 'این اسلاگ قبلاً استفاده شده است',
      field: 'slug',
    };
  }

  // اگر parent انتخاب شده، چک کن خودش نباشد
  if (input.id && input.parent_id === input.id) {
    return {
      ok: false,
      error: 'یک دسته نمی‌تواند والد خودش باشد',
      field: 'parent_id',
    };
  }

  // چک حلقه: آیا parent انتخاب‌شده فرزند این دسته است؟
  if (input.id && input.parent_id) {
    const isDescendant = await checkIsDescendant(
      input.parent_id,
      input.id
    );
    if (isDescendant) {
      return {
        ok: false,
        error: 'نمی‌توانید یک زیردسته را به عنوان والد انتخاب کنید',
        field: 'parent_id',
      };
    }
  }

  try {
    let categoryId: number;

    if (input.id) {
      // ویرایش
      await execute(
        `UPDATE categories SET
           name = ?, slug = ?, description = ?, image_url = ?,
           parent_id = ?, sort_order = ?, is_active = ?
         WHERE id = ?`,
        [
          input.name.trim(),
          input.slug.trim(),
          input.description.trim() || null,
          input.image_url.trim() || null,
          input.parent_id,
          input.sort_order,
          input.is_active ? 1 : 0,
          input.id,
        ]
      );
      categoryId = input.id;
    } else {
      // ایجاد
      const result = await queryRows<{ id: number }>(
        `SELECT 1 AS id` // placeholder برای گرفتن insertId
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [insertResult] = (await import('@/lib/db')).db
        ? []
        : [];
      // استفاده از execute برای insert
      const { db: dbConn } = await import('@/lib/db');
      const [rawResult] = await dbConn.query(
        `INSERT INTO categories
           (name, slug, description, image_url, parent_id, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          input.name.trim(),
          input.slug.trim(),
          input.description.trim() || null,
          input.image_url.trim() || null,
          input.parent_id,
          input.sort_order,
          input.is_active ? 1 : 0,
        ]
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      categoryId = (rawResult as any).insertId as number;
      void result;
      void insertResult;
    }

    revalidatePath('/admin/categories');
    revalidatePath('/categories');
    revalidatePath('/products');

    return { ok: true, categoryId };
  } catch (err) {
    console.error('خطا در ذخیره دسته:', err);
    return { ok: false, error: 'خطا در ذخیره دسته‌بندی' };
  }
}

// ==========================================
// بررسی اینکه آیا categoryId فرزند ancestorId است
// ==========================================

async function checkIsDescendant(
  categoryId: number,
  ancestorId: number
): Promise<boolean> {
  const rows = await queryRows<{ id: number; parent_id: number | null }>(
    `SELECT id, parent_id FROM categories`
  );

  let current = categoryId;
  const visited = new Set<number>();
  let guard = 0;

  while (current && guard < 100) {
    guard++;
    if (visited.has(current)) break;
    visited.add(current);

    if (current === ancestorId) return true;

    const node = rows.find((r) => r.id === current);
    if (!node || node.parent_id === null) break;
    current = node.parent_id;
  }

  return false;
}

// ==========================================
// حذف دسته
// ==========================================

export async function deleteCategoryAction(
  categoryId: number
): Promise<ActionResult> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };

  // چک: آیا محصولی در این دسته هست؟
  const productsCount = await queryRows<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM products WHERE category_id = ?`,
    [categoryId]
  );
  if (Number(productsCount[0]?.cnt ?? 0) > 0) {
    return {
      ok: false,
      error: `این دسته ${productsCount[0].cnt} محصول دارد. ابتدا محصولات را به دسته دیگری منتقل کنید.`,
    };
  }

  // چک: آیا فرزندی دارد؟
  const childrenCount = await queryRows<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM categories WHERE parent_id = ?`,
    [categoryId]
  );
  if (Number(childrenCount[0]?.cnt ?? 0) > 0) {
    return {
      ok: false,
      error: `این دسته ${childrenCount[0].cnt} زیردسته دارد. ابتدا زیردسته‌ها را حذف یا منتقل کنید.`,
    };
  }

  try {
    await execute(`DELETE FROM categories WHERE id = ?`, [categoryId]);
    revalidatePath('/admin/categories');
    revalidatePath('/categories');
    revalidatePath('/products');
    return { ok: true };
  } catch {
    return { ok: false, error: 'خطا در حذف دسته‌بندی' };
  }
}

// ==========================================
// تغییر وضعیت فعال
// ==========================================

export async function toggleCategoryActiveAction(
  categoryId: number,
  isActive: boolean
): Promise<ActionResult> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };

  await execute(`UPDATE categories SET is_active = ? WHERE id = ?`, [
    isActive ? 1 : 0,
    categoryId,
  ]);

  revalidatePath('/admin/categories');
  revalidatePath('/categories');

  return { ok: true };
}

// ==========================================
// تولید slug خودکار
// ==========================================

export async function generateCategorySlugAction(
  name: string
): Promise<{ slug: string }> {
  return { slug: toSlug(name) };
}

// ==========================================
// تغییر ترتیب
// ==========================================

export async function updateCategorySortAction(
  categoryId: number,
  sortOrder: number
): Promise<ActionResult> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };

  await execute(`UPDATE categories SET sort_order = ? WHERE id = ?`, [
    sortOrder,
    categoryId,
  ]);

  revalidatePath('/admin/categories');
  revalidatePath('/categories');

  return { ok: true };
}