// components/ProductGallery.tsx
// گالری تصاویر محصول

'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ProductImageRow } from '@/lib/types';

interface Props {
  images: ProductImageRow[];
  productName: string;
}

export default function ProductGallery({ images, productName }: Props) {
  if (images.length === 0) {
    return (
      <div className="aspect-square bg-cream-100 rounded-2xl flex flex-col items-center justify-center gap-3 text-coffee-300">
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

  const primary = images.find((img) => img.is_primary === 1) ?? images[0];
  const [activeId, setActiveId] = useState(primary.id);
  const active = images.find((img) => img.id === activeId) ?? primary;

  return (
    <div className="space-y-3">
      <div className="aspect-square bg-cream-100 rounded-2xl overflow-hidden relative border border-coffee-200">
        <Image
          src={active.url}
          alt={active.alt ?? productName}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />

        {images.length > 1 && (
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-coffee-900/80 text-gold-200 text-xs fa-num backdrop-blur-sm">
            {images
              .findIndex((img) => img.id === activeId)
              .valueOf()
              .toLocaleString('fa-IR')}
            {' از '}
            {images.length.toLocaleString('fa-IR')}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img) => {
            const isActive = img.id === activeId;
            const thumbClass = isActive
              ? 'ring-2 ring-gold-500 ring-offset-2'
              : 'ring-1 ring-coffee-200 hover:ring-gold-300';

            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveId(img.id)}
                className={`aspect-square bg-cream-100 rounded-xl overflow-hidden relative transition-all ${thumbClass}`}
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