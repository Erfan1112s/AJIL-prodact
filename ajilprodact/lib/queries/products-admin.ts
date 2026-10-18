// lib/queries/products-admin.ts
// کوئری‌های اختصاصی پنل ادمین برای محصولات

import { queryRows } from '@/lib/db';
import type {
  ProductRow,
  ProductVariantRow,
  ProductImageRow,
  BatchRow,
  CategorySummary,
} from '@/lib/types';

// ==========================================
// لیست محصولات ادمین
// ==========================================

export interface AdminProductListItem {
  id: number;
  name: string;
  slug: string;
  category_id: number;
  category_name: string;
  is_active: number;
  is_featured: number;
  view_count: number;
  variants_count: number;
  min_price: number;
  max_price: number;
  total_stock: number;
  primary_image: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface GetAdminProductsOptions {
  search?: string;
  categoryId?: number;
  status?: 'all' | 'active' | 'inactive';
  limit?: number;
  offset?: number;
}

export async function getAdminProducts(
  options: GetAdminProductsOptions = {}
): Promise<AdminProductListItem[]> {
  const {
    search,
    categoryId,
    status = 'all',
    limit = 20,
    offset = 0,
  } = options;

  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];

  if (search && search.trim()) {
    conditions.push('(p.name LIKE ? OR p.slug LIKE ?)');
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }

  if (categoryId) {
    conditions.push('p.category_id = ?');
    params.push(categoryId);
  }

  if (status === 'active') {
    conditions.push('p.is_active = 1');
  } else if (status === 'inactive') {
    conditions.push('p.is_active = 0');
  }

  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 100);
  const safeOffset = Math.max(0, Math.floor(offset));
  const whereClause = conditions.join(' AND ');

  const rows = await queryRows<AdminProductListItem>(
    `SELECT
       p.id, p.name, p.slug, p.category_id, p.is_active, p.is_featured,
       p.view_count, p.created_at, p.updated_at,
       c.name AS category_name,
       (SELECT COUNT(*) FROM product_variants pv
        WHERE pv.product_id = p.id AND pv.is_active = 1) AS variants_count,
       (SELECT COALESCE(MIN(pv.price), 0) FROM product_variants pv
        WHERE pv.product_id = p.id AND pv.is_active = 1) AS min_price,
       (SELECT COALESCE(MAX(pv.price), 0) FROM product_variants pv
        WHERE pv.product_id = p.id AND pv.is_active = 1) AS max_price,
(SELECT COALESCE(SUM(pbs.total_weight_grams - pbs.reserved_weight_grams), 0)
 FROM product_branch_stock pbs
 WHERE pbs.product_id = p.id) AS total_available_grams,
       (SELECT url FROM product_images
        WHERE product_id = p.id
        ORDER BY is_primary DESC, sort_order ASC
        LIMIT 1) AS primary_image
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     WHERE ${whereClause}
     ORDER BY p.updated_at DESC, p.id DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  return rows;
}

export async function getAdminProductsCount(
  options: GetAdminProductsOptions = {}
): Promise<number> {
  const { search, categoryId, status = 'all' } = options;
  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];

  if (search && search.trim()) {
    conditions.push('(name LIKE ? OR slug LIKE ?)');
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }
  if (categoryId) {
    conditions.push('category_id = ?');
    params.push(categoryId);
  }
  if (status === 'active') conditions.push('is_active = 1');
  else if (status === 'inactive') conditions.push('is_active = 0');

  const whereClause = conditions.join(' AND ');

  const rows = await queryRows<{ count: number }>(
    `SELECT COUNT(*) AS count FROM products WHERE ${whereClause}`,
    params
  );
  return Number(rows[0]?.count ?? 0);
}

// ==========================================
// یک محصول کامل
// ==========================================

export interface AdminProductDetail {
  product: ProductRow;
  variants: ProductVariantRow[];
  images: ProductImageRow[];
  batch: BatchRow | null;
  category: CategorySummary;
}

export async function getAdminProductById(
  id: number
): Promise<AdminProductDetail | null> {
  const products = await queryRows<
    ProductRow & { category_name: string; category_slug: string }
  >(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     WHERE p.id = ?
     LIMIT 1`,
    [id]
  );

  const product = products[0];
  if (!product) return null;

  const [variants, images, batches] = await Promise.all([
    queryRows<ProductVariantRow>(
      `SELECT id, product_id, weight_gram, packaging_type, packaging_label,
              price, compare_price, sku, image_url, is_active,
              created_at, updated_at
       FROM product_variants
       WHERE product_id = ?
       ORDER BY weight_gram ASC, packaging_type ASC`,
      [id]
    ),
    queryRows<ProductImageRow>(
      `SELECT id, product_id, url, alt, sort_order, is_primary, created_at
       FROM product_images
       WHERE product_id = ?
       ORDER BY is_primary DESC, sort_order ASC`,
      [id]
    ),
    queryRows<BatchRow>(
      `SELECT * FROM batches
       WHERE product_id = ? AND is_active = 1
       ORDER BY pack_date DESC, id DESC
       LIMIT 1`,
      [id]
    ),
  ]);

  return {
    product,
    variants,
    images,
    batch: batches[0] ?? null,
    category: {
      id: product.category_id,
      name: product.category_name,
      slug: product.category_slug,
    },
  };
}

// ==========================================
// بررسی یکتا بودن slug
// ==========================================

export async function checkSlugExists(
  slug: string,
  excludeId?: number
): Promise<boolean> {
  const params: unknown[] = [slug];
  let sql = `SELECT id FROM products WHERE slug = ?`;

  if (excludeId) {
    sql += ` AND id != ?`;
    params.push(excludeId);
  }
  sql += ` LIMIT 1`;

  const rows = await queryRows<{ id: number }>(sql, params);
  return rows.length > 0;
}

// ==========================================
// لیست دسته‌بندی‌ها
// ==========================================

export async function getCategoriesForSelect(): Promise<CategorySummary[]> {
  return queryRows<CategorySummary>(
    `SELECT id, name, slug FROM categories
     WHERE is_active = 1
     ORDER BY sort_order ASC, name ASC`
  );
}