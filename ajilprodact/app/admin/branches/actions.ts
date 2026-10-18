'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUserId } from '@/lib/auth/session';
import { execute, queryRows, transaction, isMissingTableError } from '@/lib/db';

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false, error: string };

export async function toggleBranchActiveAction(
  branchId: number,
  isActive: boolean
): Promise<ActionResult> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };

  await execute(
    `UPDATE branches SET is_active = ? WHERE id = ?`,
    [isActive ? 1 : 0, branchId]
  );

  revalidatePath('/admin/branches');
  revalidatePath('/products');
  revalidatePath('/admin');

  return { ok: true };
}

export async function deleteBranchAction(
  branchId: number
): Promise<ActionResult> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };

  const rows = await queryRows<{ total: number }>(
    `SELECT COUNT(*) AS total FROM orders WHERE branch_id = ? LIMIT 1`,
    [branchId]
  );

  if (Number(rows[0]?.total ?? 0) > 0) {
    return {
      ok: false,
      error: 'این شعبه در سفارش‌های ثبت‌شده استفاده شده است. به‌جای حذف، آن را غیرفعال کنید.',
    };
  }

  try {
    await execute(`DELETE FROM branches WHERE id = ?`, [branchId]);
    revalidatePath('/admin/branches');
    revalidatePath('/products');
    revalidatePath('/admin');
    return { ok: true };
  } catch {
    return { ok: false, error: 'خطا در حذف شعبه' };
  }
}

// ==========================================
// به‌روزرسانی موجودی یک محصول (بر اساس وزن)
// ==========================================

function missingStockTableActionResult(): ActionResult {
  return {
    ok: false,
    error: 'جدول موجودی شعبه هنوز ایجاد نشده است. ابتدا migration مربوط به stock را اجرا کنید.',
  };
}

export async function updateProductStockAction(
  branchId: number,
  productId: number,
  newTotalWeight: number
): Promise<ActionResult> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };

  if (!Number.isInteger(newTotalWeight) || newTotalWeight < 0) {
    return { ok: false, error: 'وزن باید عدد صحیح مثبت باشد' };
  }

  if (newTotalWeight > 999_999_999) {
    return { ok: false, error: 'وزن بیش از حد بزرگ است' };
  }

  try {
    const existing = await queryRows<{ id: number; reserved_weight_grams: number }>(
      `SELECT id, reserved_weight_grams FROM product_branch_stock
       WHERE branch_id = ? AND product_id = ? LIMIT 1`,
      [branchId, productId]
    );

    if (existing.length > 0) {
      const reserved = Number(existing[0].reserved_weight_grams);
      if (newTotalWeight < reserved) {
        return {
          ok: false,
          error: `وزن نمی‌تواند کمتر از وزن رزروشده (${reserved} گرم) باشد`,
        };
      }

      await execute(
        `UPDATE product_branch_stock SET total_weight_grams = ?
         WHERE branch_id = ? AND product_id = ?`,
        [newTotalWeight, branchId, productId]
      );
    } else {
      await execute(
        `INSERT INTO product_branch_stock
           (branch_id, product_id, total_weight_grams, reserved_weight_grams)
         VALUES (?, ?, ?, 0)`,
        [branchId, productId, newTotalWeight]
      );
    }

    revalidatePath(`/admin/branches/${branchId}/inventory`);
    revalidatePath('/products');
    revalidatePath('/admin');

    return { ok: true };
  } catch (error) {
    if (isMissingTableError(error)) {
      return missingStockTableActionResult();
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'خطا در به‌روزرسانی موجودی',
    };
  }
}

// ==========================================
// به‌روزرسانی گروهی موجودی (بر اساس وزن)
// ==========================================

export interface BulkStockItem {
  productId: number;
  totalWeightGrams: number;
}

export async function bulkUpdateProductStockAction(
  branchId: number,
  items: BulkStockItem[]
): Promise<ActionResult<{ updated: number }>> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };

  if (items.length === 0) {
    return { ok: false, error: 'هیچ موردی برای به‌روزرسانی ارسال نشد' };
  }

  for (const item of items) {
    if (!Number.isInteger(item.totalWeightGrams) || item.totalWeightGrams < 0) {
      return {
        ok: false,
        error: 'همه وزن‌ها باید عدد صحیح مثبت باشند',
      };
    }
  }

  try {
    await transaction(async (conn) => {
      for (const item of items) {
        const [reservedRows] = await conn.query(
          `SELECT reserved_weight_grams FROM product_branch_stock
           WHERE branch_id = ? AND product_id = ? LIMIT 1`,
          [branchId, item.productId]
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const row = (reservedRows as any[])[0];
        const reserved = row ? Number(row.reserved_weight_grams) : 0;

        if (item.totalWeightGrams < reserved) {
          throw new Error(
            `وزن نمی‌تواند کمتر از وزن رزروشده (${reserved} گرم) باشد`
          );
        }

        if (row) {
          await conn.query(
            `UPDATE product_branch_stock SET total_weight_grams = ?
             WHERE branch_id = ? AND product_id = ?`,
            [item.totalWeightGrams, branchId, item.productId]
          );
        } else {
          await conn.query(
            `INSERT INTO product_branch_stock
               (branch_id, product_id, total_weight_grams, reserved_weight_grams)
             VALUES (?, ?, ?, 0)`,
            [branchId, item.productId, item.totalWeightGrams]
          );
        }
      }
    });

    revalidatePath(`/admin/branches/${branchId}/inventory`);
    revalidatePath('/products');
    revalidatePath('/admin');

    return { ok: true, updated: items.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    return {
      ok: false,
      error: message || 'خطا در به‌روزرسانی گروهی',
    };
  }
}

// ==========================================
// انتقال موجودی بین شعبات (بر اساس وزن)
// ==========================================

export async function transferProductStockAction(
  fromBranchId: number,
  toBranchId: number,
  productId: number,
  weightGrams: number
): Promise<ActionResult> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };

  if (fromBranchId === toBranchId) {
    return { ok: false, error: 'شعبه مبدأ و مقصد باید متفاوت باشند' };
  }

  if (!Number.isInteger(weightGrams) || weightGrams <= 0) {
    return { ok: false, error: 'وزن انتقال باید عدد صحیح مثبت باشد' };
  }

  try {
    await transaction(async (conn) => {
      const [sourceRows] = await conn.query(
        `SELECT total_weight_grams, reserved_weight_grams
         FROM product_branch_stock
         WHERE branch_id = ? AND product_id = ? LIMIT 1`,
        [fromBranchId, productId]
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const source = (sourceRows as any[])[0];

      if (!source) {
        throw new Error('این محصول در شعبه مبدأ موجودی ندارد');
      }

      const sourceAvailable =
        Number(source.total_weight_grams) - Number(source.reserved_weight_grams);

      if (weightGrams > sourceAvailable) {
        throw new Error(
          `موجودی قابل انتقال در شعبه مبدأ ${sourceAvailable} گرم است`
        );
      }

      // کاهش از مبدأ
      await conn.query(
        `UPDATE product_branch_stock
         SET total_weight_grams = total_weight_grams - ?
         WHERE branch_id = ? AND product_id = ?`,
        [weightGrams, fromBranchId, productId]
      );

      // افزایش به مقصد
      const [destRows] = await conn.query(
        `SELECT id FROM product_branch_stock
         WHERE branch_id = ? AND product_id = ? LIMIT 1`,
        [toBranchId, productId]
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dest = (destRows as any[])[0];

      if (dest) {
        await conn.query(
          `UPDATE product_branch_stock
           SET total_weight_grams = total_weight_grams + ?
           WHERE branch_id = ? AND product_id = ?`,
          [weightGrams, toBranchId, productId]
        );
      } else {
        await conn.query(
          `INSERT INTO product_branch_stock
             (branch_id, product_id, total_weight_grams, reserved_weight_grams)
           VALUES (?, ?, ?, 0)`,
          [toBranchId, productId, weightGrams]
        );
      }
    });

    revalidatePath(`/admin/branches/${fromBranchId}/inventory`);
    revalidatePath(`/admin/branches/${toBranchId}/inventory`);
    revalidatePath('/products');
    revalidatePath('/admin');

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    return {
      ok: false,
      error: message || 'خطا در انتقال موجودی',
    };
  }
}

// ==========================================
// صفر کردن موجودی شعبه
// ==========================================

export async function resetBranchInventoryAction(
  branchId: number
): Promise<ActionResult> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };

  const reservedTotal = await queryRows<{ total: number }>(
    `SELECT COALESCE(SUM(reserved_weight_grams), 0) AS total
     FROM product_branch_stock WHERE branch_id = ?`,
    [branchId]
  );

  if (Number(reservedTotal[0]?.total ?? 0) > 0) {
    return {
      ok: false,
      error:
        'این شعبه رزرو فعال دارد. ابتدا سفارشات در جریان را تکمیل کنید.',
    };
  }

  await execute(
    `UPDATE product_branch_stock SET total_weight_grams = 0 WHERE branch_id = ?`,
    [branchId]
  );

  revalidatePath(`/admin/branches/${branchId}/inventory`);
  revalidatePath('/products');
  revalidatePath('/admin');

  return { ok: true };
}

// ==========================================
// فرم شعبه
// ==========================================

export interface BranchFormInput {
  id?: number;
  name: string;
  slug: string;
  address: string;
  phone: string;
  lat: number | null;
  lng: number | null;
  is_active: boolean;
}

export async function generateBranchSlugAction(
  name: string
): Promise<{ ok: boolean; slug?: string; error?: string }> {
  const base = (name ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .trim();

  if (!base) {
    return { ok: false, error: 'نام شعبه را وارد کنید' };
  }

  const slug = base
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  if (!slug) {
    return { ok: false, error: 'نام شعبه معتبر نیست' };
  }

  const rows = await queryRows<{ id: number }>(
    `SELECT id FROM branches WHERE slug = ? LIMIT 1`,
    [slug]
  );

  if (rows.length > 0) {
    let uniqueSlug = slug;
    let counter = 1;
    while (true) {
      uniqueSlug = `${slug}-${counter}`;
      const exists = await queryRows<{ id: number }>(
        `SELECT id FROM branches WHERE slug = ? LIMIT 1`,
        [uniqueSlug]
      );
      if (exists.length === 0) break;
      counter += 1;
    }
    return { ok: true, slug: uniqueSlug };
  }

  return { ok: true, slug };
}

export async function saveBranchAction(
  input: BranchFormInput
): Promise<
  | { ok: true }
  | { ok: false; error: string; field?: string }
> {
  const adminId = await getCurrentUserId();
  if (!adminId) return { ok: false, error: 'دسترسی غیرمجاز' };

  const name = input.name.trim();
  const slug = input.slug.trim();
  const address = input.address.trim();
  const phone = input.phone.trim();

  if (!name) {
    return { ok: false, error: 'نام شعبه را وارد کنید', field: 'name' };
  }

  if (!slug) {
    return { ok: false, error: 'اسلاگ را وارد کنید', field: 'slug' };
  }

  if (slug.length < 2) {
    return { ok: false, error: 'اسلاگ باید حداقل 2 کاراکتر داشته باشد', field: 'slug' };
  }

  const normalizedSlug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!normalizedSlug) {
    return { ok: false, error: 'اسلاگ نامعتبر است', field: 'slug' };
  }

  const duplicate = await queryRows<{ id: number }>(
    `SELECT id FROM branches WHERE slug = ? AND id != ? LIMIT 1`,
    [normalizedSlug, input.id ?? 0]
  );

  if (duplicate.length > 0) {
    return { ok: false, error: 'این اسلاگ قبلاً استفاده شده است', field: 'slug' };
  }

  const values = [
    name,
    normalizedSlug,
    address,
    phone,
    input.lat,
    input.lng,
    input.is_active ? 1 : 0,
  ];

  if (input.id) {
    await execute(
      `UPDATE branches
       SET name = ?, slug = ?, address = ?, phone = ?, lat = ?, lng = ?, is_active = ?, updated_at = NOW()
       WHERE id = ?`,
      [...values, input.id]
    );
  } else {
    await execute(
      `INSERT INTO branches (name, slug, address, phone, lat, lng, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      values
    );
  }

  revalidatePath('/admin/branches');
  revalidatePath('/admin');
  revalidatePath('/products');

  return { ok: true };
}