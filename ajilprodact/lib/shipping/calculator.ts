// lib/shipping/calculator.ts
// محاسبه هزینه ارسال برای اسنپ و پست
// ساختار برای اتصال به API واقعی آماده است

import type { ShippingProvider } from '@/lib/types';

// ==========================================
// تایپ‌های ورودی و خروجی
// ==========================================

export interface ShippingInput {
  // استان مقصد
  province: string;
  // شهر مقصد
  city: string;
  // وزن کل به گرم
  totalWeightGram: number;
  // جمع کالاها (برای ارسال رایگان)
  subtotal: number;
}

export interface ShippingOption {
  provider: ShippingProvider;
  label: string;
  description: string;
  cost: number;
  estimatedDays: string;
  // آیا در این گزینه رایگان است؟
  isFree: boolean;
}

export interface ShippingCalculationResult {
  options: ShippingOption[];
  // آیا امکان ارسال هست؟
  canShip: boolean;
  // پیام (اگر canShip=false)
  message?: string;
}

// ==========================================
// تنظیمات
// ==========================================

// حد مبلغ برای ارسال رایگان
const FREE_SHIPPING_THRESHOLD = 2_000_000; // 2 میلیون تومان

// وزن پایه برای محاسبه (گرم)
const BASE_WEIGHT = 1000;

// ==========================================
// استان‌های اطراف اصفهان (ارسال سریع‌تر و ارزان‌تر)
// ==========================================
const NEARBY_PROVINCES = [
  'اصفهان',
  'یزد',
  'چهارمحال و بختیاری',
  'کهگیلویه و بویراحمد',
  'مرکزی',
  'قم',
  'تهران',
  'فارس',
  'کرمان',
];

// ==========================================
// شهرهای بزرگ (ارسال سریع‌تر)
// ==========================================
const MAJOR_CITIES = [
  'تهران',
  'اصفهان',
  'مشهد',
  'شیراز',
  'تبریز',
  'کرج',
  'اهواز',
  'قم',
  'کرمانشاه',
  'ارومیه',
  'رشت',
  'زاهدان',
  'همدان',
  'کرمان',
  'یزد',
  'اردبیل',
  'بندرعباس',
  'اراک',
  'اسلامشهر',
  'زنجان',
];

// ==========================================
// محاسبه هزینه اسنپ
// ==========================================
function calculateSnappCost(input: ShippingInput): ShippingOption {
  const { province, city, totalWeightGram, subtotal } = input;

  // اسنپ معمولاً فقط در شهرهای بزرگ فعال است
  const isMajorCity = MAJOR_CITIES.some((c) => city.includes(c));

  if (!isMajorCity) {
    return {
      provider: 'SNAPP',
      label: 'اسنپ اکسپرس',
      description: 'متأسفانه در شهر شما در دسترس نیست',
      cost: 0,
      estimatedDays: '—',
      isFree: false,
    };
  }

  // چک ارسال رایگان
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return {
      provider: 'SNAPP',
      label: 'اسنپ اکسپرس',
      description: 'ارسال رایگان به مناسبت خرید بالای 2 میلیون تومان',
      cost: 0,
      estimatedDays: '1 تا 2 روز کاری',
      isFree: true,
    };
  }

  // محاسبه بر اساس وزن
  // اسنپ: پایه 45 هزار + هر کیلو اضافه 15 هزار
  const extraWeight = Math.max(0, totalWeightGram - BASE_WEIGHT);
  const extraUnits = Math.ceil(extraWeight / 1000);

  let cost = 45_000 + extraUnits * 15_000;

  // اطراف اصفهان تخفیف
  if (NEARBY_PROVINCES.includes(province)) {
    cost = Math.round(cost * 0.9);
  }

  return {
    provider: 'SNAPP',
    label: 'اسنپ اکسپرس',
    description: 'تحویل سریع درب منزل',
    cost: Math.round(cost / 1000) * 1000, // رند به هزار
    estimatedDays: '1 تا 2 روز کاری',
    isFree: false,
  };
}

// ==========================================
// محاسبه هزینه پست
// ==========================================
function calculatePostCost(input: ShippingInput): ShippingOption {
  const { province, totalWeightGram, subtotal } = input;

  // چک ارسال رایگان
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return {
      provider: 'POST',
      label: 'پست پیشتاز',
      description: 'ارسال رایگان به مناسبت خرید بالای 2 میلیون تومان',
      cost: 0,
      estimatedDays: '3 تا 5 روز کاری',
      isFree: true,
    };
  }

  // محاسبه بر اساس وزن و مقصد
  // پست: پایه 35 هزار + هر کیلو اضافه 12 هزار
  const extraWeight = Math.max(0, totalWeightGram - BASE_WEIGHT);
  const extraUnits = Math.ceil(extraWeight / 1000);

  let baseCost = 35_000 + extraUnits * 12_000;

  // اطراف اصفهان تخفیف
  if (NEARBY_PROVINCES.includes(province)) {
    baseCost = Math.round(baseCost * 0.85);
  }

  return {
    provider: 'POST',
    label: 'پست پیشتاز',
    description: 'ارسال به سراسر کشور',
    cost: Math.round(baseCost / 1000) * 1000,
    estimatedDays: '3 تا 5 روز کاری',
    isFree: false,
  };
}

// ==========================================
// تابع اصلی
// ==========================================

/**
 * محاسبه گزینه‌های ارسال
 * در آینده با API واقعی اسنپ و پست جایگزین می‌شود
 */
export function calculateShippingOptions(
  input: ShippingInput
): ShippingCalculationResult {
  const { province, city } = input;

  // اعتبارسنجی
  if (!province || !city) {
    return {
      options: [],
      canShip: false,
      message: 'برای محاسبه هزینه ارسال، استان و شهر را وارد کنید.',
    };
  }

  // وزن حداکثر 30 کیلو
  if (input.totalWeightGram > 30_000) {
    return {
      options: [],
      canShip: false,
      message: 'وزن سفارش بیش از حد مجاز است. لطفاً سفارش خود را به چند بخش تقسیم کنید.',
    };
  }

  const options: ShippingOption[] = [
    calculateSnappCost(input),
    calculatePostCost(input),
  ];

  // فیلتر گزینه‌های نامعتبر (اسنپ در شهر کوچک)
  const validOptions = options.filter(
    (opt) => opt.provider === 'POST' || opt.cost >= 0
  );

  return {
    options: validOptions,
    canShip: true,
  };
}

// ==========================================
// محاسبه وزن کل سبد
// ==========================================

interface WeightItem {
  weightGram: number;
  quantity: number;
}

/**
 * محاسبه وزن کل سبد خرید
 */
export function calculateTotalWeight(items: WeightItem[]): number {
  return items.reduce(
    (sum, item) => sum + item.weightGram * item.quantity,
    0
  );
}

// lib/shipping/provinces.ts
// لیست استان‌ها و شهرهای اصلی ایران

export interface Province {
  name: string;
  cities: string[];
}

// لیست خلاصه: فقط استان‌های پرجمعیت و شهرهای اصلی
// برای لیست کامل از API یا دیتابیس استفاده می‌شود
export const PROVINCES: Province[] = [
  {
    name: 'تهران',
    cities: ['تهران', 'اسلامشهر', 'شهریار', 'ورامین', 'رباط‌کریم', 'پاکدشت', 'قرچک'],
  },
  {
    name: 'اصفهان',
    cities: ['اصفهان', 'کاشان', 'نجف‌آباد', 'خمینی‌شهر', 'شاهین‌شهر', 'فولادشهر'],
  },
  {
    name: 'خراسان رضوی',
    cities: ['مشهد', 'نیشابور', 'سبزوار', 'تربت حیدریه', 'قوچان'],
  },
  {
    name: 'فارس',
    cities: ['شیراز', 'مرودشت', 'کازرون', 'جهرم', 'فسا'],
  },
  {
    name: 'آذربایجان شرقی',
    cities: ['تبریز', 'مراغه', 'مرند', 'اهر', 'میانه'],
  },
  {
    name: 'آذربایجان غربی',
    cities: ['ارومیه', 'خوی', 'میاندوآب', 'بوکان', 'مهاباد'],
  },
  {
    name: 'خوزستان',
    cities: ['اهواز', 'آبادان', 'خرمشهر', 'دزفول', 'اندیمشک', 'بهبهان'],
  },
  {
    name: 'البرز',
    cities: ['کرج', 'فردیس', 'نظرآباد', 'هشتگرد', 'اشتهارد'],
  },
  {
    name: 'گیلان',
    cities: ['رشت', 'انزلی', 'لاهیجان', 'آستارا', 'تالش'],
  },
  {
    name: 'مازندران',
    cities: ['ساری', 'بابل', 'آمل', 'قائم‌شهر', 'نوشهر', 'چالوس', 'تنکابن'],
  },
  {
    name: 'کرمان',
    cities: ['کرمان', 'رفسنجان', 'سیرجان', 'بم', 'جیرفت'],
  },
  {
    name: 'قم',
    cities: ['قم'],
  },
  {
    name: 'یزد',
    cities: ['یزد', 'میبد', 'اردکان', 'بافق'],
  },
  {
    name: 'کرمانشاه',
    cities: ['کرمانشاه', 'اسلام‌آباد غرب', 'هرسین', 'سنقر'],
  },
  {
    name: 'گلستان',
    cities: ['گرگان', 'گنبد کاووس', 'علی‌آباد', 'بندر ترکمن'],
  },
  {
    name: 'هرمزگان',
    cities: ['بندرعباس', 'میناب', 'قشم', 'کیش', 'بندر لنگه'],
  },
  {
    name: 'سیستان و بلوچستان',
    cities: ['زاهدان', 'زابل', 'چابهار', 'ایرانشهر'],
  },
  {
    name: 'مرکزی',
    cities: ['اراک', 'ساوه', 'خمین', 'محلات'],
  },
  {
    name: 'همدان',
    cities: ['همدان', 'ملایر', 'نهاوند', 'تویسرکان'],
  },
  {
    name: 'کردستان',
    cities: ['سنندج', 'سقز', 'مریوان', 'بانه'],
  },
  {
    name: 'اردبیل',
    cities: ['اردبیل', 'پارس‌آباد', 'مشگین‌شهر', 'خلخال'],
  },
  {
    name: 'زنجان',
    cities: ['زنجان', 'ابهر', 'خرمدره', 'قیدار'],
  },
  {
    name: 'قزوین',
    cities: ['قزوین', 'تاکستان', 'آبیک', 'بوئین‌زهرا'],
  },
  {
    name: 'لرستان',
    cities: ['خرم‌آباد', 'بروجرد', 'دورود', 'الیگودرز'],
  },
  {
    name: 'بوشهر',
    cities: ['بوشهر', 'برازجان', 'گناوه', 'کنگان'],
  },
  {
    name: 'چهارمحال و بختیاری',
    cities: ['شهرکرد', 'بروجن', 'فارسان', 'لردگان'],
  },
  {
    name: 'کردستان',
    cities: ['سنندج', 'سقز', 'مریوان', 'بانه'],
  },
  {
    name: 'سمنان',
    cities: ['سمنان', 'شاهرود', 'گرمسار', 'دامغان'],
  },
  {
    name: 'خراسان شمالی',
    cities: ['بجنورد', 'شیروان', 'اسفراین'],
  },
  {
    name: 'خراسان جنوبی',
    cities: ['بیرجند', 'قائن', 'فردوس', 'طبس'],
  },
  {
    name: 'ایلام',
    cities: ['ایلام', 'دهلران', 'آبدانان', 'مهران'],
  },
  {
    name: 'کهگیلویه و بویراحمد',
    cities: ['یاسوج', 'دوگنبدان', 'دهدشت'],
  },
];

export function getCitiesOfProvince(provinceName: string): string[] {
  const province = PROVINCES.find((p) => p.name === provinceName);
  return province?.cities ?? [];
}