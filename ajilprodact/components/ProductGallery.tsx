// components/ProductGallery.tsx
// گالری تصاویر محصول با انتخاب تصویر اصلی
// Client Component چون state دارد

'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ProductImageRow } from '@/lib/types';

interface Props {
  images: ProductImageRow[];
  productName: string;
}

export default function ProductGallery({ images, productName }: Props) {
  // اگر تصویری نیست، پیام بده
  if (images.length === 0) {
    return (
      <div className="aspect-square bg-ink-50 rounded-2xl flex flex-col items-center justify-center gap-3 text-ink-300">
        <svg
          width="60"
          height="60"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-5-5L5 21" />
        </svg>
        <span className="text-sm">تصویری برای این محصول ثبت نشده</span>
      </div>
    );
  }

  // پیدا کردن تصویر اصلی
  const primary = images.find((img) => img.is_primary === 1) ?? images[0];

  // state برای تصویر فعال
  // مقدار اولیه: تصویر اصلی
  const [activeId, setActiveId] = useState(primary.id);

  // تصویر فعال
  const active = images.find((img) => img.id === activeId) ?? primary;

  return (
    <div className="space-y-3">
      {/* تصویر بزرگ */}
      <div className="aspect-square bg-ink-50 rounded-2xl overflow-hidden relative border border-ink-100">
        <Image
          src={active.url}
          alt={active.alt ?? productName}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />

        {/* نشان تعداد تصاویر */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-ink-900/70 text-white text-xs fa-num backdrop-blur-sm">
            {images
              .findIndex((img) => img.id === activeId)
              .valueOf()
              .toLocaleString('fa-IR')}
            {' از '}
            {images.length.toLocaleString('fa-IR')}
          </div>
        )}
      </div>

      {/* تصاویر کوچک */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img) => {
            const isActive = img.id === activeId;
            const thumbClass = isActive
              ? 'ring-2 ring-brand-500 ring-offset-2'
              : 'ring-1 ring-ink-200 hover:ring-brand-300';

            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveId(img.id)}
                className={`aspect-square bg-ink-50 rounded-xl overflow-hidden relative transition-all ${thumbClass}`}
                aria-label={`نمایش تصویر ${img.alt ?? productName}`}
              >
                <Image
                  src={img.url}
                  alt={img.alt ?? productName}
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}