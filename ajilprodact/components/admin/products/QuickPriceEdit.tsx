// components/admin/products/QuickPriceEdit.tsx
// مودال ویرایش لحظه‌ای قیمت یک واریانت

'use client';

import { useState, useTransition } from 'react';
import { updateVariantPriceAction } from '@/app/admin/(protected)/products/actions';
import { formatPrice } from '@/lib/utils';
import Alert from '@/components/auth/Alert';

interface Props {
  variant: {
    id: number;
    product_name: string;
    weight_gram: number;
    price: number;
    compare_price: number | null;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuickPriceEdit({
  variant,
  onClose,
  onSuccess,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [price, setPrice] = useState(variant.price);
  const [comparePrice, setComparePrice] = useState<number | null>(
    variant.compare_price
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateVariantPriceAction(
        variant.id,
        price,
        comparePrice
      );

      if (result.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 800);
      } else {
        setError(result.error);
      }
    });
  }

  // درصد تخفیف
  const discountPercent =
    comparePrice && comparePrice > price
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-900/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-down">
        {/* هدر */}
        <div className="bg-gradient-to-l from-gold-50 to-cream-50 p-5 border-b border-coffee-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-100 flex items-center justify-center text-gold-700 shrink-0">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="6" width="18" height="12" rx="2" />
                <circle cx="12" cy="12" r="2" />
                <path d="M7 6V4M17 6V4" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm text-coffee-900 line-clamp-1">
                ویرایش سریع قیمت
              </h3>
              <p className="text-[11px] text-coffee-500 line-clamp-1">
                {variant.product_name} — {variant.weight_gram.toLocaleString('fa-IR')} گرم
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="w-8 h-8 rounded-lg hover:bg-white text-coffee-500 flex items-center justify-center transition-colors shrink-0"
              aria-label="بستن"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>

        {/* بدن */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* قیمت فعلی */}
          <div className="rounded-xl bg-cream-50 border border-coffee-100 p-3">
            <div className="text-[10px] text-coffee-500 mb-1">
              قیمت فعلی
            </div>
            <div className="text-sm font-bold text-coffee-900 fa-num">
              {formatPrice(variant.price)} تومان
            </div>
          </div>

          {/* قیمت جدید */}
          <div>
            <label className="block text-sm font-medium text-coffee-800 mb-2">
              قیمت جدید (تومان)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) =>
                setPrice(Math.max(0, Number(e.target.value) || 0))
              }
              disabled={isPending}
              dir="ltr"
              autoFocus
              min="1000"
              step="1000"
              className="w-full px-4 py-3 rounded-xl border border-coffee-200 bg-cream-50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all text-center text-lg font-bold fa-num"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[10000, 50000, 100000, -10000, -50000].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => setPrice((p) => Math.max(0, p + delta))}
                  disabled={isPending}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-medium fa-num transition-colors ${
                    delta > 0
                      ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  } disabled:opacity-50`}
                >
                  {delta > 0 ? '+' : ''}
                  {(delta / 1000).toLocaleString('fa-IR')}
                  {' '}
                  هزار
                </button>
              ))}
            </div>
          </div>

          {/* قیمت قبل از تخفیف */}
          <div>
            <label className="block text-sm font-medium text-coffee-800 mb-2">
              قیمت قبل از تخفیف (اختیاری)
            </label>
            <input
              type="number"
              value={comparePrice ?? ''}
              onChange={(e) =>
                setComparePrice(
                  e.target.value ? Number(e.target.value) || 0 : null
                )
              }
              disabled={isPending}
              dir="ltr"
              min="0"
              step="1000"
              placeholder="خالی = بدون تخفیف"
              className="w-full px-4 py-3 rounded-xl border border-coffee-200 bg-cream-50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all text-center fa-num"
            />
          </div>

          {/* پیش‌نمایش تخفیف */}
          {discountPercent > 0 && (
            <div className="rounded-xl bg-gradient-to-l from-gold-50 to-cream-50 border border-gold-200 p-3 flex items-center justify-between">
              <div className="text-xs text-coffee-600">
                پس از تغییر، تخفیف:
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-bold fa-num">
                {discountPercent.toLocaleString('fa-IR')}٪
              </div>
            </div>
          )}

          {error && <Alert type="error">{error}</Alert>}

          {success && <Alert type="success">قیمت با موفقیت ذخیره شد</Alert>}

          {/* دکمه‌ها */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 px-4 py-3 rounded-xl bg-cream-100 text-coffee-700 text-sm font-medium hover:bg-cream-200 disabled:opacity-50 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isPending || price < 1000}
              className="flex-1 px-4 py-3 rounded-xl btn-gold text-sm font-bold disabled:opacity-60"
            >
              {isPending ? 'در حال ذخیره...' : 'ذخیره قیمت'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}