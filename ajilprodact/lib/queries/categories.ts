// lib/queries/categories.ts
// توابع خواندن دسته‌بندی‌ها از دیتابیس

import { db } from '@/lib/db';
import type {
  CategoryRow,
  CategoryWithChildren,
} from '@/lib/types';

// ==========================================
// تابع 1: خواندن همه دسته‌های فعال به صورت تخت
// برای ساخت درخت در حافظه استفاده می‌شود
// ==========================================
export async function getActiveCategoriesFlat(): Promise<CategoryRow[]> {
  // کوئری ساده: همه دسته‌های فعال به ترتیب sort_order
  // علامت ? در کوئری، پارامتر امن است (جلوگیری از SQL Injection)
  const [rows] = await db.query<CategoryRow[]>(
    `SELECT
       id, name, slug, description, image_url,
       parent_id, sort_order, is_active,
       created_at, updated_at
     FROM categories
     WHERE is_active = 1
     ORDER BY sort_order ASC, name ASC`
  );

  // mysql2 تایپ را به CategoryRow[] برمی‌گرداند
  // ولی TypeScript نمی‌داند query<T> دقیقاً چه شکلی برمی‌گرداند
  // پس cast امن می‌کنیم
  return rows as CategoryRow[];
}

// ==========================================
// تابع 2: ساخت درخت دسته‌بندی در حافظه
// از لیست تخت، ساختار درختی می‌سازد
// ==========================================
export async function getCategoryTree(): Promise<CategoryWithChildren[]> {
  // گرفتن همه دسته‌ها
  const flat = await getActiveCategoriesFlat();

  // ساخت Map برای جست‌وجوی سریع
  // Map از id به آبجکت درخت
  const map = new Map<number, CategoryWithChildren>();

  // مرحله 1: هر دسته را به یک آبجکت درخت با فرزندان خالی تبدیل کن
  for (const cat of flat) {
    map.set(cat.id, { ...cat, children: [] });
  }

  // مرحله 2: هر دسته را به والدش وصل کن
  const roots: CategoryWithChildren[] = [];

  for (const cat of flat) {
    const node = map.get(cat.id)!;

    if (cat.parent_id === null) {
      // دسته ریشه است
      roots.push(node);
    } else {
      // دسته فرزند است
      const parent = map.get(cat.parent_id);
      if (parent) {
        parent.children.push(node);
      } else {
        // اگر والد وجود نداشت (مثلاً غیرفعال بود)، به ریشه اضافه کن
        roots.push(node);
      }
    }
  }

  return roots;
}

// ==========================================
// تابع 3: خواندن یک دسته با slug
// برای صفحه /categories/[slug]
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
    [slug]  // پارامتر امن، جایگزین ? می‌شود
  );

  const list = rows as CategoryRow[];
  return list[0] ?? null;
}

// ==========================================
// تابع 4: خواندن یک دسته با id
// برای پنل ادمین
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

  const list = rows as CategoryRow[];
  return list[0] ?? null;
}