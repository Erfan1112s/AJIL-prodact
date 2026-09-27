// components/Container.tsx
// ظرف مشترک برای یکدست کردن حاشیه‌های افقی در همه صفحات

import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  // measure: عرض حداکثر
  // narrow برای فرم‌ها، default برای صفحات، wide برای لیست‌ها
  measure?: 'narrow' | 'default' | 'wide';
}

// نگاشت measure به کلاس عرض
const measureClass = {
  narrow: 'max-w-2xl',
  default: 'max-w-5xl',
  wide: 'max-w-7xl',
};

export default function Container({
  children,
  className = '',
  measure = 'default',
}: Props) {
  return (
    <div
      className={`${measureClass[measure]} mx-auto px-5 sm:px-6 ${className}`}
    >
      {children}
    </div>
  );
}