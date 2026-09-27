// components/ProductCard.tsx
// کارت محصول - Server Component
// تنها بخش تعاملی (دکمه سبد) در QuickAddButton جدا شده است

import Image from 'next/image';
import Link from 'next/link';
import QuickAddButton from '@/components/QuickAddButton';
import type { ProductListItem } from '@/lib/types';

interface Props {
  product: ProductListItem;
  priority?: boolean;
}

// تابع کمکی برای نمایش قیمت
function formatPrice(price: number): string {
  return price.toLocaleString('fa-IR');
}

export default function ProductCard({ product, priority = false }: Props) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block bg-white border border-ink-200 rounded-2xl overflow-hidden card-soft"
    >
      {/* بخش تصویر */}
      <div className="aspect-square bg-ink-50 relative overflow-hidden">
        {product.primary_image ? (
          <Image
            src={product.primary_image.url}
            alt={product.primary_image.alt ?? product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            priority={priority}
          />
        ) : (
          // حالت بدون تصویر
          <div className="flex flex-col items-center justify-center h-full gap-2 text-ink-300">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <span className="text-xs">بدون تصویر</span>
          </div>
        )}

        {/* برچسب ویژه */}
        {product.is_featured === 1 && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-accent-500 text-white text-[10px] font-bold shadow-lg">
            ویژه
          </div>
        )}

        {/* دکمه افزودن سریع - یک Client Component جدا */}
        <QuickAddButton
          productSlug={product.slug}
          productName={product.name}
        />
      </div>

      {/* بخش اطلاعات */}
      <div className="p-4">
        <div className="text-[11px] text-brand-700 font-medium mb-1.5">
          {product.category.name}
        </div>

        <h3 className="font-bold text-sm text-ink-900 mb-3 line-clamp-2 leading-6 group-hover:text-brand-700 transition-colors">
          {product.name}
        </h3>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] text-ink-500 mb-0.5">
              شروع از
            </div>
            <div className="font-bold text-brand-700 fa-num text-lg">
              {formatPrice(product.min_price)}
              <span className="text-xs font-normal text-ink-500 mr-1">
                تومان
              </span>
            </div>
          </div>

          {/* تعداد وزن‌ها */}
          <div className="text-[10px] text-ink-400 fa-num">
            {product.variants.length.toLocaleString('fa-IR')} وزن
          </div>
        </div>
      </div>
    </Link>
  );
}