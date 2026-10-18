// lib/queries/branches-admin.ts
// کوئری‌های ادمین بر اساس مدل وزن‌محور

import { queryRows } from '@/lib/db';
import type { BranchRow } from '@/lib/types';

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
// خلاصه آمار
// ==========================================

export interface BranchesSummary {
  totalBranches: number;
  activeBranches: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export async function getBranchesSummary(): Promise<BranchesSummary> {
  try {
    const rows = await queryRows<{
      total: number;
      active: number;
      total_products: number;
      low_stock: number;
      out_of_stock: number;
    }>(
      `SELECT
         (SELECT COUNT(*) FROM branches) AS total,
         (SELECT COUNT(*) FROM branches WHERE is_active = 1) AS active,
         (SELECT COUNT(*) FROM products WHERE is_active = 1) AS total_products,
         (SELECT COUNT(*) FROM (
            SELECT p.id
            FROM products p
            LEFT JOIN product_branch_stock pbs
              ON pbs.product_id = p.id
            WHERE p.is_active = 1
            GROUP BY p.id
            HAVING COALESCE(SUM(pbs.total_weight_grams - pbs.reserved_weight_grams), 0) > 0
               AND COALESCE(SUM(pbs.total_weight_grams - pbs.reserved_weight_grams), 0) < 5000
          ) AS low) AS low_stock,
         (SELECT COUNT(*) FROM (
            SELECT p.id
            FROM products p
            LEFT JOIN product_branch_stock pbs
              ON pbs.product_id = p.id
            WHERE p.is_active = 1
            GROUP BY p.id
            HAVING COALESCE(SUM(pbs.total_weight_grams - pbs.reserved_weight_grams), 0) <= 0
          ) AS out_of_stock) AS out_of_stock`
    );

    const r = rows[0];
    return {
      totalBranches: Number(r?.total ?? 0),
      activeBranches: Number(r?.active ?? 0),
      totalProducts: Number(r?.total_products ?? 0),
      lowStockCount: Number(r?.low_stock ?? 0),
      outOfStockCount: Number(r?.out_of_stock ?? 0),
    };
  } catch (error) {
    if (isMissingTableError(error)) {
      const totalProducts = await queryRows<{ count: number }>(
        `SELECT COUNT(*) AS count FROM products WHERE is_active = 1`
      );
      const totalBranches = await queryRows<{ count: number }>(
        `SELECT COUNT(*) AS count FROM branches`
      );
      const activeBranches = await queryRows<{ count: number }>(
        `SELECT COUNT(*) AS count FROM branches WHERE is_active = 1`
      );

      const totalProductCount = Number(totalProducts[0]?.count ?? 0);

      console.warn(
        '[admin-branches] product_branch_stock table is missing; using product-only fallback summary.'
      );
      return {
        totalBranches: Number(totalBranches[0]?.count ?? 0),
        activeBranches: Number(activeBranches[0]?.count ?? 0),
        totalProducts: totalProductCount,
        lowStockCount: 0,
        outOfStockCount: totalProductCount,
      };
    }
    throw error;
  }
}

// ==========================================
// لیست شعبات با آمار وزنی
// ==========================================

export interface AdminBranchItem extends BranchRow {
  products_count: number;
  products_with_stock: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_weight_kg: number;
}

export async function getAdminBranches(): Promise<AdminBranchItem[]> {
  try {
    const rows = await queryRows<AdminBranchItem>(
      `SELECT
         b.id, b.name, b.slug, b.address, b.phone, b.lat, b.lng,
         b.is_active, b.created_at, b.updated_at,
         (SELECT COUNT(*) FROM product_branch_stock pbs
          WHERE pbs.branch_id = b.id) AS products_count,
         (SELECT COUNT(*) FROM product_branch_stock pbs
          WHERE pbs.branch_id = b.id
            AND (pbs.total_weight_grams - pbs.reserved_weight_grams) > 0) AS products_with_stock,
         (SELECT COUNT(*) FROM product_branch_stock pbs
          WHERE pbs.branch_id = b.id
            AND (pbs.total_weight_grams - pbs.reserved_weight_grams) > 0
            AND (pbs.total_weight_grams - pbs.reserved_weight_grams) < 5000) AS low_stock_count,
         (SELECT COUNT(*) FROM product_branch_stock pbs
          WHERE pbs.branch_id = b.id
            AND (pbs.total_weight_grams - pbs.reserved_weight_grams) <= 0) AS out_of_stock_count,
         (SELECT FLOOR(COALESCE(SUM(pbs.total_weight_grams - pbs.reserved_weight_grams), 0) / 1000)
          FROM product_branch_stock pbs
          WHERE pbs.branch_id = b.id) AS total_weight_kg
       FROM branches b
       ORDER BY b.is_active DESC, b.name ASC`
    );

    return rows.map((r) => ({
      ...r,
      products_count: Number(r.products_count),
      products_with_stock: Number(r.products_with_stock),
      low_stock_count: Number(r.low_stock_count),
      out_of_stock_count: Number(r.out_of_stock_count),
      total_weight_kg: Number(r.total_weight_kg),
    }));
  } catch (error) {
    if (isMissingTableError(error)) {
      const rows = await queryRows<BranchRow>(
        `SELECT id, name, slug, address, phone, lat, lng, is_active, created_at, updated_at
         FROM branches ORDER BY is_active DESC, name ASC`
      );

      console.warn('[admin-branches] product_branch_stock table is missing; returning zero stock list fallback.');
      return rows.map((branch) => ({
        ...branch,
        products_count: 0,
        products_with_stock: 0,
        low_stock_count: 0,
        out_of_stock_count: 0,
        total_weight_kg: 0,
      }));
    }
    throw error;
  }
}

// ==========================================
// یک شعبه
// ==========================================

export async function getAdminBranchById(
  id: number
): Promise<BranchRow | null> {
  const rows = await queryRows<BranchRow>(
    `SELECT id, name, slug, address, phone, lat, lng,
            is_active, created_at, updated_at
     FROM branches WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

// ==========================================
// موجودی یک شعبه (بر اساس محصول)
// ==========================================

export interface BranchProductStock {
  product_id: number;
  product_name: string;
  product_slug: string;
  category_name: string;
  total_weight_grams: number;
  reserved_weight_grams: number;
  available_weight_grams: number;
  image_url: string | null;
  // تعداد واریانت‌های این محصول (برای اطلاعات)
  variants_count: number;
}

export interface GetBranchInventoryOptions {
  branchId: number;
  search?: string;
  onlyLowStock?: boolean;
  categoryId?: number;
  limit?: number;
  offset?: number;
}

export async function getBranchProducts(
  options: GetBranchInventoryOptions
): Promise<BranchProductStock[]> {
  try {
    const {
      branchId,
      search,
      onlyLowStock = false,
      categoryId,
      limit = 30,
      offset = 0,
    } = options;

    const conditions: string[] = ['p.is_active = 1'];
    const params: unknown[] = [branchId];

    if (search && search.trim()) {
      conditions.push('p.name LIKE ?');
      params.push(`%${search.trim()}%`);
    }

    if (categoryId) {
      conditions.push('p.category_id = ?');
      params.push(categoryId);
    }

    if (onlyLowStock) {
      conditions.push(
        'COALESCE(pbs.total_weight_grams - pbs.reserved_weight_grams, 0) < 5000'
      );
    }

    const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 100);
    const safeOffset = Math.max(0, Math.floor(offset));
    const whereClause = conditions.join(' AND ');

    const rows = await queryRows<{
      product_id: number;
      product_name: string;
      product_slug: string;
      category_name: string;
      total_weight_grams: number;
      reserved_weight_grams: number;
      image_url: string | null;
      variants_count: number;
    }>(
      `SELECT
         p.id AS product_id,
         p.name AS product_name,
         p.slug AS product_slug,
         c.name AS category_name,
         COALESCE(pbs.total_weight_grams, 0) AS total_weight_grams,
         COALESCE(pbs.reserved_weight_grams, 0) AS reserved_weight_grams,
         (SELECT url FROM product_images
          WHERE product_id = p.id
          ORDER BY is_primary DESC, sort_order ASC
          LIMIT 1) AS image_url,
         (SELECT COUNT(*) FROM product_variants pv
          WHERE pv.product_id = p.id AND pv.is_active = 1) AS variants_count
       FROM products p
       INNER JOIN categories c ON c.id = p.category_id
       LEFT JOIN product_branch_stock pbs
         ON pbs.branch_id = ? AND pbs.product_id = p.id
       WHERE ${whereClause}
       ORDER BY p.name ASC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      params
    );

    return rows.map((r) => ({
      product_id: Number(r.product_id),
      product_name: r.product_name,
      product_slug: r.product_slug,
      category_name: r.category_name,
      total_weight_grams: Number(r.total_weight_grams),
      reserved_weight_grams: Number(r.reserved_weight_grams),
      available_weight_grams: Math.max(
        0,
        Number(r.total_weight_grams) - Number(r.reserved_weight_grams)
      ),
      image_url: r.image_url,
      variants_count: Number(r.variants_count),
    }));
  } catch (error) {
    if (isMissingTableError(error)) {
      const {
        search,
        onlyLowStock = false,
        categoryId,
        limit = 30,
        offset = 0,
      } = options;

      const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 100);
      const safeOffset = Math.max(0, Math.floor(offset));
      const conditions: string[] = ['p.is_active = 1'];
      const params: unknown[] = [];

      if (search && search.trim()) {
        conditions.push('p.name LIKE ?');
        params.push(`%${search.trim()}%`);
      }
      if (categoryId) {
        conditions.push('p.category_id = ?');
        params.push(categoryId);
      }
      if (onlyLowStock) {
        conditions.push('0 < 5000');
      }

      const whereClause = conditions.join(' AND ');
      const rows = await queryRows<{
        product_id: number;
        product_name: string;
        product_slug: string;
        category_name: string;
        image_url: string | null;
        variants_count: number;
      }>(
        `SELECT
           p.id AS product_id,
           p.name AS product_name,
           p.slug AS product_slug,
           c.name AS category_name,
           (SELECT url FROM product_images
            WHERE product_id = p.id
            ORDER BY is_primary DESC, sort_order ASC
            LIMIT 1) AS image_url,
           (SELECT COUNT(*) FROM product_variants pv
            WHERE pv.product_id = p.id AND pv.is_active = 1) AS variants_count
         FROM products p
         INNER JOIN categories c ON c.id = p.category_id
         WHERE ${whereClause}
         ORDER BY p.name ASC
         LIMIT ${safeLimit} OFFSET ${safeOffset}`,
        params
      );

      return rows.map((r) => ({
        product_id: Number(r.product_id),
        product_name: r.product_name,
        product_slug: r.product_slug,
        category_name: r.category_name,
        total_weight_grams: 0,
        reserved_weight_grams: 0,
        available_weight_grams: 0,
        image_url: r.image_url,
        variants_count: Number(r.variants_count),
      }));
    }
    throw error;
  }
}

export async function getBranchProductsCount(
  options: GetBranchInventoryOptions
): Promise<number> {
  try {
    const { branchId, search, onlyLowStock = false, categoryId } = options;

    const conditions: string[] = ['p.is_active = 1'];
    const params: unknown[] = [branchId];

    if (search && search.trim()) {
      conditions.push('p.name LIKE ?');
      params.push(`%${search.trim()}%`);
    }
    if (categoryId) {
      conditions.push('p.category_id = ?');
      params.push(categoryId);
    }
    if (onlyLowStock) {
      conditions.push(
        'COALESCE(pbs.total_weight_grams - pbs.reserved_weight_grams, 0) < 5000'
      );
    }

    const whereClause = conditions.join(' AND ');

    const rows = await queryRows<{ count: number }>(
      `SELECT COUNT(*) AS count
       FROM products p
       LEFT JOIN product_branch_stock pbs
         ON pbs.branch_id = ? AND pbs.product_id = p.id
       WHERE ${whereClause}`,
      params
    );
    return Number(rows[0]?.count ?? 0);
  } catch (error) {
    if (isMissingTableError(error)) {
      const { search, onlyLowStock = false, categoryId } = options;
      const conditions: string[] = ['p.is_active = 1'];
      const params: unknown[] = [];

      if (search && search.trim()) {
        conditions.push('p.name LIKE ?');
        params.push(`%${search.trim()}%`);
      }
      if (categoryId) {
        conditions.push('p.category_id = ?');
        params.push(categoryId);
      }
      if (onlyLowStock) {
        conditions.push('1 = 1');
      }

      const whereClause = conditions.join(' AND ');
      const rows = await queryRows<{ count: number }>(
        `SELECT COUNT(*) AS count
         FROM products p
         WHERE ${whereClause}`,
        params
      );

      return Number(rows[0]?.count ?? 0);
    }
    throw error;
  }
}

// ==========================================
// آمار یک شعبه (برای InventoryTable)
// ==========================================

export interface BranchInventoryStats {
  totalProducts: number;
  productsWithStock: number;
  productsLowStock: number;
  productsOutOfStock: number;
  totalWeightKg: number;
}

export async function getBranchInventoryStats(
  branchId: number
): Promise<BranchInventoryStats> {
  try {
    const rows = await queryRows<{
      total: number;
      with_stock: number;
      low_stock: number;
      out_of_stock: number;
      total_grams: number;
    }>(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN COALESCE(pbs.total_weight_grams - pbs.reserved_weight_grams, 0) > 0
                  THEN 1 ELSE 0 END) AS with_stock,
         SUM(CASE WHEN COALESCE(pbs.total_weight_grams - pbs.reserved_weight_grams, 0) > 0
                   AND COALESCE(pbs.total_weight_grams - pbs.reserved_weight_grams, 0) < 5000
                  THEN 1 ELSE 0 END) AS low_stock,
         SUM(CASE WHEN COALESCE(pbs.total_weight_grams - pbs.reserved_weight_grams, 0) <= 0
                  THEN 1 ELSE 0 END) AS out_of_stock,
         SUM(COALESCE(pbs.total_weight_grams - pbs.reserved_weight_grams, 0)) AS total_grams
       FROM products p
       LEFT JOIN product_branch_stock pbs
         ON pbs.branch_id = ? AND pbs.product_id = p.id
       WHERE p.is_active = 1`,
      [branchId]
    );

    const r = rows[0];
    return {
      totalProducts: Number(r?.total ?? 0),
      productsWithStock: Number(r?.with_stock ?? 0),
      productsLowStock: Number(r?.low_stock ?? 0),
      productsOutOfStock: Number(r?.out_of_stock ?? 0),
      totalWeightKg: Math.floor(Number(r?.total_grams ?? 0) / 1000),
    };
  } catch (error) {
    if (isMissingTableError(error)) {
      const rows = await queryRows<{ count: number }>(
        `SELECT COUNT(*) AS count FROM products WHERE is_active = 1`
      );
      const totalProducts = Number(rows[0]?.count ?? 0);

      console.warn(
        '[admin-branches] product_branch_stock table is missing; using zero-stock fallback stats.'
      );
      return {
        totalProducts,
        productsWithStock: 0,
        productsLowStock: 0,
        productsOutOfStock: totalProducts,
        totalWeightKg: 0,
      };
    }
    throw error;
  }
}

// ==========================================
// بررسی یکتا بودن slug
// ==========================================

export async function checkBranchSlugExists(
  slug: string,
  excludeId?: number
): Promise<boolean> {
  const params: unknown[] = [slug];
  let sql = `SELECT id FROM branches WHERE slug = ?`;
  if (excludeId) {
    sql += ` AND id != ?`;
    params.push(excludeId);
  }
  sql += ` LIMIT 1`;

  const rows = await queryRows<{ id: number }>(sql, params);
  return rows.length > 0;
}