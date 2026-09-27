// components/ProductVariantSelector.tsx
// انتخاب وزن و نمایش قیمت لحظه‌ای با طراحی مدرن

'use client';

import { useState } from 'react';
import { CartIcon, NfcIcon } from '@/components/icons';
import type { ProductVariantRow } from '@/lib/types';

interface Props {
  variants: ProductVariantRow[];
}

function formatPrice(price: number): string {
  return price.toLocaleString('fa-IR');
}

export default function ProductVariantSelector({ variants }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(
    variants[0]?.id ?? null
  );

  const selected = variants.find((v) => v.id === selectedId) ?? null;

  if (variants.length === 0) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-ink-50 p-6 text-center text-sm text-ink-500">
        برای این محصول وزنی ثبت نشده است.
      </div>
    );
  }

  // محاسبه درصد تخفیف
  const discountPercent =
    selected?.compare_price && selected.compare_price > selected.price
      ? Math.round(
          ((selected.compare_price - selected.price) / selected.compare_price) *
            100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* انتخاب وزن */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-ink-900">
            انتخاب وزن
          </span>
          <span className="text-xs text-ink-500 fa-num">
            {variants.length.toLocaleString('fa-IR')} وزن موجود
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {variants.map((v) => {
            const isSelected = v.id === selectedId;
            const hasDiscount =
              v.compare_price && v.compare_price > v.price;

            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedId(v.id)}
                className={`relative px-3 py-3 rounded-xl border-2 text-center transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50 shadow-md shadow-brand-500/10'
                    : 'border-ink-200 bg-white hover:border-brand-300'
                }`}
              >
                <div
                  className={`font-bold text-sm fa-num ${
                    isSelected ? 'text-brand-700' : 'text-ink-800'
                  }`}
                >
                  {v.weight_gram.toLocaleString('fa-IR')}
                  <span className="text-xs font-normal mr-1">گرم</span>
                </div>
                <div
                  className={`text-[10px] mt-1 fa-num ${
                    isSelected ? 'text-brand-600' : 'text-ink-500'
                  }`}
                >
                  {formatPrice(v.price)}
                </div>

                {/* نشان تخفیف */}
                {hasDiscount && (
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-accent-500 text-white text-[9px] font-bold shadow-sm fa-num">
                    {Math.round(
                      ((v.compare_price! - v.price) / v.compare_price!) * 100
                    ).toLocaleString('fa-IR')}
                    ٪
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* کارت قیمت و خرید */}
      {selected && (
        <div className="rounded-2xl border border-ink-200 bg-gradient-to-b from-white to-ink-50/50 p-5">
          {/* قیمت */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="text-xs text-ink-500 mb-1">قیمت</div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-bold text-brand-700 fa-num">
                  {formatPrice(selected.price)}
                </span>
                <span className="text-xs text-ink-500">تومان</span>

                {/* قیمت قبل از تخفیف */}
                {selected.compare_price &&
                  selected.compare_price > selected.price && (
                    <span className="text-sm text-ink-400 line-through fa-num">
                      {formatPrice(selected.compare_price)}
                    </span>
                  )}
              </div>
            </div>

            {/* نشان تخفیف */}
            {discountPercent > 0 && (
              <div className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-bold fa-num">
                {discountPercent.toLocaleString('fa-IR')}٪ تخفیف
              </div>
            )}
          </div>

          {/* دکمه‌ها */}
          <div className="space-y-2">
            <button
              type="button"
              className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white py-3.5 rounded-xl font-medium transition-colors shadow-lg shadow-brand-600/20"
            >
              <CartIcon className="w-5 h-5" />
              افزودن به سبد خرید
            </button>

            <button
              type="button"
              className="w-full inline-flex items-center justify-center gap-2 bg-white border border-ink-200 hover:border-brand-500 hover:text-brand-700 text-ink-800 py-3 rounded-xl text-sm font-medium transition-colors"
            >
              <NfcIcon className="w-4 h-4" />
              رزرو از شعبه
            </button>
          </div>

          {/* اطلاعات کوچک */}
          <div className="mt-4 pt-4 border-t border-ink-100 flex items-center justify-center gap-4 text-[11px] text-ink-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              ارسال سریع
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              تضمین تازگی
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              پرداخت امن
            </span>
          </div>
        </div>
      )}
    </div>
  );
}