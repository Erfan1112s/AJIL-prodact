// components/ProductVariantSelector.tsx
// کامپوننت کلاینت برای انتخاب وزن و نمایش قیمت لحظه‌ای

'use client';
// این خط به Next.js می‌گوید این کامپوننت در مرورگر اجرا شود
// بدون آن، useState خطا می‌دهد

import { useState } from 'react';
import type { ProductVariantRow } from '@/lib/types';

// پراپ‌های کامپوننت
interface Props {
  variants: ProductVariantRow[];
}

// تابع کمکی برای نمایش قیمت با جداکننده فارسی
function formatPrice(price: number): string {
  return price.toLocaleString('fa-IR');
}

export default function ProductVariantSelector({ variants }: Props) {
  // selectedId: شناسه واریانت انتخاب‌شده
  // مقدار اولیه: اولین واریانت (که معمولاً کوچک‌ترین وزن است)
  const [selectedId, setSelectedId] = useState<number | null>(
    variants[0]?.id ?? null
  );

  // پیدا کردن واریانت انتخاب‌شده از لیست
  const selected = variants.find((v) => v.id === selectedId) ?? null;

  // اگر هیچ واریانتی نیست، پیام بده
  if (variants.length === 0) {
    return (
      <div className="text-sm text-zinc-500">
        برای این محصول وزنی ثبت نشده است.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* بخش انتخاب وزن */}
      <div>
        <div className="text-sm font-medium mb-2">انتخاب وزن:</div>
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => {
            // آیا این واریانت انتخاب شده؟
            const isSelected = v.id === selectedId;

            // کلاس‌های دکمه بر اساس وضعیت انتخاب
            const buttonClass = isSelected
              ? 'bg-brand-600 text-white border-brand-600'
              : 'bg-white text-zinc-700 border-zinc-300 hover:border-brand-500';

            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedId(v.id)}
                className={`px-4 py-2 border rounded-lg text-sm transition-colors ${buttonClass}`}
              >
                {v.weight_gram.toLocaleString('fa-IR')} گرم
              </button>
            );
          })}
        </div>
      </div>

      {/* بخش نمایش قیمت */}
      {selected && (
        <div className="border-t border-zinc-200 pt-4">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-brand-700 fa-num">
              {formatPrice(selected.price)}
            </span>
            <span className="text-sm text-zinc-600">تومان</span>

            {/* اگر compare_price داشت، خط‌خورده نمایش بده */}
            {selected.compare_price &&
              selected.compare_price > selected.price && (
                <span className="text-sm text-zinc-400 line-through fa-num">
                  {formatPrice(selected.compare_price)}
                </span>
              )}
          </div>

          {/* اگر تخفیف داشت، درصد محاسبه کن */}
          {selected.compare_price &&
            selected.compare_price > selected.price && (
              <div className="text-xs text-red-600 mt-1">
                {Math.round(
                  ((selected.compare_price - selected.price) /
                    selected.compare_price) *
                    100
                )}
                ٪ تخفیف
              </div>
            )}

          {/* دکمه‌های خرید */}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              افزودن به سبد
            </button>
            <button
              type="button"
              className="px-4 py-3 border border-zinc-300 rounded-lg text-sm hover:bg-zinc-50 transition-colors"
            >
              رزرو از شعبه
            </button>
          </div>
        </div>
      )}
    </div>
  );
}