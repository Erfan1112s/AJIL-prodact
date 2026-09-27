// lib/queries/categories.ts
// توابع خواندن دسته‌بندی‌ها از دیتابیس

import { db } from '@/lib/db';
import type {
  CategoryRow,
  CategoryWithChildren,
} from '@/lib/types';

// ==========================================
// تابع 1: خواندن همه دسته‌های فعال به صورت تخت
// ==========================================
export async function getActiveCategoriesFlat(): Promise<CategoryRow[]> {
  const [rows] = await db.query<CategoryRow[]>(
    `SELECT
       id, name, slug, description, image_url,
       parent_id, sort_order, is_active,
       created_at, updated_at
     FROM categories
     WHERE is_active = 1
     ORDER BY sort_order ASC, name ASC`
  );

  return rows;
}

// ==========================================
// تابع 2: ساخت درخت دسته‌بندی در حافظه
// ==========================================
export async function getCategoryTree(): Promise<CategoryWithChildren[]> {
  const flat = await getActiveCategoriesFlat();

  const map = new Map<number, CategoryWithChildren>();

  for (const cat of flat) {
    map.set(cat.id, {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image_url: cat.image_url,
      parent_id: cat.parent_id,
      sort_order: cat.sort_order,
      is_active: cat.is_active,
      created_at: cat.created_at,
      updated_at: cat.updated_at,
      children: [],
    });
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

// ==========================================
// تابع 3: خواندن یک دسته با slug
// ==========================================
export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const [rows] = await db.query<CategoryRow[]>(
    `SELECT
       id, name, slug, description, image_url,
       parent_id, sort_order, is_active,
       created_at, updated_at
     FROM categories
     WHERE slug = ? AND is_active = 1
     LIMIT 1`,
    [slug]
  );

  return rows[0] ?? null;
}

// ==========================================
// تابع 4: خواندن یک دسته با id
// ==========================================
export async function getCategoryById(id: number): Promise<CategoryRow | null> {
  const [rows] = await db.query<CategoryRow[]>(
    `SELECT
       id, name, slug, description, image_url,
       parent_id, sort_order, is_active,
       created_at, updated_at
     FROM categories
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] ?? null;
}