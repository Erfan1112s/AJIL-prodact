// components/ProductHeartButton.tsx
// دکمه علاقه‌مندی محصول

'use client';

import { useState } from 'react';
import { HeartIcon } from '@/components/icons';

interface Props {
  productId: number;
}

export default function ProductHeartButton({ productId }: Props) {
  const [liked, setLiked] = useState(false);

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setLiked((v) => !v);
    console.log('علاقه‌مندی:', productId, liked ? 'حذف' : 'افزودن');
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-9 h-9 rounded-full backdrop-blur-md shadow-lg flex items-center justify-center transition-all shrink-0 ${
        liked
          ? 'bg-red-500 text-white'
          : 'bg-white/90 text-coffee-700 hover:bg-white'
      }`}
      aria-label={liked ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی'}
    >
      <HeartIcon className="w-4 h-4" filled={liked} />
    </button>
  );
}