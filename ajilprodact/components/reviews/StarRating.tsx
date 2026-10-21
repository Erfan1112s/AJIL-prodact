// components/reviews/StarRating.tsx
// کامپوننت ستاره برای نمایش و انتخاب امتیاز

'use client';

import { useState, useRef, type KeyboardEvent } from 'react';

interface Props {
  // امتیاز فعلی (0 تا 5). 0 = بدون امتیاز
  value: number;
  // اگر تعریف شود، حالت انتخاب فعال می‌شود
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  // نمایش عدد امتیاز کنار ستاره‌ها
  showValue?: boolean;
  // اجبار به حالت نمایش
  readOnly?: boolean;
  className?: string;
}

// مسیر SVG ستاره
const STAR_PATH =
  'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z';

// کامپوننت ستاره تکی
function StarIcon({
  filled,
  sizeClass,
}: {
  filled: boolean;
  sizeClass: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={sizeClass}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={STAR_PATH} />
    </svg>
  );
}

export default function StarRating({
  value,
  onChange,
  size = 'md',
  showValue = false,
  readOnly = false,
  className = '',
}: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isInteractive = !readOnly && typeof onChange === 'function';

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };
  const sizeClass = sizeClasses[size];

  // مقدار نمایشی: در hover، مقدار hover؛ وگرنه مقدار فعلی
  const displayValue = hovered !== null ? hovered : value;

  const handleMouseEnter = (star: number) => {
    if (isInteractive) setHovered(star);
  };

  const handleMouseLeave = () => {
    if (isInteractive) setHovered(null);
  };

  const handleClick = (star: number) => {
    if (isInteractive) onChange(star);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isInteractive) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(5, value + 1);
      onChange(next);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const prev = Math.max(1, value - 1);
      onChange(prev);
    } else if (e.key >= '1' && e.key <= '5') {
      e.preventDefault();
      onChange(Number(e.key));
    }
  };

  return (
    <div
      ref={containerRef}
      className={`inline-flex items-center gap-1 ${className}`}
      dir="ltr"
      role={isInteractive ? 'radiogroup' : 'img'}
      aria-label={
        isInteractive
          ? 'انتخاب امتیاز'
          : value > 0
            ? `امتیاز ${value} از ۵`
            : 'بدون امتیاز'
      }
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      tabIndex={isInteractive ? 0 : undefined}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayValue;

        return (
          <span
            key={star}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            role={isInteractive ? 'radio' : undefined}
            aria-checked={isInteractive ? star === value : undefined}
            aria-label={isInteractive ? `${star} ستاره` : undefined}
            className={`transition-colors ${
              isInteractive ? 'cursor-pointer' : 'cursor-default'
            } ${filled ? 'text-gold-500' : 'text-coffee-300'}`}
          >
            <StarIcon filled={filled} sizeClass={sizeClass} />
          </span>
        );
      })}

      {showValue && value > 0 && (
        <span
          className="text-xs text-coffee-600 fa-num mr-1.5"
          dir="rtl"
        >
          {value.toLocaleString('fa-IR')}
        </span>
      )}
    </div>
  );
}