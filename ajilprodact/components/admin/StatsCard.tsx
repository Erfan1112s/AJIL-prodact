// components/admin/StatsCard.tsx
// کارت آماری داشبورد

import Link from 'next/link';

interface Props {
  title: string;
  value: string;
  // مقدار دیروز برای محاسبه درصد
  previousValue?: number;
  // آیا مقدار الان از نوع پول است؟
  isCurrency?: boolean;
  icon: React.ReactNode;
  // رنگ پس‌زمینه آیکون
  iconBg: string;
  // رنگ آیکون
  iconColor: string;
  // لینک به صفحه مربوطه
  href?: string;
}

export default function StatsCard({
  title,
  value,
  previousValue,
  isCurrency,
  icon,
  iconBg,
  iconColor,
  href,
}: Props) {
  // محاسبه درصد تغییر
  const currentValue = isCurrency
    ? Number(value.replace(/[^\d]/g, '')) || 0
    : Number(value.replace(/[^\d]/g, '')) || 0;

  let changePercent: number | null = null;
  if (previousValue !== undefined) {
    if (previousValue === 0 && currentValue > 0) {
      changePercent = 100;
    } else if (previousValue > 0) {
      changePercent = Math.round(
        ((currentValue - previousValue) / previousValue) * 100
      );
    } else {
      changePercent = 0;
    }
  }

  const content = (
    <div className="group relative rounded-2xl border border-coffee-200 bg-white p-4 sm:p-5 hover:border-gold-400 hover:shadow-lg hover:shadow-coffee-900/5 transition-all duration-300">
      {/* ردیف بالا: آیکون و درصد تغییر */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor} group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>

        {changePercent !== null && (
          <div
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold fa-num ${
              changePercent > 0
                ? 'bg-brand-50 text-brand-700'
                : changePercent < 0
                  ? 'bg-red-50 text-red-700'
                  : 'bg-cream-100 text-coffee-600'
            }`}
          >
            {changePercent > 0 && (
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m18 15-6-6-6 6" />
              </svg>
            )}
            {changePercent < 0 && (
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            )}
            <span>
              {changePercent > 0 && '+'}
              {changePercent.toLocaleString('fa-IR')}٪
            </span>
          </div>
        )}
      </div>

      {/* ردیف وسط: عنوان */}
      <div className="text-xs text-coffee-500 mb-1.5">{title}</div>

      {/* ردیف پایین: مقدار */}
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className="text-xl sm:text-2xl font-bold text-coffee-900 fa-num leading-none">
          {value}
        </span>
        {isCurrency && (
          <span className="text-[10px] font-normal text-coffee-500">
            تومان
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}