// components/ProductVariantSelector.tsx
// انتخاب وزن و افزودن به سبد خرید با انیمیشن مدرن

'use client';

import { useState, useEffect } from 'react';
import { CartIcon, CheckIcon, NfcIcon } from '@/components/icons';
import { useCart } from '@/lib/cart/CartContext';
import type { ProductVariantRow } from '@/lib/types';

interface Props {
  variants: ProductVariantRow[];
  productId: number;
  productName: string;
  productSlug: string;
  productImage: string | null;
}

function formatPrice(price: number): string {
  return price.toLocaleString('fa-IR');
}

export default function ProductVariantSelector({
  variants,
  productId,
  productName,
  productSlug,
  productImage,
}: Props) {
  const { addItem } = useCart();
  const [selectedId, setSelectedId] = useState<number | null>(
    variants[0]?.id ?? null
  );
  // حالت دکمه: idle | adding | added
  // برای کنترل انیمیشن سه‌مرحله‌ای
  const [buttonState, setButtonState] = useState<'idle' | 'adding' | 'added'>(
    'idle'
  );

  const selected = variants.find((v) => v.id === selectedId) ?? null;

  // بازگشت خودکار به حالت idle بعد از نمایش تایید
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
    // اگر واریانتی انتخاب نشده، خارج شو
    if (!selected) return;

    // اگر در حال پردازش است، از کلیک مجدد جلوگیری کن
    if (buttonState !== 'idle') return;

    // تغییر حالت به adding برای انیمیشن فشردن
    setButtonState('adding');

    // افزودن به سبد
    addItem({
      variantId: selected.id,
      productId,
      productName,
      productSlug,
      weightGram: selected.weight_gram,
      price: selected.price,
      imageUrl: productImage,
    });

    // تغییر حالت به added بعد از 200 میلی‌ثانیه
    // این تأخیر برای نمایش انیمیشن فشردن است
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
    <div className="space-y-6">
      {/* ==========================================
          انتخاب وزن
          ========================================== */}
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
            const hasDiscount =
              v.compare_price && v.compare_price > v.price;

            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedId(v.id)}
                className={`relative px-3 py-3 rounded-xl border-2 text-center transition-all duration-200 ${isSelected
                    ? 'border-gold-500 bg-gold-50 shadow-md shadow-gold-500/20 scale-[1.02]'
                    : 'border-coffee-200 bg-white hover:border-gold-300 hover:scale-[1.01]'
                  }`}
              >
                <div
                  className={`font-bold text-sm fa-num ${isSelected ? 'text-gold-700' : 'text-coffee-800'
                    }`}
                >
                  {v.weight_gram.toLocaleString('fa-IR')}
                  <span className="text-xs font-normal mr-1">گرم</span>
                </div>
                <div
                  className={`text-[10px] mt-1 fa-num ${isSelected ? 'text-gold-600' : 'text-coffee-500'
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

      {/* ==========================================
          کارت قیمت و خرید
          ========================================== */}
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
            {/* دکمه افزودن به سبد با انیمیشن یک‌باره */}
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
                {/* آیکون متحرک: چرخش از سبد به تیک */}
                <span className="relative w-5 h-5 flex items-center justify-center">
                  <CartIcon
                    className={`absolute w-5 h-5 transition-all duration-300 ${buttonState === 'idle'
                        ? 'opacity-100 scale-100 rotate-0'
                        : 'opacity-0 scale-0 rotate-90'
                      }`}
                  />
                  <CheckIcon
                    className={`absolute w-5 h-5 ${buttonState === 'added' ? 'animate-pop-once' : 'opacity-0 scale-0'
                      }`}
                  />
                </span>

                {/* متن */}
                <span className="relative transition-opacity duration-200">
                  {buttonState === 'idle' && 'افزودن به سبد خرید'}
                  {buttonState === 'adding' && 'در حال افزودن...'}
                  {buttonState === 'added' && 'به سبد اضافه شد'}
                </span>
              </button>

              {/* حلقه سبز که یک بار بیرون دکمه می‌زند */}
              {buttonState === 'added' && (
                <span
                  className="absolute inset-0 rounded-xl border-2 border-brand-500 animate-ring-once pointer-events-none"
                  aria-hidden="true"
                />
              )}
            </div>

            {/* دکمه رزرو از شعبه */}
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