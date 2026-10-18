// app/admin/products/[id]/edit/page.tsx
// ویرایش محصول

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getAdminProductById,
  getCategoriesForSelect,
} from '@/lib/queries/products-admin';
import ProductForm from '@/components/admin/products/ProductForm';

export const metadata: Metadata = {
  title: 'ویرایش محصول',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    notFound();
  }

  const [detail, categories] = await Promise.all([
    getAdminProductById(productId),
    getCategoriesForSelect(),
  ]);

  if (!detail) notFound();

  return (
    <ProductForm
      categories={categories}
      initial={{
        id: detail.product.id,
        name: detail.product.name,
        slug: detail.product.slug,
        short_desc: detail.product.short_desc ?? '',
        description: detail.product.description ?? '',
        category_id: detail.product.category_id,
        is_active: detail.product.is_active === 1,
        is_featured: detail.product.is_featured === 1,
        meta_title: detail.product.meta_title ?? '',
        meta_desc: detail.product.meta_desc ?? '',
        variants: detail.variants.map((v) => ({
          id: v.id,
          weight_gram: v.weight_gram,
          packaging_type: v.packaging_type,
          packaging_label: v.packaging_label ?? '',
          price: Number(v.price),
          compare_price: v.compare_price ? Number(v.compare_price) : null,
          sku: v.sku,
          image_url: v.image_url,
          is_active: v.is_active === 1,
        })),
        images: detail.images.map((img) => ({
          id: img.id,
          url: img.url,
          alt: img.alt ?? '',
          is_primary: img.is_primary === 1,
          sort_order: img.sort_order,
        })),
        batch: detail.batch
          ? {
              id: detail.batch.id,
              batch_code: detail.batch.batch_code,
              supplier_name: detail.batch.supplier_name ?? '',
              harvest_date: detail.batch.harvest_date
                ? String(detail.batch.harvest_date).slice(0, 10)
                : '',
              roast_date: detail.batch.roast_date
                ? String(detail.batch.roast_date).slice(0, 10)
                : '',
              pack_date: detail.batch.pack_date
                ? String(detail.batch.pack_date).slice(0, 10)
                : '',
              expiry_date: detail.batch.expiry_date
                ? String(detail.batch.expiry_date).slice(0, 10)
                : '',
              freshness_mode: detail.batch.freshness_mode,
              freshness_score: detail.batch.freshness_score,
              freshness_base_score: detail.batch.freshness_base_score,
              freshness_base_date: detail.batch.freshness_base_date
                ? String(detail.batch.freshness_base_date).slice(0, 10)
                : '',
              freshness_annual_decay: detail.batch.freshness_annual_decay,
              qc_note: detail.batch.qc_note ?? '',
            }
          : undefined,
      }}
    />
  );
}