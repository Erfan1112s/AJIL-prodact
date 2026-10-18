// components/ProductVariantSelector.tsx
// انتخاب وزن و بسته‌بندی با نمایش کامل

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CartIcon, CheckIcon, NfcIcon } from '@/components/icons';
import { useCart } from '@/lib/cart/CartContext';
import type { ProductVariantRow } from '@/lib/types';

interface Props {
  variants: ProductVariantRow[];
  productId: number;
  productName: string;
  productSlug: string;
  productImage: string | null;
  selectedVariantId: number | null;
  onVariantChange: (variantId: number) => void;
  variantStockMap?: Record<number, number>;
}

function formatPrice(price: number): string {
  return price.toLocaleString('fa-IR');
}

// برچسب خوانا برای بسته‌بندی
function getPackagingLabel(
  type: string,
  custom: string | null
): string {
  if (custom && custom.trim()) return custom.trim();
  if (type === 'standard') return ''; // برای معمولی چیزی نشان نده
  const labels: Record<string, string> = {
    plastic: 'کیسه پلاستیکی',
    paper: 'کیسه کاغذی',
    box: 'جعبه',
    gift_box: 'جعبه هدیه',
    can: 'قوطی حلبی',
    vacuum: 'وکیوم',
    jar: 'شیشه',
  };
  return labels[type] ?? type;
}

export default function ProductVariantSelector({
  variants,
  productId,
  productName,
  productSlug,
  productImage,
  selectedVariantId,
  onVariantChange,
  variantStockMap = {},
}: Props) {
  const { addItem } = useCart();
  const [buttonState, setButtonState] = useState<'idle' | 'adding' | 'added'>(
    'idle'
  );

  const selected =
    variants.find((v) => v.id === selectedVariantId) ?? variants[0] ?? null;

  useEffect(() => {
    if (buttonState !== 'added') return;
    const timer = setTimeout(() => setButtonState('idle'), 1400);
    return () => clearTimeout(timer);
  }, [buttonState]);

  if (variants.length === 0) {
    return (
      <div className="rounded-2xl border border-coffee-200 bg-cream-100 p-6 text-center text-sm text-coffee-500">
        برای این محصول وزنی ثبت نشده است.
      </div>
    );
  }

  function handleAddToCart() {
    if (!selected) return;
    if (buttonState !== 'idle') return;

    setButtonState('adding');

    addItem({
      variantId: selected.id,
      productId,
      productName,
      productSlug,
      weightGram: selected.weight_gram,
      price: selected.price,
      imageUrl: selected.image_url ?? productImage,
    });

    setTimeout(() => setButtonState('added'), 200);
  }

  const discountPercent =
    selected?.compare_price && selected.compare_price > selected.price
      ? Math.round(
        ((selected.compare_price - selected.price) /
          selected.compare_price) *
        100
      )
      : 0;

  return (
    <div id="variant-selector" className="space-y-6">
      {/* ==========================================
          انتخاب واریانت
          ========================================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-coffee-900">
            انتخاب وزن و بسته‌بندی
          </span>
          <span className="text-xs text-coffee-500 fa-num">
            {variants.length.toLocaleString('fa-IR')} گزینه موجود
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {variants.map((v) => {
            const isSelected = v.id === selectedVariantId;
            const hasDiscount =
              v.compare_price && v.compare_price > v.price;
            const hasImage = Boolean(v.image_url);
            const packagingText = getPackagingLabel(
              v.packaging_type,
              v.packaging_label
            );
            const hasPackaging = packagingText.length > 0;
            const stockCount = variantStockMap[v.id] ?? 0;
            const hasStock = stockCount > 0;

            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onVariantChange(v.id)}
                className={`group relative overflow-hidden rounded-2xl border-2 text-right transition-all duration-200 ${isSelected
                    ? 'border-gold-500 bg-gold-50 shadow-md shadow-gold-500/20 scale-[1.02]'
                    : 'border-coffee-200 bg-white hover:border-gold-300 hover:scale-[1.01]'
                  }`}
              >
                {/* تصویر واریانت */}
                {hasImage && (
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <Image
                      src={v.image_url!}
                      alt={`${productName} ${v.weight_gram} گرم`}
                      fill
                      sizes="200px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                )}

                {/* اطلاعات */}
                <div className={`p-3 ${hasImage ? 'pt-2' : ''}`}>
                  {/* وزن */}
                  <div
                    className={`font-bold text-sm fa-num mb-1 ${hasImage
                        ? 'text-coffee-900'
                        : isSelected
                          ? 'text-gold-700'
                          : 'text-coffee-800'
                      }`}
                  >
                    {v.weight_gram.toLocaleString('fa-IR')}
                    <span className="text-xs font-normal mr-1">گرم</span>
                  </div>

                  {/* بسته‌بندی (اگر غیرمعمولی بود) */}
                  {hasPackaging && (
                    <div
                      className={`text-[10px] mb-1.5 ${isSelected
                          ? 'text-gold-700 font-medium'
                          : 'text-coffee-600'
                        }`}
                    >
                      {packagingText}
                    </div>
                  )}

                  {/* قیمت */}
                  <div
                    className={`text-[11px] fa-num ${isSelected ? 'text-gold-700' : 'text-coffee-500'
                      }`}
                  >
                    {formatPrice(v.price)}
                    <span className="text-[9px] mr-0.5">تومان</span>
                  </div>

                  {/* موجودی */}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${hasStock
                          ? 'bg-green-50 text-green-700'
                          : 'bg-cream-100 text-coffee-500'
                        }`}
                    >
                      {hasStock
                        ? `${stockCount.toLocaleString('fa-IR')} عدد`
                        : 'ناموجود'}
                    </span>
                  </div>
                </div>

                {/* نشان تخفیف */}
                {hasDiscount && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-coffee-900 text-[9px] font-bold shadow-sm fa-num">
                    {Math.round(
                      ((v.compare_price! - v.price) / v.compare_price!) * 100
                    ).toLocaleString('fa-IR')}
                    ٪
                  </span>
                )}

                {/* نشان انتخاب */}
                {isSelected && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gold-500 flex items-center justify-center shadow-md">
                    <CheckIcon className="w-3 h-3 text-coffee-900" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==========================================
          کارت قیمت و خرید
          ========================================== */}
      {selected && (
        <div className="rounded-2xl border border-gold-200 bg-gradient-to-b from-gold-50 to-cream-50 p-5">
          {/* انتخاب فعلی */}
          <div className="mb-3 pb-3 border-b border-gold-200/60">
            <div className="text-[10px] text-coffee-500 mb-1">
              انتخاب شما
            </div>
            <div className="text-sm font-bold text-coffee-900">
              {selected.weight_gram.toLocaleString('fa-IR')} گرم
              {getPackagingLabel(selected.packaging_type, selected.packaging_label) && (
                <span className="text-coffee-600 font-normal mr-2">
                  — {getPackagingLabel(selected.packaging_type, selected.packaging_label)}
                </span>
              )}
            </div>
          </div>

          {/* قیمت */}
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

          {/* دکمه‌ها */}
          <div className="space-y-2">
            <div className="relative">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={buttonState !== 'idle'}
                className={`group/btn relative w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all duration-300 overflow-hidden disabled:cursor-not-allowed ${buttonState === 'idle'
                    ? 'btn-gold active:scale-[0.98]'
                    : buttonState === 'adding'
                      ? 'bg-gold-400 text-coffee-900 scale-[0.97]'
                      : 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-600/30'
                  }`}
              >
                <span className="relative w-5 h-5 flex items-center justify-center">
                  <CartIcon
                    className={`absolute w-5 h-5 transition-all duration-300 ${buttonState === 'idle'
                        ? 'opacity-100 scale-100 rotate-0'
                        : 'opacity-0 scale-0 rotate-90'
                      }`}
                  />
                  <CheckIcon
                    className={`absolute w-5 h-5 transition-all duration-500 ${buttonState === 'added'
                        ? 'opacity-100 scale-100 rotate-0'
                        : 'opacity-0 scale-0 -rotate-90'
                      }`}
                  />
                </span>

                <span className="relative">
                  {buttonState === 'idle' && 'افزودن به سبد خرید'}
                  {buttonState === 'adding' && 'در حال افزودن...'}
                  {buttonState === 'added' && 'به سبد اضافه شد'}
                </span>
              </button>

              {buttonState === 'added' && (
                <span
                  className="absolute inset-0 rounded-xl border-2 border-brand-500 animate-ping pointer-events-none"
                  aria-hidden="true"
                />
              )}
            </div>

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