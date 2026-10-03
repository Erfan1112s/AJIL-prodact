// components/icons.tsx
// آیکون‌های SVG درون‌خطی پروژه
// همه با stroke طراحی شده‌اند و رنگ را از currentColor می‌گیرند

import type { SVGProps } from 'react';

// تایپ مشترک برای همه آیکون‌ها
type IconProps = SVGProps<SVGSVGElement>;

// تنظیمات مشترک همه آیکون‌ها
const baseProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  viewBox: '0 0 24 24',
  strokeWidth: 1.8,
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

// ==========================================
// آیکون‌های ناوبری
// ==========================================

// سبد خرید
export function CartIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 4h2l2.5 12h11L21 8H6" />
    </svg>
  );
}

// منو (همبرگری)
export function MenuIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

// بستن
export function CloseIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

// جست‌وجو
export function SearchIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

// کاربر
export function UserIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

// ==========================================
// آیکون‌های ارتباط
// ==========================================

// تلفن
export function PhoneIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

// موقعیت مکانی
export function MapPinIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

// ==========================================
// آیکون‌های نشان و مزیت
// ==========================================

// ستاره
export function StarIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props} fill="currentColor" stroke="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
    </svg>
  );
}

// سپر (اطمینان)
export function ShieldIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 2l9 4v6c0 5.5-3.8 10.5-9 12-5.2-1.5-9-6.5-9-12V6l9-4z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

// کامیون (ارسال)
export function TruckIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M1 4h13v12H1z" />
      <path d="M14 8h4l3 3v5h-7" />
      <circle cx="5.5" cy="18" r="1.5" />
      <circle cx="17.5" cy="18" r="1.5" />
    </svg>
  );
}

// برگ (طبیعی)
export function LeafIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M11 20A7 7 0 0 1 4 13c0-7 6-11 16-11 0 10-4 16-11 16z" />
      <path d="M11 20c0-5 3-9 7-11" />
    </svg>
  );
}

// ==========================================
// آیکون‌های جهت‌دار (RTL)
// ==========================================

// فلش چپ
export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

// فلش راست
export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

// ==========================================
// آیکون‌های ویژه محصول
// ==========================================

// NFC
export function NfcIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M6 8a8 8 0 0 1 0 8" />
      <path d="M10 5.5a12 12 0 0 1 0 13" />
      <path d="M14 3a16 16 0 0 1 0 18" />
      <path d="M18 0.5v23" />
    </svg>
  );
}

// قلب علاقه‌مندی
// با پراپ filled برای دو حالت: توخالی و پرشده
export function HeartIcon({
  filled = false,
  ...props
}: IconProps & { filled?: boolean }) {
  return (
    <svg
      {...baseProps}
      {...props}
      // اگر filled بود، داخل آیکون را با currentColor پر کن
      // اگر نبود، فقط خط دور داشته باشد
      fill={filled ? 'currentColor' : 'none'}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

// بسته‌بندی (تعداد وزن‌ها)
export function PackageIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

// آیکون تیک - برای نمایش تایید در دکمه افزودن به سبد
export function CheckIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}