// components/ProductCard.tsx
// کارت محصول با پالت قهوه‌ای و طلایی

import Image from 'next/image';
import Link from 'next/link';
import QuickAddButton from '@/components/QuickAddButton';
import ProductHeartButton from '@/components/ProductHeartButton';
import { LeafIcon } from '@/components/icons';
import type { ProductListItem } from '@/lib/types';

interface Props {
  product: ProductListItem;
  priority?: boolean;
}

function formatPrice(price: number): string {
  return price.toLocaleString('fa-IR');
}

export default function ProductCard({ product, priority = false }: Props) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative block aspect-[3/4] rounded-3xl overflow-hidden shadow-lg shadow-coffee-900/10 hover:shadow-2xl hover:shadow-coffee-900/20 transition-all duration-500 hover:-translate-y-1"
    >
      {/* پس‌زمینه */}
      {product.primary_image ? (
        <Image
          src={product.primary_image.url}
          alt={product.primary_image.alt ?? product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          priority={priority}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-coffee-700 to-coffee-900" />
      )}

      {/* گرادیانت تیره */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-coffee-900 via-coffee-900/55 to-coffee-900/15"
        aria-hidden="true"
      />

      {/* ردیف بالایی */}
      <div className="absolute top-3 right-3 left-3 flex items-start justify-between gap-2 z-10">
        {product.is_featured === 1 ? (
          <div className="px-2.5 py-1 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-coffee-900 text-[10px] font-bold shadow-lg shadow-gold-500/40">
            ویژه
          </div>
        ) : (
          <div />
        )}

        <ProductHeartButton productId={product.id} />
      </div>

      {/* پیل قیمت */}
      <div className="absolute top-[calc(100%-11rem)] right-3 z-10">
        <div className="inline-flex items-baseline gap-1.5 bg-white/95 backdrop-blur-md rounded-full px-3 py-1.5 shadow-lg border border-gold-200/50">
          <span className="text-coffee-500 text-[10px] font-medium">از</span>
          <span className="font-bold text-coffee-900 fa-num text-sm">
            {formatPrice(product.min_price)}
          </span>
          <span className="text-coffee-500 text-[10px]">تومان</span>
        </div>
      </div>

      {/* دکمه سبد */}
      <QuickAddButton
        productSlug={product.slug}
        productName={product.name}
      />

      {/* محتوای پایین */}
      <div className="absolute bottom-0 right-0 left-0 p-4">
        {/* برچسب دسته */}
        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold-500/20 backdrop-blur-sm border border-gold-400/30 text-gold-100 text-[10px] font-medium mb-2">
          <LeafIcon className="w-3 h-3" />
          {product.category.name}
        </div>

        {/* نام */}
        <h3 className="text-base sm:text-lg font-bold text-cream-50 leading-snug mb-3 line-clamp-2 min-h-[2.6rem]">
          {product.name}
        </h3>

        {/* ردیف اطلاعات */}
        <div className="flex items-center justify-between gap-2 text-cream-200/85 text-[11px]">
          <span className="fa-num">
            {product.variants.length.toLocaleString('fa-IR')} وزن
          </span>

          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
            ارسال سریع
          </span>
        </div>
      </div>
    </Link>
  );
}