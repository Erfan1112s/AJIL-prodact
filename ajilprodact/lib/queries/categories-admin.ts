// lib/queries/categories-admin.ts
// کوئری‌های اختصاصی پنل ادمین برای دسته‌بندی‌ها

import { queryRows } from '@/lib/db';
import type { CategoryRow } from '@/lib/types';

// ==========================================
// ساختار درختی برای نمایش
// ==========================================

export interface AdminCategoryNode extends CategoryRow {
  children: AdminCategoryNode[];
  products_count: number;
  depth: number;
}

export async function getAdminCategoryTree(): Promise<AdminCategoryNode[]> {
  // خواندن همه دسته‌ها با شمارش محصولات
  const rows = await queryRows<
    CategoryRow & { products_count: number }
  >(
    `SELECT
       c.id, c.name, c.slug, c.description, c.image_url,
       c.parent_id, c.sort_order, c.is_active,
       c.created_at, c.updated_at,
       (SELECT COUNT(*) FROM products p
        WHERE p.category_id = c.id) AS products_count
     FROM categories c
     ORDER BY c.sort_order ASC, c.name ASC`
  );

  // ساخت درخت
  const map = new Map<number, AdminCategoryNode>();
  for (const row of rows) {
    map.set(row.id, {
      ...row,
      children: [],
      depth: 0,
    });
  }

  const roots: AdminCategoryNode[] = [];

  for (const row of rows) {
    const node = map.get(row.id)!;
    if (row.parent_id === null) {
      node.depth = 0;
      roots.push(node);
    } else {
      const parent = map.get(row.parent_id);
      if (parent) {
        node.depth = parent.depth + 1;
        parent.children.push(node);
      } else {
        // والد وجود ندارد - به ریشه اضافه کن
        node.depth = 0;
        roots.push(node);
      }
    }
  }

  return roots;
}

// ==========================================
// یک دسته برای فرم ویرایش
// ==========================================

export async function getAdminCategoryById(
  id: number
): Promise<(CategoryRow & { products_count: number }) | null> {
  const rows = await queryRows<
    CategoryRow & { products_count: number }
  >(
    `SELECT
       c.id, c.name, c.slug, c.description, c.image_url,
       c.parent_id, c.sort_order, c.is_active,
       c.created_at, c.updated_at,
       (SELECT COUNT(*) FROM products p
        WHERE p.category_id = c.id) AS products_count
     FROM categories c
     WHERE c.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

// ==========================================
// لیست دسته‌ها برای dropdown والد
// (همه دسته‌ها به جز خود دسته و فرزندانش)
// ==========================================

export async function getCategoriesForParentSelect(
  excludeId?: number
): Promise<CategoryRow[]> {
  // همه دسته‌های فعال
  const rows = await queryRows<CategoryRow>(
    `SELECT id, name, slug, description, image_url,
            parent_id, sort_order, is_active, created_at, updated_at
     FROM categories
     WHERE is_active = 1
     ORDER BY sort_order ASC, name ASC`
  );

  if (!excludeId) return rows;

  // حذف خود دسته و همه فرزندانش
  const toExclude = new Set<number>();
  const queue = [excludeId];
  toExclude.add(excludeId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const row of rows) {
      if (row.parent_id === current && !toExclude.has(row.id)) {
        toExclude.add(row.id);
        queue.push(row.id);
      }
    }
  }

  return rows.filter((r) => !toExclude.has(r.id));
}

// ==========================================
// بررسی یکتا بودن slug
// ==========================================

export async function checkCategorySlugExists(
  slug: string,
  excludeId?: number
): Promise<boolean> {
  const params: unknown[] = [slug];
  let sql = `SELECT id FROM categories WHERE slug = ?`;
  if (excludeId) {
    sql += ` AND id != ?`;
    params.push(excludeId);
  }
  sql += ` LIMIT 1`;

  const rows = await queryRows<{ id: number }>(sql, params);
  return rows.length > 0;
}

// ==========================================
// بررسی وجود فرزند برای یک دسته
// ==========================================

export async function getCategoryChildrenCount(
  categoryId: number
): Promise<number> {
  const rows = await queryRows<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM categories WHERE parent_id = ?`,
    [categoryId]
  );
  return Number(rows[0]?.cnt ?? 0);
}