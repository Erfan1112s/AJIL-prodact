// components/QuickAddButton.tsx
// دکمه افزودن سریع به سبد خرید

'use client';

import { CartIcon } from '@/components/icons';

interface Props {
  productSlug: string;
  productName: string;
}

export default function QuickAddButton({ productSlug, productName }: Props) {
  function handleAdd(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    console.log('افزودن به سبد:', productSlug);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="absolute bottom-3 left-3 w-10 h-10 rounded-full bg-white/95 backdrop-blur-md shadow-lg flex items-center justify-center text-coffee-800 hover:bg-gold-500 hover:text-coffee-900 transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 z-10"
      aria-label={`افزودن ${productName} به سبد`}
    >
      <CartIcon className="w-5 h-5" />
    </button>
  );
}