// components/CartCountBadge.tsx
// نشان تعداد آیتم‌های سبد خرید

'use client';

import { useCart } from '@/lib/cart/CartContext';

export default function CartCountBadge() {
  const { totalCount, hydrated } = useCart();

  if (!hydrated) return null;
  if (totalCount === 0) return null;

  return (
    <span
      className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gold-500 text-coffee-900 text-[10px] font-bold flex items-center justify-center fa-num shadow-sm"
      aria-label={`${totalCount} آیتم در سبد خرید`}
    >
      {totalCount.toLocaleString('fa-IR')}
    </span>
  );
}