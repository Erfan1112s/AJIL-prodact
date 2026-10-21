// lib/utils.ts
// توابع کمکی مشترک

function toSafeDate(date: Date | string | null | undefined): Date | null {
  if (!date) return null;

  const value = date instanceof Date ? date : new Date(date);
  return Number.isNaN(value.getTime()) ? null : value;
}

/**
 * نمایش قیمت با جداکننده فارسی
 */
export function formatPrice(price: number): string {
  return price.toLocaleString('fa-IR');
}

/**
 * نمایش تاریخ شمسی
 */
export function formatDate(date: Date | string | null | undefined): string {
  const safeDate = toSafeDate(date);
  if (!safeDate) return 'ثبت نشده';

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(safeDate);
}

/**
 * نمایش تاریخ و ساعت شمسی
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  const safeDate = toSafeDate(date);
  if (!safeDate) return 'ثبت نشده';

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(safeDate);
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

/**
 * فرمت وزن به صورت خوانا
 * - زیر 1000 گرم: به گرم
 * - 1000 گرم و بیشتر: به کیلوگرم
 *
 * مثال:
 *   formatWeight(250) → "۲۵۰ گرم"
 *   formatWeight(11250) → "۱۱.۲۵ کیلوگرم"
 *   formatWeight(41000) → "۴۱ کیلوگرم"
 */
export function formatWeight(grams: number): string {
  if (!Number.isFinite(grams) || grams < 0) {
    return '۰ گرم';
  }

  if (grams < 1000) {
    return `${Math.round(grams).toLocaleString('fa-IR')} گرم`;
  }

  const kg = grams / 1000;

  // اگر عدد صحیح بود، بدون اعشار
  if (Number.isInteger(kg)) {
    return `${kg.toLocaleString('fa-IR')} کیلوگرم`;
  }

  // حداکثر 2 رقم اعشار
  const rounded = Math.round(kg * 100) / 100;
  return `${rounded.toLocaleString('fa-IR', {
    maximumFractionDigits: 2,
  })} کیلوگرم`;
}

/**
 * محاسبه وزن کل از تعداد بسته و وزن هر بسته
 */
export function calculateTotalWeight(
  count: number,
  weightPerUnit: number
): number {
  return Math.max(0, count) * Math.max(0, weightPerUnit);
}


/**
 * تبدیل تاریخ به فرمت نسبی فارسی
 * مثال: «۳ روز پیش»، «۲ ساعت پیش»
 */
export function formatRelativeTime(
  date: Date | string | null | undefined
): string {
  if (!date) return '';

  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const now = Date.now();
    const diffMs = now - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffSec < 60) return 'همین حالا';
    if (diffMin < 60) {
      return `${diffMin.toLocaleString('fa-IR')} دقیقه پیش`;
    }
    if (diffHour < 24) {
      return `${diffHour.toLocaleString('fa-IR')} ساعت پیش`;
    }
    if (diffDay < 7) {
      return `${diffDay.toLocaleString('fa-IR')} روز پیش`;
    }
    if (diffWeek < 4) {
      return `${diffWeek.toLocaleString('fa-IR')} هفته پیش`;
    }
    if (diffMonth < 12) {
      return `${diffMonth.toLocaleString('fa-IR')} ماه پیش`;
    }
    return `${diffYear.toLocaleString('fa-IR')} سال پیش`;
  } catch {
    return '';
  }
}