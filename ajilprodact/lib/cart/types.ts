// lib/cart/types.ts
// تایپ‌های سبد خرید

// یک آیتم در سبد خرید
// توجه: این یک snapshot است، نه ارجاع زنده به محصول
// یعنی اگر قیمت یا نام محصول در دیتابیس تغییر کند،
// سبد کاربر تغییر نمی‌کند تا وقتی که صفحه را رفرش کند
export interface CartItem {
  // شناسه واریانت (وزن خاص یک محصول). این کلید یکتا است
  variantId: number;

  // شناسه محصول والد
  productId: number;

  // نام محصول در لحظه افزودن
  productName: string;

  // اسلاگ برای ساخت لینک به صفحه محصول
  productSlug: string;

  // وزن به گرم (250، 500، 1000)
  weightGram: number;

  // قیمت واحد در لحظه افزودن (به تومان)
  price: number;

  // تعداد (بین 1 تا 10)
  quantity: number;

  // آدرس تصویر اصلی (نسبی یا کامل)
  imageUrl: string | null;
}

// حداکثر تعداد هر آیتم در سبد
// جلوگیری از سفارش‌های عجیب
export const MAX_QUANTITY = 10;

// کلید localStorage
// با پسوند نسخه، اگر ساختار عوض شد، کلید جدید استفاده می‌شود
export const CART_STORAGE_KEY = 'ajil_cart_v1';