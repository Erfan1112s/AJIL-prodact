// components/order/OrderStatusStepper.tsx
// نمایش پیشرفت سفارش در قالب استپر افقی

import type { OrderStatus } from '@/lib/types';

interface Step {
  key: OrderStatus;
  label: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    key: 'PAID',
    label: 'پرداخت',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    key: 'PROCESSING',
    label: 'آماده‌سازی',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
      </svg>
    ),
  },
  {
    key: 'SHIPPED',
    label: 'ارسال',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 4h13v12H1z" />
        <path d="M14 8h4l3 3v5h-7" />
        <circle cx="5.5" cy="18" r="1.5" />
        <circle cx="17.5" cy="18" r="1.5" />
      </svg>
    ),
  },
  {
    key: 'DELIVERED',
    label: 'تحویل',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
];

interface Props {
  currentStatus: OrderStatus;
  deliveryMethod: 'SHIPPING' | 'PICKUP';
}

export default function OrderStatusStepper({
  currentStatus,
  deliveryMethod,
}: Props) {
  // اگر لغو شده، استپر را نشان نده
  if (currentStatus === 'CANCELLED') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </div>
        <div>
          <div className="font-bold text-sm text-red-900 mb-0.5">
            این سفارش لغو شده است
          </div>
          <div className="text-xs text-red-700 leading-5">
            در صورتی که مبلغی پرداخت کرده‌اید، تا ۷۲ ساعت به حساب شما
            بازخواهد گشت.
          </div>
        </div>
      </div>
    );
  }

  // اگر در انتظار پرداخت است
  if (currentStatus === 'PENDING') {
    return (
      <div className="rounded-2xl border border-gold-200 bg-gradient-to-l from-gold-50 to-cream-50 p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gold-500 text-coffee-900 flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>
        <div>
          <div className="font-bold text-sm text-coffee-900 mb-0.5">
            در انتظار پرداخت
          </div>
          <div className="text-xs text-coffee-600 leading-5">
            پرداخت این سفارش تکمیل نشده است. تا زمانی که پرداخت انجام
            نشود، سفارش آماده‌سازی نخواهد شد.
          </div>
        </div>
      </div>
    );
  }

  // محاسبه اندیس فعلی
  const currentIndex = STEPS.findIndex((s) => s.key === currentStatus);
  // اگر PAID باشد، index=0. یعنی مرحله اول انجام شده
  // اگر PROCESSING باشد، index=1. یعنی دو مرحله انجام شده
  const activeIndex = currentIndex;

  return (
    <div className="rounded-2xl border border-coffee-200 bg-white p-6 sm:p-8">
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((step, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;
          const isPending = index > activeIndex;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* خود مرحله */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                      : isActive
                        ? 'bg-gold-500 text-coffee-900 shadow-lg shadow-gold-500/40 ring-4 ring-gold-100'
                        : 'bg-cream-100 text-coffee-400'
                  }`}
                >
                  <div className="w-5 h-5">{step.icon}</div>

                  {/* انیمیشن برای مرحله فعال */}
                  {isActive && (
                    <span className="absolute inset-0 rounded-full bg-gold-400 animate-ping opacity-30" />
                  )}
                </div>

                <div
                  className={`mt-2.5 text-[11px] font-bold whitespace-nowrap ${
                    isCompleted
                      ? 'text-brand-700'
                      : isActive
                        ? 'text-coffee-900'
                        : 'text-coffee-400'
                  }`}
                >
                  {step.label}
                </div>
              </div>

              {/* خط اتصال */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 mx-2 sm:mx-3 h-0.5 bg-cream-200 rounded-full overflow-hidden relative top-[-14px]">
                  <div
                    className={`h-full bg-gradient-to-l transition-all duration-500 ${
                      index < activeIndex
                        ? 'from-brand-500 to-brand-400 w-full'
                        : 'w-0'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* توضیح مرحله فعلی */}
      <div className="mt-6 pt-5 border-t border-coffee-100 text-center">
        <div className="text-xs text-coffee-500 leading-6">
          {currentStatus === 'PAID' &&
            'پرداخت شما با موفقیت انجام شد. به‌زودی آماده‌سازی سفارش شروع می‌شود.'}
          {currentStatus === 'PROCESSING' &&
            (deliveryMethod === 'PICKUP'
              ? 'سفارش شما در حال آماده‌سازی است. پس از آماده شدن، برای تحویل حضوری اطلاع‌رسانی می‌شود.'
              : 'سفارش شما در حال بسته‌بندی است. پس از تحویل به شرکت ارسال، کد رهگیری برای شما ارسال می‌شود.')}
          {currentStatus === 'SHIPPED' &&
            (deliveryMethod === 'PICKUP'
              ? 'سفارش شما آماده تحویل از شعبه است. برای دریافت مراجعه کنید.'
              : 'سفارش شما ارسال شده است. از طریق کد رهگیری می‌توانید مسیر ارسال را دنبال کنید.')}
          {currentStatus === 'DELIVERED' &&
            (deliveryMethod === 'PICKUP'
              ? 'سفارش شما تحویل داده شده است. از خرید شما سپاسگزاریم.'
              : 'سفارش شما تحویل داده شده است. از خرید شما سپاسگزاریم.')}
        </div>
      </div>
    </div>
  );
}