// components/order/OrderStatusBadge.tsx
// نشان وضعیت سفارش با آیکون، رنگ و اندازه‌های مختلف

import type { OrderStatus } from '@/lib/types';

type BadgeSize = 'sm' | 'md' | 'lg';

interface StatusConfig {
  label: string;
  // توضیح کوتاه برای tooltip
  hint: string;
  // کلاس‌های رنگ
  className: string;
  // رنگ نقطه برای نوتیفیکیشن
  dotColor: string;
  // آیکون SVG
  icon: React.ReactNode;
}

const Icon = {
  Clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  Check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  ),
  Box: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
    </svg>
  ),
  Truck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4h13v12H1z" />
      <path d="M14 8h4l3 3v5h-7" />
      <circle cx="5.5" cy="18" r="1.5" />
      <circle cx="17.5" cy="18" r="1.5" />
    </svg>
  ),
  Home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),
  X: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
};

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  PENDING: {
    label: 'در انتظار پرداخت',
    hint: 'پرداخت این سفارش تکمیل نشده است',
    className: 'bg-gold-50 text-gold-800 border-gold-300',
    dotColor: 'bg-gold-500',
    icon: Icon.Clock,
  },
  PAID: {
    label: 'پرداخت شده',
    hint: 'پرداخت انجام شده و در انتظار آماده‌سازی است',
    className: 'bg-brand-50 text-brand-800 border-brand-300',
    dotColor: 'bg-brand-500',
    icon: Icon.Check,
  },
  PROCESSING: {
    label: 'در حال آماده‌سازی',
    hint: 'سفارش در حال بسته‌بندی است',
    className: 'bg-blue-50 text-blue-800 border-blue-200',
    dotColor: 'bg-blue-500',
    icon: Icon.Box,
  },
  SHIPPED: {
    label: 'ارسال شده',
    hint: 'سفارش تحویل شرکت ارسال شده است',
    className: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    dotColor: 'bg-indigo-500',
    icon: Icon.Truck,
  },
  DELIVERED: {
    label: 'تحویل داده شده',
    hint: 'سفارش به مشتری تحویل داده شده است',
    className: 'bg-brand-100 text-brand-900 border-brand-400',
    dotColor: 'bg-brand-600',
    icon: Icon.Home,
  },
  CANCELLED: {
    label: 'لغو شده',
    hint: 'این سفارش لغو شده است',
    className: 'bg-red-50 text-red-800 border-red-200',
    dotColor: 'bg-red-500',
    icon: Icon.X,
  },
};

interface Props {
  status: OrderStatus;
  size?: BadgeSize;
  showIcon?: boolean;
  showDot?: boolean;
}

export default function OrderStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  showDot = false,
}: Props) {
  const config = STATUS_CONFIG[status];

  const sizeClasses: Record<BadgeSize, { wrapper: string; icon: string; dot: string }> = {
    sm: {
      wrapper: 'gap-1 px-2.5 py-1 text-[11px]',
      icon: 'w-3 h-3',
      dot: 'w-1.5 h-1.5',
    },
    md: {
      wrapper: 'gap-1.5 px-3 py-1.5 text-xs',
      icon: 'w-3.5 h-3.5',
      dot: 'w-2 h-2',
    },
    lg: {
      wrapper: 'gap-2 px-4 py-2 text-sm',
      icon: 'w-4 h-4',
      dot: 'w-2.5 h-2.5',
    },
  };

  const sizeClass = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.className} ${sizeClass.wrapper}`}
      title={config.hint}
    >
      {showDot && (
        <span className={`rounded-full ${config.dotColor} ${sizeClass.dot} relative`}>
          <span
            className={`absolute inset-0 rounded-full ${config.dotColor} animate-ping opacity-60`}
          />
        </span>
      )}
      {showIcon && (
        <span className={sizeClass.icon}>{config.icon}</span>
      )}
      {config.label}
    </span>
  );
}