// lib/utils.ts
// توابع کمکی مشترک

/**
 * نمایش قیمت با جداکننده فارسی
 */
export function formatPrice(price: number): string {
  return price.toLocaleString('fa-IR');
}

/**
 * نمایش تاریخ شمسی
 */
export function formatDate(date: Date | null | string): string {
  if (!date) return 'ثبت نشده';
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * نمایش تاریخ و ساعت شمسی
 */
export function formatDateTime(date: Date | null | string): string {
  if (!date) return 'ثبت نشده';
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * تولید شماره سفارش یکتا
 * فرمت: ORD-YYMMDD-XXXX
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${yy}${mm}${dd}-${random}`;
}