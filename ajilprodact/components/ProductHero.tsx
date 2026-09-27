// components/ProductHero.tsx
// Hero صفحه محصول با پالت قهوه‌ای و طلایی

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  HeartIcon,
  PackageIcon,
  LeafIcon,
  ShieldIcon,
  ArrowLeftIcon,
} from '@/components/icons';
import type { ProductDetail } from '@/lib/types';

interface Props {
  product: ProductDetail;
}

function formatPrice(price: number): string {
  return price.toLocaleString('fa-IR');
}

export default function ProductHero({ product }: Props) {
  const [liked, setLiked] = useState(false);

  const primaryImage =
    product.images.find((img) => img.is_primary === 1) ?? product.images[0];

  const lowestPrice =
    product.variants.length > 0
      ? Math.min(...product.variants.map((v) => v.price))
      : 0;

  function scrollToVariants() {
    const el = document.getElementById('variant-selector');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <div className="relative rounded-3xl overflow-hidden aspect-[4/5] sm:aspect-[16/10] md:aspect-[16/9] shadow-2xl shadow-coffee-900/30">
      {primaryImage ? (
        <Image
          src={primaryImage.url}
          alt={primaryImage.alt ?? product.name}
          fill
          sizes="(max-width: 768px) 100vw, 90vw"
          className="object-cover"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-coffee-700 to-coffee-900" />
      )}

      <div
        className="absolute inset-0 bg-gradient-to-t from-coffee-900 via-coffee-900/65 to-coffee-900/20"
        aria-hidden="true"
      />

      {/* ردیف بالا: قیمت و قلب */}
      <div className="absolute top-4 right-4 left-4 flex items-start justify-between gap-3">
        <div className="inline-flex items-baseline gap-1.5 bg-white/95 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-gold-200/50">
          <span className="text-coffee-500 text-[10px] font-medium">از</span>
          <span className="font-bold text-coffee-900 fa-num text-sm">
            {formatPrice(lowestPrice)}
          </span>
          <span className="text-coffee-500 text-[10px]">تومان</span>
        </div>

        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition-all shadow-lg ${
            liked
              ? 'bg-red-500 text-white'
              : 'bg-white/90 text-coffee-700 hover:bg-white'
          }`}
          aria-label={liked ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی'}
        >
          <HeartIcon className="w-5 h-5" filled={liked} />
        </button>
      </div>

      {/* محتوای پایین */}
      <div className="absolute bottom-0 right-0 left-0 p-5 sm:p-7">
        <Link
          href={`/categories/${product.category.slug}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-500/20 backdrop-blur border border-gold-400/40 text-gold-100 text-xs font-medium mb-3 hover:bg-gold-500/30 transition-colors"
        >
          <LeafIcon className="w-3.5 h-3.5" />
          {product.category.name}
        </Link>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-cream-50 mb-3 leading-tight">
          {product.name}
        </h1>

        {product.short_desc && (
          <p className="hidden sm:block text-cream-100/85 text-sm leading-7 mb-4 max-w-2xl">
            {product.short_desc}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-cream-100/90 text-xs sm:text-sm mb-5">
          {product.variants.length > 0 && (
            <span className="flex items-center gap-1.5">
              <PackageIcon className="w-4 h-4 text-gold-400" />
              <span className="fa-num">
                {product.variants.length.toLocaleString('fa-IR')}
              </span>
              وزن
            </span>
          )}

          {product.latest_batch && (
            <span className="flex items-center gap-1.5">
              <LeafIcon className="w-4 h-4 text-gold-400" />
              تازگی
              <span className="fa-num">
                {product.latest_batch.freshness_score.toLocaleString('fa-IR')}
              </span>
            </span>
          )}

          <span className="flex items-center gap-1.5">
            <ShieldIcon className="w-4 h-4 text-gold-400" />
            تضمین کیفیت
          </span>
        </div>

        <button
          type="button"
          onClick={scrollToVariants}
          className="group w-full sm:w-auto sm:min-w-[240px] inline-flex items-center justify-center gap-2 btn-gold shimmer-line py-3.5 px-6 rounded-2xl"
        >
          مشاهده و خرید
          <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}