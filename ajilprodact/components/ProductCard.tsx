// components/ProductCard.tsx
// کارت محصول - فقط نمایش، بدون دکمه افزودن سریع
// دکمه افزودن به سبد فقط در صفحه تک محصول است
// تا کاربر بتواند وزن را انتخاب کند

import Image from 'next/image';
import Link from 'next/link';
import { LeafIcon } from '@/components/icons';
import type { ProductListItem } from '@/lib/types';

interface Props {
  product: ProductListItem;
  priority?: boolean;
}

// تابع کمکی برای نمایش قیمت با جداکننده فارسی
function formatPrice(price: number): string {
  return price.toLocaleString('fa-IR');
}

export default function ProductCard({ product, priority = false }: Props) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative block aspect-[3/4] overflow-hidden rounded-[28px] border border-coffee-200/70 bg-white shadow-[0_18px_40px_rgba(52,38,26,0.08)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_26px_52px_rgba(52,38,26,0.14)]"
    >
      {/* ==========================================
          تصویر پس‌زمینه
          ========================================== */}
      {product.primary_image ? (
        <Image
          src={product.primary_image.url}
          alt={product.primary_image.alt ?? product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          priority={priority}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-coffee-700 via-coffee-800 to-coffee-900" />
      )}

      {/* گرادیانت تیره برای خوانایی متن */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-coffee-900/80 via-coffee-900/20 to-transparent"
        aria-hidden="true"
      />

      {/* ==========================================
          ردیف بالایی: نشان ویژه و قلب
          ========================================== */}
      <div className="absolute inset-x-3 top-3 z-10">
        {product.is_featured === 1 ? (
          <span className="rounded-full bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 px-2.5 py-1 text-[10px] font-black text-coffee-900 shadow-lg shadow-gold-500/30">
            ویژه
          </span>
        ) : null}
      </div>

      {/* ==========================================
          پیل قیمت
          ========================================== */}
      <div className="absolute right-3 top-14 z-10">
        <div className="inline-flex items-baseline gap-1.5 rounded-full border border-gold-200/50 bg-white/90 px-3 py-1.5 shadow-md backdrop-blur-sm">
          <span className="text-[10px] font-medium text-coffee-500">از</span>
          <span className="fa-num text-sm font-black text-coffee-900">
            {formatPrice(product.min_price)}
          </span>
          <span className="text-[10px] text-coffee-500">تومان</span>
        </div>
      </div>

      {/* ==========================================
          محتوای پایین
          ========================================== */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-4">
        {/* برچسب دسته */}
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-gold-300/50 bg-gold-400/10 px-2.5 py-1 text-[10px] font-medium text-gold-100 backdrop-blur-sm">
          <LeafIcon className="h-3 w-3" />
          {product.category.name}
        </div>

        {/* نام محصول */}
        <h3 className="mb-3 min-h-[2.6rem] text-base font-extrabold leading-snug text-cream-50 line-clamp-2 sm:text-lg">
          {product.name}
        </h3>

        {/* ردیف اطلاعات */}
        <div className="flex items-center justify-between gap-2 text-[11px] text-cream-200/90">
          <span className="fa-num">{product.variants.length.toLocaleString('fa-IR')} وزن</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            ارسال سریع
          </span>
        </div>
      </div>
    </Link>
  );
}