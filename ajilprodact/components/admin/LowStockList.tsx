// components/admin/LowStockList.tsx
// لیست محصولات کم‌موجود

import Link from 'next/link';
import type { LowStockProduct } from '@/lib/queries/dashboard';

interface Props {
  products: LowStockProduct[];
}

export default function LowStockList({ products }: Props) {
  return (
    <div className="rounded-2xl border border-coffee-200 bg-white overflow-hidden">
      {/* هدر */}
      <div className="px-5 py-4 border-b border-coffee-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-coffee-900">
              محصولات کم‌موجود
            </h3>
            <p className="text-xs text-coffee-500 mt-0.5">
              نیاز به تأمین دارند
            </p>
          </div>
        </div>

        <Link
          href="/admin/branches"
          className="text-xs font-medium text-gold-700 hover:text-gold-800 transition-colors inline-flex items-center gap-1 group"
        >
          مدیریت موجودی
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:-translate-x-0.5 transition-transform"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </Link>
      </div>

      {/* لیست */}
      {products.length === 0 ? (
        <div className="py-12 text-center text-sm text-coffee-500">
          همه محصولات موجودی کافی دارند
        </div>
      ) : (
        <div className="divide-y divide-coffee-100">
          {products.map((product) => {
            const stock = Number(product.stock_total);
            const isCritical = stock <= 0;
            const isLow = stock > 0 && stock < 5;

            return (
              <Link
                key={product.variant_id}
                href={`/admin/products/${product.product_id}/edit`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-cream-50 transition-colors"
              >
                {/* نشان وضعیت */}
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isCritical ? 'bg-red-500 animate-pulse' : 'bg-gold-500'
                  }`}
                />

                {/* اطلاعات */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-coffee-900 truncate mb-0.5">
                    {product.product_name}
                  </div>
                  <div className="text-[11px] text-coffee-500 fa-num">
                    {product.weight_gram.toLocaleString('fa-IR')} گرم
                  </div>
                </div>

                {/* موجودی */}
                <div
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold fa-num shrink-0 ${
                    isCritical
                      ? 'bg-red-50 text-red-700'
                      : 'bg-gold-50 text-gold-700'
                  }`}
                >
                  {isCritical
                    ? 'ناموجود'
                    : `${stock.toLocaleString('fa-IR')} عدد`}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}