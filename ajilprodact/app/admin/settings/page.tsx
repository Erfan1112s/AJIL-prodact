// app/admin/settings/page.tsx
// تنظیمات فروشگاه

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'تنظیمات',
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-coffee-900 mb-1">تنظیمات</h1>
        <p className="text-xs text-coffee-500">
          تنظیمات عمومی فروشگاه
        </p>
      </div>

      <div className="rounded-2xl border border-coffee-200 bg-white p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-100 to-gold-200 mx-auto mb-4 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-gold-700">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>
        <h2 className="text-base font-bold text-coffee-900 mb-2">
          به‌زودی
        </h2>
        <p className="text-sm text-coffee-500 leading-7 max-w-md mx-auto mb-6">
          بخش تنظیمات در حال ساخت است. در نسخه‌های بعدی می‌توانید نام
          فروشگاه، اطلاعات تماس، لینک‌های شبکه‌های اجتماعی و هزینه
          ارسال را تنظیم کنید.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl mx-auto">
          <ComingSoonItem
            title="اطلاعات فروشگاه"
            desc="نام، لوگو، توضیحات"
          />
          <ComingSoonItem
            title="اطلاعات تماس"
            desc="تلفن، آدرس، ایمیل"
          />
          <ComingSoonItem
            title="شبکه‌های اجتماعی"
            desc="اینستاگرام، تلگرام"
          />
          <ComingSoonItem
            title="هزینه ارسال"
            desc="تعرفه اسنپ و پست"
          />
          <ComingSoonItem
            title="درگاه پرداخت"
            desc="زرین‌پال، IDPay"
          />
          <ComingSoonItem
            title="پیامک"
            desc="SMS.ir"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gold-200 bg-gold-50 p-4 flex items-start gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-700 shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <div>
          <div className="text-sm font-bold text-coffee-900 mb-1">
            تنظیمات فعلی
          </div>
          <div className="text-xs text-coffee-700 leading-6">
            در حال حاضر تنظیمات اصلی از طریق فایل{' '}
            <code className="bg-white px-1 rounded text-[10px]">.env.local</code>{' '}
            مدیریت می‌شود. برای تغییر درگاه پرداخت، پیامک یا کلیدهای امنیتی،
            از طریق SSH یا File Manager فایل را ویرایش کنید.
          </div>
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