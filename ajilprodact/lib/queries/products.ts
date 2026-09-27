// lib/queries/products.ts
// توابع خواندن محصولات با واریانت‌ها و تصاویر
// طراحی شده برای جلوگیری از N+1 query

import { db } from '@/lib/db';
import type {
  ProductRow,
  ProductVariantRow,
  ProductImageRow,
  BatchRow,
  CategorySummary,
  ProductListItem,
  ProductDetail,
} from '@/lib/types';

// ==========================================
// تابع داخلی: چسباندن واریانت‌ها و تصاویر به محصولات
// این تابع از N+1 جلوگیری می‌کند
// ==========================================
async function attachVariantsAndImages(
  products: ProductRow[]
): Promise<ProductListItem[]> {
  // اگر محصولی نبود، برگردان
  if (products.length === 0) return [];

  // استخراج شناسه‌ها برای کوئری‌های گروهی
  const productIds = products.map((p) => p.id);

  // ساخت پلیس‌هولدر برای IN clause
  // مثال: اگر 3 محصول باشد، می‌شود "?,?,?"
  const placeholders = productIds.map(() => '?').join(',');

  // دو کوئری موازی، نه سری
  // Promise.all هر دو را همزمان اجرا می‌کند، نه یکی پس از دیگری
  const [variantsResult, imagesResult, categoriesResult] = await Promise.all([
    // کوئری 1: همه واریانت‌های این محصولات
    db.query<ProductVariantRow[]>(
      `SELECT
         id, product_id, weight_gram, price, compare_price,
         sku, is_active, created_at, updated_at
       FROM product_variants
       WHERE product_id IN (${placeholders}) AND is_active = 1
       ORDER BY weight_gram ASC`,
      productIds
    ),

    // کوئری 2: تصویر اصلی هر محصول
    db.query<ProductImageRow[]>(
      `SELECT
         id, product_id, url, alt, sort_order, is_primary, created_at
       FROM product_images
       WHERE product_id IN (${placeholders})
       ORDER BY is_primary DESC, sort_order ASC`,
      productIds
    ),

    // کوئری 3: اطلاعات دسته هر محصول
    db.query<CategorySummary[]>(
      `SELECT DISTINCT
         c.id, c.name, c.slug
       FROM categories c
       INNER JOIN products p ON p.category_id = c.id
       WHERE p.id IN (${placeholders})`,
      productIds
    ),
  ]);

  const variants = variantsResult[0] as ProductVariantRow[];
  const images = imagesResult[0] as ProductImageRow[];
  const categories = categoriesResult[0] as CategorySummary[];

  // ساخت Map برای جست‌وجوی سریع
  // Map از product_id به آرایه واریانت‌ها
  const variantsByProduct = new Map<number, ProductVariantRow[]>();
  for (const v of variants) {
    const list = variantsByProduct.get(v.product_id) ?? [];
    list.push(v);
    variantsByProduct.set(v.product_id, list);
  }

  // Map از product_id به تصویر اصلی
  const primaryImageByProduct = new Map<number, ProductImageRow>();
  for (const img of images) {
    // فقط اولین تصویر (که primary است) را نگه دار
    if (!primaryImageByProduct.has(img.product_id)) {
      primaryImageByProduct.set(img.product_id, img);
    }
  }

  // Map از id دسته به خلاصه دسته
  const categoryById = new Map<number, CategorySummary>();
  for (const c of categories) {
    categoryById.set(c.id, c);
  }

  // ترکیب همه در ProductListItem
  return products.map((p) => {
    const productVariants = variantsByProduct.get(p.id) ?? [];
    const category = categoryById.get(p.category_id) ?? {
      id: 0,
      name: 'بدون دسته',
      slug: '',
    };

    // محاسبه کمترین قیمت
    const minPrice =
      productVariants.length > 0
        ? Math.min(...productVariants.map((v) => v.price))
        : 0;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      short_desc: p.short_desc,
      category,
      variants: productVariants,
      primary_image: primaryImageByProduct.get(p.id) ?? null,
      min_price: minPrice,
      is_featured: p.is_featured,
    };
  });
}

// ==========================================
// تابع 1: لیست محصولات با صفحه‌بندی
// ==========================================
export interface GetProductsOptions {
  limit?: number;
  offset?: number;
  categoryId?: number;
  featuredOnly?: boolean;
}

export async function getProducts(
  options: GetProductsOptions = {}
): Promise<ProductListItem[]> {
  const {
    limit = 20,
    offset = 0,
    categoryId,
    featuredOnly = false,
  } = options;

  // ساخت شرط‌های پویا
  const conditions: string[] = ['is_active = 1'];
  const params: unknown[] = [];

  if (categoryId !== undefined) {
    conditions.push('category_id = ?');
    params.push(categoryId);
  }

  if (featuredOnly) {
    conditions.push('is_featured = 1');
  }

  // LIMIT و OFFSET را هم به پارامترها اضافه کن
  // نکته: در MySQL این دو نمی‌توانند با ? جایگزین شوند در همه نسخه‌ها
  // پس از String interpolation استفاده می‌کنیم، ولی با parseInt امن است
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 100);
  const safeOffset = Math.max(0, Math.floor(offset));

  const whereClause = conditions.join(' AND ');

  const [rows] = await db.query<ProductRow[]>(
    `SELECT
       id, name, slug, description, short_desc,
       category_id, meta_title, meta_desc,
       is_active, is_featured, view_count,
       created_at, updated_at
     FROM products
     WHERE ${whereClause}
     ORDER BY is_featured DESC, created_at DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  const products = rows as ProductRow[];
  return attachVariantsAndImages(products);
}

// ==========================================
// تابع 2: محصولات منتخب (برای صفحه اصلی)
// ==========================================
export async function getFeaturedProducts(limit = 4): Promise<ProductListItem[]> {
  return getProducts({ limit, featuredOnly: true });
}

// ==========================================
// تابع 3: محصولات یک دسته
// ==========================================
export async function getProductsByCategory(
  categoryId: number,
  limit = 20,
  offset = 0
): Promise<ProductListItem[]> {
  return getProducts({ limit, offset, categoryId });
}

// ==========================================
// تابع 4: محصول با slug (برای صفحه تک محصول)
// ==========================================
export async function getProductBySlug(
  slug: string
): Promise<ProductDetail | null> {
  // کوئری اول: اطلاعات پایه محصول + دسته
  const [productRows] = await db.query<
    (ProductRow & { category_name: string; category_slug: string })[]
  >(
    `SELECT
       p.id, p.name, p.slug, p.description, p.short_desc,
       p.category_id, p.meta_title, p.meta_desc,
       p.is_active, p.is_featured, p.view_count,
       p.created_at, p.updated_at,
       c.name AS category_name,
       c.slug AS category_slug
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     WHERE p.slug = ? AND p.is_active = 1
     LIMIT 1`,
    [slug]
  );

  const productList = productRows as Array<
    ProductRow & { category_name: string; category_slug: string }
  >;
  const product = productList[0];

  if (!product) return null;

  // کوئری‌های موازی: واریانت‌ها، تصاویر، آخرین بچ
  const [variantsResult, imagesResult, batchesResult] = await Promise.all([
    db.query<ProductVariantRow[]>(
      `SELECT
         id, product_id, weight_gram, price, compare_price,
         sku, is_active, created_at, updated_at
       FROM product_variants
       WHERE product_id = ? AND is_active = 1
       ORDER BY weight_gram ASC`,
      [product.id]
    ),

    db.query<ProductImageRow[]>(
      `SELECT
         id, product_id, url, alt, sort_order, is_primary, created_at
       FROM product_images
       WHERE product_id = ?
       ORDER BY is_primary DESC, sort_order ASC`,
      [product.id]
    ),

    db.query<BatchRow[]>(
      `SELECT
         id, batch_code, product_id, supplier_name,
         harvest_date, roast_date, pack_date, expiry_date,
         freshness_score, qc_note, is_active,
         created_at, updated_at
       FROM batches
       WHERE product_id = ? AND is_active = 1
       ORDER BY pack_date DESC
       LIMIT 1`,
      [product.id]
    ),
  ]);

  const variants = variantsResult[0] as ProductVariantRow[];
  const images = imagesResult[0] as ProductImageRow[];
  const batches = batchesResult[0] as BatchRow[];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    short_desc: product.short_desc,
    meta_title: product.meta_title,
    meta_desc: product.meta_desc,
    category: {
      id: product.category_id,
      name: product.category_name,
      slug: product.category_slug,
    },
    variants,
    images,
    latest_batch: batches[0] ?? null,
  };
}

// ==========================================
// تابع 5: افزایش شمارنده بازدید
// برای هر بار دیدن صفحه محصول
// ==========================================
export async function incrementProductView(productId: number): Promise<void> {
  await db.query(
    `UPDATE products SET view_count = view_count + 1 WHERE id = ?`,
    [productId]
  );
}