// app/admin/products/actions.ts
// Server Actions مدیریت محصولات

'use server';

import { revalidatePath } from 'next/cache';
import { execute, transaction, queryRows } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth/session';

// ==========================================
// تایپ‌های ورودی
// ==========================================

export interface VariantInput {
  id?: number;
  weight_gram: number;
  price: number;
  compare_price: number | null;
  sku: string | null;
  image_url: string | null;
  is_active: boolean;
}

export interface ImageInput {
  id?: number;
  url: string;
  alt: string;
  is_primary: boolean;
  sort_order: number;
}

export interface BatchInput {
  id?: number;
  batch_code: string;
  supplier_name: string;
  harvest_date: string;
  roast_date: string;
  pack_date: string;
  expiry_date: string;
  freshness_mode: 'MANUAL' | 'AUTO';
  freshness_score: number;
  freshness_base_score: number;
  freshness_base_date: string;
  freshness_annual_decay: number;
  qc_note: string;
}

export interface ProductFormInput {
  id?: number;
  name: string;
  slug: string;
  short_desc: string;
  description: string;
  category_id: number;
  is_active: boolean;
  is_featured: boolean;
  meta_title: string;
  meta_desc: string;
  variants: VariantInput[];
  images: ImageInput[];
  batch: BatchInput;
}

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; field?: string };

// ==========================================
// اعتبارسنجی
// ==========================================

function validate(input: ProductFormInput): string | null {
  if (!input.name || input.name.trim().length < 2) {
    return 'نام محصول باید حداقل 2 کاراکتر باشد';
  }
  if (!input.slug || !/^[a-z0-9-]+$/.test(input.slug)) {
    return 'اسلاگ باید فقط شامل حروف کوچک، اعداد و خط تیره باشد';
  }
  if (!input.category_id) {
    return 'دسته‌بندی را انتخاب کنید';
  }
  if (input.variants.length === 0) {
    return 'حداقل یک وزن (واریانت) اضافه کنید';
  }
  for (const v of input.variants) {
    if (!v.weight_gram || v.weight_gram <= 0) {
      return 'وزن هر واریانت باید عددی مثبت باشد';
    }
    if (!v.price || v.price <= 0) {
      return 'قیمت هر واریانت باید عددی مثبت باشد';
    }
    if (v.compare_price !== null && v.compare_price <= v.price) {
      return 'قیمت قبل از تخفیف باید بیشتر از قیمت فعلی باشد';
    }
  }
  if (input.batch.batch_code.trim()) {
    if (!/^[A-Za-z0-9-]+$/.test(input.batch.batch_code.trim())) {
      return 'کد بچ باید فقط شامل حروف، اعداد و خط تیره باشد';
    }
    if (
      input.batch.freshness_mode === 'MANUAL' &&
      (input.batch.freshness_score < 0 || input.batch.freshness_score > 100)
    ) {
      return 'امتیاز تازگی باید بین 0 تا 100 باشد';
    }
    if (
      input.batch.freshness_annual_decay < 0 ||
      input.batch.freshness_annual_decay > 100
    ) {
      return 'درصد کاهش سالانه باید بین 0 تا 100 باشد';
    }
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
// نرمال‌سازی تاریخ (تبدیل رشته خالی به null)
// ==========================================

function normalizeDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  return trimmed.length === 0 ? null : trimmed;
}

// ==========================================
// ایجاد یا به‌روزرسانی محصول
// ==========================================

export async function saveProductAction(
  input: ProductFormInput
): Promise<ActionResult<{ productId: number }>> {
  // چک احراز هویت
  const adminId = await getCurrentUserId();
  if (!adminId) {
    return { ok: false, error: 'دسترسی غیرمجاز' };
  }

  // اعتبارسنجی
  const validationError = validate(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  // چک یکتا بودن slug
  const slugCheckParams: unknown[] = [input.slug];
  let slugSql = `SELECT id FROM products WHERE slug = ?`;
  if (input.id) {
    slugSql += ` AND id != ?`;
    slugCheckParams.push(input.id);
  }
  slugSql += ` LIMIT 1`;

  const slugExists = await queryRows<{ id: number }>(slugSql, slugCheckParams);
  if (slugExists.length > 0) {
    return {
      ok: false,
      error: 'این اسلاگ قبلاً استفاده شده است',
      field: 'slug',
    };
  }

  // چک یکتا بودن batch_code (اگر batch داده شده)
  const batchCode = input.batch.batch_code.trim();
  if (batchCode) {
    const batchCheckParams: unknown[] = [batchCode];
    let batchSql = `SELECT id FROM batches WHERE batch_code = ?`;
    if (input.batch.id) {
      batchSql += ` AND id != ?`;
      batchCheckParams.push(input.batch.id);
    }
    batchSql += ` LIMIT 1`;

    const batchExists = await queryRows<{ id: number }>(
      batchSql,
      batchCheckParams
    );
    if (batchExists.length > 0) {
      return {
        ok: false,
        error: 'این کد بچ قبلاً استفاده شده است',
        field: 'batch_code',
      };
    }
  }

  try {
    const productId = await transaction(async (conn) => {
      let pid: number;

      // ==========================================
      // 1. ذخیره محصول
      // ==========================================
      if (input.id) {
        await conn.query(
          `UPDATE products SET
             name = ?, slug = ?, short_desc = ?, description = ?,
             category_id = ?, is_active = ?, is_featured = ?,
             meta_title = ?, meta_desc = ?
           WHERE id = ?`,
          [
            input.name.trim(),
            input.slug.trim(),
            input.short_desc.trim() || null,
            input.description.trim() || null,
            input.category_id,
            input.is_active ? 1 : 0,
            input.is_featured ? 1 : 0,
            input.meta_title.trim() || null,
            input.meta_desc.trim() || null,
            input.id,
          ]
        );
        pid = input.id;
      } else {
        const [result] = await conn.query(
          `INSERT INTO products
             (name, slug, short_desc, description, category_id,
              is_active, is_featured, meta_title, meta_desc)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            input.name.trim(),
            input.slug.trim(),
            input.short_desc.trim() || null,
            input.description.trim() || null,
            input.category_id,
            input.is_active ? 1 : 0,
            input.is_featured ? 1 : 0,
            input.meta_title.trim() || null,
            input.meta_desc.trim() || null,
          ]
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pid = (result as any).insertId as number;
      }

      // ==========================================
      // 2. حذف واریانت‌های قدیمی
      // ==========================================
      const inputVariantIds = input.variants
        .filter((v) => v.id)
        .map((v) => v.id);

      if (inputVariantIds.length > 0) {
        const placeholders = inputVariantIds.map(() => '?').join(',');
        await conn.query(
          `DELETE FROM product_variants
           WHERE product_id = ? AND id NOT IN (${placeholders})`,
          [pid, ...inputVariantIds]
        );
      } else {
        await conn.query(
          `DELETE FROM product_variants WHERE product_id = ?`,
          [pid]
        );
      }

      // ==========================================
      // 3. حذف تصاویر قدیمی
      // ==========================================
      const inputImageIds = input.images
        .filter((img) => img.id)
        .map((img) => img.id);

      if (inputImageIds.length > 0) {
        const placeholders = inputImageIds.map(() => '?').join(',');
        await conn.query(
          `DELETE FROM product_images
           WHERE product_id = ? AND id NOT IN (${placeholders})`,
          [pid, ...inputImageIds]
        );
      } else {
        await conn.query(
          `DELETE FROM product_images WHERE product_id = ?`,
          [pid]
        );
      }

      // ==========================================
      // 4. درج یا به‌روزرسانی واریانت‌ها
      // ==========================================
      for (const v of input.variants) {
        if (v.id) {
          await conn.query(
            `UPDATE product_variants SET
               weight_gram = ?, price = ?, compare_price = ?,
               sku = ?, image_url = ?, is_active = ?
             WHERE id = ? AND product_id = ?`,
            [
              v.weight_gram,
              v.price,
              v.compare_price,
              v.sku?.trim() || null,
              v.image_url || null,
              v.is_active ? 1 : 0,
              v.id,
              pid,
            ]
          );
        } else {
          await conn.query(
            `INSERT INTO product_variants
               (product_id, weight_gram, price, compare_price,
                sku, image_url, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              pid,
              v.weight_gram,
              v.price,
              v.compare_price,
              v.sku?.trim() || null,
              v.image_url || null,
              v.is_active ? 1 : 0,
            ]
          );
        }
      }

      // ==========================================
      // 5. درج یا به‌روزرسانی تصاویر
      // ==========================================
      for (const img of input.images) {
        if (!img.url.trim()) continue;

        if (img.id) {
          await conn.query(
            `UPDATE product_images SET
               url = ?, alt = ?, is_primary = ?, sort_order = ?
             WHERE id = ? AND product_id = ?`,
            [
              img.url.trim(),
              img.alt.trim() || null,
              img.is_primary ? 1 : 0,
              img.sort_order,
              img.id,
              pid,
            ]
          );
        } else {
          await conn.query(
            `INSERT INTO product_images
               (product_id, url, alt, is_primary, sort_order)
             VALUES (?, ?, ?, ?, ?)`,
            [
              pid,
              img.url.trim(),
              img.alt.trim() || null,
              img.is_primary ? 1 : 0,
              img.sort_order,
            ]
          );
        }
      }

      // ==========================================
      // 6. ذخیره Batch (تازگی)
      // ==========================================
      if (batchCode) {
        const batch = input.batch;

        // بررسی وجود batch فعلی
        const existingBatch =
          batch.id !== undefined
            ? await conn.query(
                `SELECT id FROM batches WHERE id = ? AND product_id = ? LIMIT 1`,
                [batch.id, pid]
              )
            : null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hasExisting =
          existingBatch &&
          Array.isArray((existingBatch as any)[0]) &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((existingBatch as any)[0] as unknown[]).length > 0;

        if (hasExisting && batch.id) {
          await conn.query(
            `UPDATE batches SET
               batch_code = ?, supplier_name = ?,
               harvest_date = ?, roast_date = ?, pack_date = ?, expiry_date = ?,
               freshness_mode = ?, freshness_score = ?,
               freshness_base_score = ?, freshness_base_date = ?,
               freshness_annual_decay = ?, qc_note = ?
             WHERE id = ? AND product_id = ?`,
            [
              batchCode,
              batch.supplier_name.trim() || null,
              normalizeDate(batch.harvest_date),
              normalizeDate(batch.roast_date),
              normalizeDate(batch.pack_date),
              normalizeDate(batch.expiry_date),
              batch.freshness_mode,
              batch.freshness_score,
              batch.freshness_base_score,
              normalizeDate(batch.freshness_base_date) ??
                normalizeDate(batch.pack_date),
              batch.freshness_annual_decay,
              batch.qc_note.trim() || null,
              batch.id,
              pid,
            ]
          );
        } else {
          await conn.query(
            `INSERT INTO batches
               (product_id, batch_code, supplier_name,
                harvest_date, roast_date, pack_date, expiry_date,
                freshness_mode, freshness_score,
                freshness_base_score, freshness_base_date,
                freshness_annual_decay, qc_note)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              pid,
              batchCode,
              batch.supplier_name.trim() || null,
              normalizeDate(batch.harvest_date),
              normalizeDate(batch.roast_date),
              normalizeDate(batch.pack_date),
              normalizeDate(batch.expiry_date),
              batch.freshness_mode,
              batch.freshness_score,
              batch.freshness_base_score,
              normalizeDate(batch.freshness_base_date) ??
                normalizeDate(batch.pack_date),
              batch.freshness_annual_decay,
              batch.qc_note.trim() || null,
            ]
          );
        }
      }

      return pid;
    });

    revalidatePath('/admin/products');
    revalidatePath('/products');
    revalidatePath(`/products/${input.slug}`);

    return { ok: true, productId };
  } catch (err) {
    console.error('خطا در ذخیره محصول:', err);

    const message = err instanceof Error ? err.message : '';

    if (message.includes('uk_variants_sku')) {
      return {
        ok: false,
        error: 'کد SKU یکی از واریانت‌ها تکراری است',
      };
    }
    if (message.includes('uk_variants_product_weight')) {
      return {
        ok: false,
        error: 'دو واریانت با وزن یکسان نمی‌توانند وجود داشته باشند',
      };
    }
    if (message.includes('uk_batches_code')) {
      return {
        ok: false,
        error: 'کد بچ تکراری است',
        field: 'batch_code',
      };
    }
    if (message === 'کد بچ تکراری است') {
      return {
        ok: false,
        error: message,
        field: 'batch_code',
      };
    }

    return { ok: false, error: 'خطا در ذخیره محصول' };
  }
}

// ==========================================
// تغییر وضعیت فعال محصول
// ==========================================

export async function toggleProductActiveAction(
  productId: number,
  isActive: boolean
): Promise<ActionResult> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };

  await execute(`UPDATE products SET is_active = ? WHERE id = ?`, [
    isActive ? 1 : 0,
    productId,
  ]);

  revalidatePath('/admin/products');
  revalidatePath('/products');

  return { ok: true };
}

// ==========================================
// حذف کامل محصول
// ==========================================

export async function deleteProductAction(
  productId: number
): Promise<ActionResult> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };

  // چک: آیا این محصول در سفارشی استفاده شده؟
  const usedInOrders = await queryRows<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM order_items WHERE product_id = ? LIMIT 1`,
    [productId]
  );

  if (Number(usedInOrders[0]?.cnt ?? 0) > 0) {
    return {
      ok: false,
      error:
        'این محصول در سفارشات ثبت شده است. به‌جای حذف، آن را غیرفعال کنید.',
    };
  }

  try {
    await execute(`DELETE FROM products WHERE id = ?`, [productId]);
    revalidatePath('/admin/products');
    revalidatePath('/products');
    return { ok: true };
  } catch {
    return { ok: false, error: 'خطا در حذف محصول' };
  }
}

// ==========================================
// تولید slug خودکار
// ==========================================

export async function generateSlugAction(
  name: string
): Promise<{ slug: string }> {
  return { slug: toSlug(name) };
}

// ==========================================
// تغییر سریع قیمت واریانت
// ==========================================

export async function updateVariantPriceAction(
  variantId: number,
  newPrice: number,
  newComparePrice: number | null
): Promise<ActionResult> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };

  if (!Number.isInteger(newPrice) || newPrice <= 0) {
    return { ok: false, error: 'قیمت باید عددی مثبت باشد' };
  }

  if (newPrice > 999_999_999_999) {
    return { ok: false, error: 'قیمت بیش از حد بزرگ است' };
  }

  if (
    newComparePrice !== null &&
    (!Number.isInteger(newComparePrice) || newComparePrice <= newPrice)
  ) {
    return {
      ok: false,
      error: 'قیمت قبل از تخفیف باید بیشتر از قیمت فعلی باشد',
    };
  }

  await execute(
    `UPDATE product_variants
     SET price = ?, compare_price = ?
     WHERE id = ?`,
    [newPrice, newComparePrice, variantId]
  );

  revalidatePath('/admin/products');
  revalidatePath('/products');

  return { ok: true };
}

// ==========================================
// تغییر سریع امتیاز تازگی
// ==========================================

export async function updateBatchFreshnessAction(
  batchId: number,
  freshnessScore: number,
  mode: 'MANUAL' | 'AUTO'
): Promise<ActionResult> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };

  if (
    mode === 'MANUAL' &&
    (!Number.isInteger(freshnessScore) ||
      freshnessScore < 0 ||
      freshnessScore > 100)
  ) {
    return { ok: false, error: 'امتیاز تازگی باید بین 0 تا 100 باشد' };
  }

  await execute(
    `UPDATE batches
     SET freshness_score = ?, freshness_mode = ?
     WHERE id = ?`,
    [freshnessScore, mode, batchId]
  );

  revalidatePath('/admin/products');
  revalidatePath('/products');

  return { ok: true };
}