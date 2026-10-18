// app/admin/discounts/page.tsx
// کدهای تخفیف

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'تخفیف‌ها',
  robots: { index: false, follow: false },
};

export default function DiscountsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-coffee-900 mb-1">
          کدهای تخفیف
        </h1>
        <p className="text-xs text-coffee-500">
          مدیریت کدهای تخفیف و کمپین‌های مناسبتی
        </p>
      </div>

      <div className="rounded-2xl border border-coffee-200 bg-white p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-100 to-gold-200 mx-auto mb-4 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-gold-700">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <circle cx="7" cy="7" r="1.5" />
          </svg>
        </div>
        <h2 className="text-base font-bold text-coffee-900 mb-2">
          به‌زودی
        </h2>
        <p className="text-sm text-coffee-500 leading-7 max-w-md mx-auto mb-6">
          بخش تخفیف‌ها در حال ساخت است. در نسخه‌های بعدی می‌توانید
          کدهای تخفیف، کمپین‌های مناسبتی و تخفیف‌های گروهی بسازید.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
          <ComingSoonItem
            title="کد تخفیف درصدی"
            desc="مثال: ۲۰٪ تخفیف با کد نوروز"
          />
          <ComingSoonItem
            title="کد تخفیف ثابت"
            desc="مثال: ۱۰۰,۰۰۰ تومان تخفیف"
          />
          <ComingSoonItem
            title="تخفیف مناسبتی"
            desc="فعال‌سازی خودکار در تاریخ"
          />
          <ComingSoonItem
            title="کمپین مشتریان"
            desc="ارسال کد به گروه خاص"
          />
        </div>
      </div>
    </div>
  );
}

function ComingSoonItem({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-coffee-100 bg-cream-50/50 p-3 text-right">
      <div className="text-xs font-bold text-coffee-700 mb-0.5">
        {title}
      </div>
      <div className="text-[10px] text-coffee-500">{desc}</div>
    </div>
  );
}