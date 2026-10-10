// lib/queries/products.ts
import { queryRows } from '@/lib/db';
import type {
  ProductRow,
  ProductVariantRow,
  ProductImageRow,
  BatchRow,
  CategorySummary,
  ProductListItem,
  ProductDetail,
} from '@/lib/types';

async function attachVariantsAndImages(
  products: ProductRow[]
): Promise<ProductListItem[]> {
  if (products.length === 0) return [];

  const productIds = products.map((p) => p.id);
  const placeholders = productIds.map(() => '?').join(',');

  const [variants, images, categories] = await Promise.all([
    queryRows<ProductVariantRow>(
      `SELECT id, product_id, weight_gram, price, compare_price,
              sku, is_active, created_at, updated_at
       FROM product_variants
       WHERE product_id IN (${placeholders}) AND is_active = 1
       ORDER BY weight_gram ASC`,
      productIds
    ),
    queryRows<ProductImageRow>(
      `SELECT id, product_id, url, alt, sort_order, is_primary, created_at
       FROM product_images
       WHERE product_id IN (${placeholders})
       ORDER BY is_primary DESC, sort_order ASC`,
      productIds
    ),
    queryRows<CategorySummary>(
      `SELECT DISTINCT c.id, c.name, c.slug
       FROM categories c
       INNER JOIN products p ON p.category_id = c.id
       WHERE p.id IN (${placeholders})`,
      productIds
    ),
  ]);

  const variantsByProduct = new Map<number, ProductVariantRow[]>();
  for (const v of variants) {
    const list = variantsByProduct.get(v.product_id) ?? [];
    list.push(v);
    variantsByProduct.set(v.product_id, list);
  }

  const primaryImageByProduct = new Map<number, ProductImageRow>();
  for (const img of images) {
    if (!primaryImageByProduct.has(img.product_id)) {
      primaryImageByProduct.set(img.product_id, img);
    }
  }

  const categoryById = new Map<number, CategorySummary>();
  for (const c of categories) {
    categoryById.set(c.id, c);
  }

  return products.map((p) => {
    const productVariants = variantsByProduct.get(p.id) ?? [];
    const category = categoryById.get(p.category_id) ?? {
      id: 0,
      name: 'بدون دسته',
      slug: '',
    };
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

export interface GetProductsOptions {
  limit?: number;
  offset?: number;
  categoryId?: number;
  featuredOnly?: boolean;
}

export async function getProducts(
  options: GetProductsOptions = {}
): Promise<ProductListItem[]> {
  const { limit = 20, offset = 0, categoryId, featuredOnly = false } = options;
  const conditions: string[] = ['is_active = 1'];
  const params: unknown[] = [];

  if (categoryId !== undefined) {
    conditions.push('category_id = ?');
    params.push(categoryId);
  }
  if (featuredOnly) {
    conditions.push('is_featured = 1');
  }

  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 100);
  const safeOffset = Math.max(0, Math.floor(offset));
  const whereClause = conditions.join(' AND ');

  const products = await queryRows<ProductRow>(
    `SELECT id, name, slug, description, short_desc,
            category_id, meta_title, meta_desc,
            is_active, is_featured, view_count,
            created_at, updated_at
     FROM products
     WHERE ${whereClause}
     ORDER BY is_featured DESC, created_at DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  return attachVariantsAndImages(products);
}

export async function getFeaturedProducts(limit = 4): Promise<ProductListItem[]> {
  return getProducts({ limit, featuredOnly: true });
}

export async function getProductsByCategory(
  categoryId: number,
  limit = 20,
  offset = 0
): Promise<ProductListItem[]> {
  return getProducts({ limit, offset, categoryId });
}

export async function getProductBySlug(
  slug: string
): Promise<ProductDetail | null> {
  const products = await queryRows<
    ProductRow & { category_name: string; category_slug: string }
  >(
    `SELECT p.id, p.name, p.slug, p.description, p.short_desc,
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

  const product = products[0];
  if (!product) return null;

  const [variants, images, batches] = await Promise.all([
    queryRows<ProductVariantRow>(
      `SELECT id, product_id, weight_gram, price, compare_price,
              sku, is_active, created_at, updated_at
       FROM product_variants
       WHERE product_id = ? AND is_active = 1
       ORDER BY weight_gram ASC`,
      [product.id]
    ),
    queryRows<ProductImageRow>(
      `SELECT id, product_id, url, alt, sort_order, is_primary, created_at
       FROM product_images
       WHERE product_id = ?
       ORDER BY is_primary DESC, sort_order ASC`,
      [product.id]
    ),
    queryRows<BatchRow>(
      `SELECT id, batch_code, product_id, supplier_name,
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

export async function incrementProductView(productId: number): Promise<void> {
  const { execute } = await import('@/lib/db');
  await execute(
    `UPDATE products SET view_count = view_count + 1 WHERE id = ?`,
    [productId]
  );
}