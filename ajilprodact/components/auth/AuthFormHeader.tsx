// components/auth/AuthFormHeader.tsx
// عنوان و توضیح داخل فرم احراز هویت

import type { ReactNode } from 'react';

interface Props {
  // عنوان اصلی
  title: string;
  // توضیح زیر عنوان (می‌تواند شامل span و ... باشد)
  desc?: ReactNode;
}

export default function AuthFormHeader({ title, desc }: Props) {
  return (
    <div className="text-center">
      <h2 className="text-base font-bold text-coffee-900 mb-1">
        {title}
      </h2>
      {desc && (
        <p className="text-xs text-coffee-500 leading-6">{desc}</p>
      )}
    </div>
  );
}