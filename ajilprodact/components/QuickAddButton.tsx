// components/QuickAddButton.tsx
// دکمه افزودن سریع به سبد خرید
// این تنها بخش کارت محصول است که به Client نیاز دارد

'use client';
// این خط ضروری است چون onClick داریم

import { CartIcon } from '@/components/icons';

interface Props {
  // slug محصول برای ارسال به سبد
  productSlug: string;
  // نام محصول برای aria-label بهتر
  productName: string;
}

export default function QuickAddButton({ productSlug, productName }: Props) {
  // تابع افزودن به سبد
  // فعلا placeholder است چون سبد خرید ساخته نشده
  function handleAdd(event: React.MouseEvent<HTMLButtonElement>) {
    // جلوگیری از رفتار پیش‌فرض
    // چون این دکمه داخل یک Link است، بدون preventDefault
    // کاربر به صفحه محصول می‌رود
    event.preventDefault();

    // جلوگیری از انتشار رویداد به والد
    // (خارج از Link، به‌عنوان محافظ)
    event.stopPropagation();

    // TODO در فاز بعد: افزودن به سبد خرید
    // فعلا فقط در console لاگ می‌کنیم
    console.log('افزودن به سبد:', productSlug);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="absolute bottom-3 left-3 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-ink-700 hover:bg-brand-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
      aria-label={`افزودن ${productName} به سبد`}
    >
      <CartIcon className="w-5 h-5" />
    </button>
  );
}