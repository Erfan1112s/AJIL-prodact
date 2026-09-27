// components/ProductVariantSelector.tsx
// انتخاب وزن و خرید با پالت قهوه‌ای و طلایی

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
      <div className="rounded-2xl border border-coffee-200 bg-cream-100 p-6 text-center text-sm text-coffee-500">
        برای این محصول وزنی ثبت نشده است.
      </div>
    );
  }

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
          <span className="text-sm font-semibold text-coffee-900">
            انتخاب وزن
          </span>
          <span className="text-xs text-coffee-500 fa-num">
            {variants.length.toLocaleString('fa-IR')} وزن موجود
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {variants.map((v) => {
            const isSelected = v.id === selectedId;
            const hasDiscount = v.compare_price && v.compare_price > v.price;

            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedId(v.id)}
                className={`relative px-3 py-3 rounded-xl border-2 text-center transition-all ${
                  isSelected
                    ? 'border-gold-500 bg-gold-50 shadow-md shadow-gold-500/20'
                    : 'border-coffee-200 bg-white hover:border-gold-300'
                }`}
              >
                <div
                  className={`font-bold text-sm fa-num ${
                    isSelected ? 'text-gold-700' : 'text-coffee-800'
                  }`}
                >
                  {v.weight_gram.toLocaleString('fa-IR')}
                  <span className="text-xs font-normal mr-1">گرم</span>
                </div>
                <div
                  className={`text-[10px] mt-1 fa-num ${
                    isSelected ? 'text-gold-600' : 'text-coffee-500'
                  }`}
                >
                  {formatPrice(v.price)}
                </div>

                {hasDiscount && (
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-coffee-900 text-[9px] font-bold shadow-sm fa-num">
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
        <div className="rounded-2xl border border-gold-200 bg-gradient-to-b from-gold-50 to-cream-50 p-5">
          <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
            <div>
              <div className="text-xs text-coffee-500 mb-1">قیمت</div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-bold text-gradient-gold fa-num">
                  {formatPrice(selected.price)}
                </span>
                <span className="text-xs text-coffee-600">تومان</span>

                {selected.compare_price &&
                  selected.compare_price > selected.price && (
                    <span className="text-sm text-coffee-400 line-through fa-num">
                      {formatPrice(selected.compare_price)}
                    </span>
                  )}
              </div>
            </div>

            {discountPercent > 0 && (
              <div className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-bold fa-num">
                {discountPercent.toLocaleString('fa-IR')}٪ تخفیف
              </div>
            )}
          </div>

          <div className="space-y-2">
            <button
              type="button"
              className="w-full inline-flex items-center justify-center gap-2 btn-gold shimmer-line py-3.5 rounded-xl"
            >
              <CartIcon className="w-5 h-5" />
              افزودن به سبد خرید
            </button>

            <button
              type="button"
              className="w-full inline-flex items-center justify-center gap-2 bg-white border border-coffee-200 hover:border-gold-500 hover:text-gold-700 text-coffee-800 py-3 rounded-xl text-sm font-medium transition-colors"
            >
              <NfcIcon className="w-4 h-4" />
              رزرو از شعبه
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gold-200/60 flex items-center justify-center gap-4 text-[11px] text-coffee-600">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
              ارسال سریع
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
              تضمین تازگی
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
              پرداخت امن
            </span>
          </div>
        </div>
      )}
    </div>
  );
}