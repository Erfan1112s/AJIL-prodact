// components/ProductDetailClient.tsx
// کلاینت اصلی صفحه محصول: مدیریت همزمان تصویر و انتخاب واریانت
// وقتی کاربر وزن را عوض می‌کند، تصویر بالای کارت هم عوض می‌شود

'use client';

import { useState } from 'react';
import ProductHero from '@/components/ProductHero';
import ProductVariantSelector from '@/components/ProductVariantSelector';
import type { ProductDetail } from '@/lib/types';

interface Props {
  product: ProductDetail;
  variantStockMap?: Record<number, number>;
}

export default function ProductDetailClient({
  product,
  variantStockMap = {},
}: Props) {
  // واریانت پیش‌فرض: اولی
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    product.variants[0]?.id ?? null
  );

  // واریانت انتخاب‌شده فعلی
  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ??
    product.variants[0] ??
    null;

  // تصویر فعال:
  // 1. اگر واریانت تصویر دارد، از آن استفاده کن
  // 2. وگرنه تصویر اصلی محصول
  // 3. وگرنه اولین تصویر
  const activeImage =
    selectedVariant?.image_url ??
    product.images.find((img) => img.is_primary === 1)?.url ??
    product.images[0]?.url ??
    null;

  return (
    <div className="space-y-8">
      {/* Hero با تصویر داینامیک */}
      <ProductHero product={product} imageUrl={activeImage} />

      {/* انتخاب واریانت + خلاصه */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ستون اصلی: انتخاب واریانت */}
        <div className="md:col-span-2">
          <div className="rounded-3xl border border-coffee-200 bg-white p-5 sm:p-6">
            <ProductVariantSelector
              variants={product.variants}
              productId={product.id}
              productName={product.name}
              productSlug={product.slug}
              productImage={activeImage}
              selectedVariantId={selectedVariantId}
              onVariantChange={setSelectedVariantId}
              variantStockMap={variantStockMap}
            />
          </div>
        </div>

        {/* ستون کنار: اطلاعات سریع */}
        <SideInfo
          product={product}
          selectedVariant={selectedVariant}
          variantStockMap={variantStockMap}
        />
      </div>
    </div>
  );
}

// ==========================================
// ستون اطلاعات سریع
// ==========================================

function SideInfo({
  product,
  selectedVariant,
  variantStockMap,
}: {
  product: ProductDetail;
  selectedVariant: ProductDetail['variants'][0] | null;
  variantStockMap: Record<number, number>;
}) {
  // محاسبه موجودی واریانت انتخاب‌شده
  const totalStock =
    selectedVariant && variantStockMap[selectedVariant.id] !== undefined
      ? variantStockMap[selectedVariant.id]
      : 0;

  return (
    <div className="space-y-3">
      {/* کارت موجودی */}
      <div className="rounded-2xl border border-coffee-200 bg-white p-5">
        <div className="text-xs text-coffee-500 mb-2">موجودی فعلی</div>
        <div className="text-lg font-bold text-gold-700 fa-num">
          {selectedVariant
            ? `${totalStock.toLocaleString('fa-IR')} عدد`
            : 'ناموجود'}
        </div>
        <div className="text-[11px] text-coffee-500 mt-1">
          هر وزن را می‌توانید از شعبه تحویل بگیرید
        </div>
      </div>

      {/* کارت بچ */}
      {product.latest_batch && (
        <div className="rounded-2xl border border-coffee-200 bg-white p-5">
          <div className="text-xs text-coffee-500 mb-2">
            آخرین بچ تولید
          </div>
          <div
            className="font-mono text-sm font-bold text-coffee-900 fa-num mb-2"
            dir="ltr"
          >
            {product.latest_batch.batch_code}
          </div>
          <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-gold-400 to-gold-600 rounded-full"
              style={{
                width: `${product.latest_batch.freshness_score}%`,
              }}
            />
          </div>
          <div className="text-[11px] text-coffee-500 mt-2 fa-num">
            امتیاز تازگی{' '}
            {product.latest_batch.freshness_score.toLocaleString('fa-IR')}{' '}
            از ۱۰۰
          </div>
        </div>
      )}
    </div>
  );
}