// lib/queries/branches.ts
// توابع خواندن شعبات و موجودی بر اساس وزن

import { queryRows } from '@/lib/db';
import type { BranchRow, VariantBranchStock } from '@/lib/types';

function isMissingTableError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;

  const maybeError = error as {
    code?: string;
    errno?: number;
    sqlMessage?: string;
  };

  return (
    maybeError.code === 'ER_NO_SUCH_TABLE' ||
    maybeError.errno === 1146 ||
    /doesn't exist/i.test(maybeError.sqlMessage ?? '')
  );
}

// ==========================================
// لیست شعبات فعال
// ==========================================

export async function getActiveBranches(): Promise<BranchRow[]> {
  const rows = await queryRows<BranchRow>(
    `SELECT id, name, slug, address, phone, lat, lng,
            is_active, created_at, updated_at
     FROM branches
     WHERE is_active = 1
     ORDER BY name ASC`
  );
  return rows;
}

// ==========================================
// شعبه با slug
// ==========================================

export async function getBranchBySlug(
  slug: string
): Promise<BranchRow | null> {
  const rows = await queryRows<BranchRow>(
    `SELECT id, name, slug, address, phone, lat, lng,
            is_active, created_at, updated_at
     FROM branches
     WHERE slug = ? AND is_active = 1
     LIMIT 1`,
    [slug]
  );
  return rows[0] ?? null;
}

// ==========================================
// موجودی یک واریانت در همه شعبات
// ==========================================

export async function getVariantAvailability(
  variantId: number
): Promise<VariantBranchStock[]> {
  try {
    const rows = await queryRows<{
      branch_id: number;
      branch_name: string;
      branch_slug: string;
      branch_address: string | null;
      branch_phone: string | null;
      total_grams: number;
      reserved_grams: number;
      weight_gram: number;
    }>(
      `SELECT
         b.id AS branch_id,
         b.name AS branch_name,
         b.slug AS branch_slug,
         b.address AS branch_address,
         b.phone AS branch_phone,
         COALESCE(pbs.total_weight_grams, 0) AS total_grams,
         COALESCE(pbs.reserved_weight_grams, 0) AS reserved_grams,
         pv.weight_gram
       FROM branches b
       INNER JOIN product_variants pv ON pv.id = ?
       LEFT JOIN product_branch_stock pbs
         ON pbs.branch_id = b.id AND pbs.product_id = pv.product_id
       WHERE b.is_active = 1
       ORDER BY b.name ASC`,
      [variantId]
    );

    return rows.map((row) => {
      const availableGrams = Math.max(
        0,
        Number(row.total_grams) - Number(row.reserved_grams)
      );
      const availableUnits = Math.floor(
        availableGrams / Number(row.weight_gram)
      );

      return {
        branch_id: row.branch_id,
        branch_name: row.branch_name,
        branch_slug: row.branch_slug,
        branch_address: row.branch_address,
        branch_phone: row.branch_phone,
        total_grams: Number(row.total_grams),
        reserved_grams: Number(row.reserved_grams),
        available_grams: availableGrams,
        available_units: availableUnits,
        stock: availableGrams,
        reserved: Number(row.reserved_grams),
        available: availableUnits,
      };
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      console.warn(
        '[stock] product_branch_stock table is missing; returning empty availability.'
      );
      return [];
    }
    throw error;
  }
}

// ==========================================
// موجودی کل یک واریانت (مجموع شعبات)
// ==========================================

export async function getTotalStockForVariant(
  variantId: number
): Promise<number> {
  try {
    const rows = await queryRows<{
      total_grams: number;
      weight_gram: number;
    }>(
      `SELECT
         COALESCE(SUM(pbs.total_weight_grams - pbs.reserved_weight_grams), 0) AS total_grams,
         pv.weight_gram
       FROM product_variants pv
       INNER JOIN branches b ON b.is_active = 1
       LEFT JOIN product_branch_stock pbs
         ON pbs.product_id = pv.product_id AND pbs.branch_id = b.id
       WHERE pv.id = ?
       GROUP BY pv.weight_gram`,
      [variantId]
    );

    const row = rows[0];
    if (!row) return 0;
    return Math.max(
      0,
      Math.floor(Number(row.total_grams) / Number(row.weight_gram))
    );
  } catch (error) {
    if (isMissingTableError(error)) {
      return 0;
    }
    throw error;
  }
}