// lib/queries/categories.ts
import { queryRows } from '@/lib/db';
import type { CategoryRow, CategoryWithChildren } from '@/lib/types';

export async function getActiveCategoriesFlat(): Promise<CategoryRow[]> {
  const rows = await queryRows<CategoryRow>(
    `SELECT id, name, slug, description, image_url,
            parent_id, sort_order, is_active, created_at, updated_at
     FROM categories
     WHERE is_active = 1
     ORDER BY sort_order ASC, name ASC`
  );
  return rows;
}

export async function getCategoryTree(): Promise<CategoryWithChildren[]> {
  const flat = await getActiveCategoriesFlat();
  const map = new Map<number, CategoryWithChildren>();
  for (const cat of flat) {
    map.set(cat.id, { ...cat, children: [] });
  }
  const roots: CategoryWithChildren[] = [];
  for (const cat of flat) {
    const node = map.get(cat.id)!;
    if (cat.parent_id === null) {
      roots.push(node);
    } else {
      const parent = map.get(cat.parent_id);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
  }
  return roots;
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const rows = await queryRows<CategoryRow>(
    `SELECT id, name, slug, description, image_url,
            parent_id, sort_order, is_active, created_at, updated_at
     FROM categories
     WHERE slug = ? AND is_active = 1
     LIMIT 1`,
    [slug]
  );
  return rows[0] ?? null;
}

export async function getCategoryById(id: number): Promise<CategoryRow | null> {
  const rows = await queryRows<CategoryRow>(
    `SELECT id, name, slug, description, image_url,
            parent_id, sort_order, is_active, created_at, updated_at
     FROM categories
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}