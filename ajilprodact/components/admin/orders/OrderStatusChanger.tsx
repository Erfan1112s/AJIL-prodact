// components/admin/orders/OrderStatusChanger.tsx
// تغییر وضعیت سفارش با اعتبارسنجی

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@/components/auth/Alert';
import { changeOrderStatusAction } from '@/app/admin/(protected)/orders/actions';
import type { OrderStatus } from '@/lib/types';

interface Props {
  orderNumber: string;
  currentStatus: OrderStatus;
}

const STATUS_INFO: Record<
  OrderStatus,
  { label: string; description: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: 'در انتظار پرداخت',
    description: 'هنوز پرداخت انجام نشده',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  PAID: {
    label: 'پرداخت شده',
    description: 'آماده شروع آماده‌سازی',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  PROCESSING: {
    label: 'در حال آماده‌سازی',
    description: 'سفارش در حال بسته‌بندی',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
      </svg>
    ),
  },
  SHIPPED: {
    label: 'ارسال شده',
    description: 'تحویل به شرکت ارسال',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 4h13v12H1z" />
        <path d="M14 8h4l3 3v5h-7" />
        <circle cx="5.5" cy="18" r="1.5" />
        <circle cx="17.5" cy="18" r="1.5" />
      </svg>
    ),
  },
  DELIVERED: {
    label: 'تحویل داده شده',
    description: 'سفارش تکمیل شد',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
  },
  CANCELLED: {
    label: 'لغو شده',
    description: 'این سفارش لغو شده است',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    ),
  },
};

const STATUS_ORDER: OrderStatus[] = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
];

export default function OrderStatusChanger({
  orderNumber,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // گزینه‌های مجاز
  const allowedStatuses = getAllowedStatuses(currentStatus);

  function handleChange(newStatus: OrderStatus) {
    if (newStatus === currentStatus) return;

    setError(null);
    setSuccess(false);

    // تایید برای لغو
    if (newStatus === 'CANCELLED') {
      if (
        !window.confirm(
          'آیا از لغو این سفارش مطمئن هستید؟ این عمل قابل بازگشت است ولی اطلاع به مشتری ارسال می‌شود.'
        )
      ) {
        return;
      }
    }

    startTransition(async () => {
      const result = await changeOrderStatusAction(orderNumber, newStatus);
      if (result.ok) {
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 2500);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-coffee-200 bg-white p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-gold-100 flex items-center justify-center text-gold-700">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M2 12h20" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-coffee-900">
            تغییر وضعیت سفارش
          </h3>
          <p className="text-[11px] text-coffee-500">
            وضعیت فعلی: {STATUS_INFO[currentStatus].label}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {success && (
        <div className="mb-4">
          <Alert type="success">وضعیت با موفقیت تغییر کرد</Alert>
        </div>
      )}

      <div className="space-y-2">
        {allowedStatuses.map((status) => {
          const info = STATUS_INFO[status];
          const isCurrent = status === currentStatus;
          const isCancel = status === 'CANCELLED';

          return (
            <button
              key={status}
              type="button"
              onClick={() => handleChange(status)}
              disabled={isPending || isCurrent}
              className={`w-full text-right p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                isCurrent
                  ? 'border-gold-500 bg-gold-50 cursor-default'
                  : isCancel
                    ? 'border-red-200 bg-white hover:border-red-400 hover:bg-red-50'
                    : 'border-coffee-200 bg-white hover:border-gold-400 hover:bg-gold-50/40'
              } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isCurrent
                    ? 'bg-gold-500 text-coffee-900'
                    : isCancel
                      ? 'bg-red-100 text-red-700'
                      : 'bg-cream-100 text-coffee-600'
                }`}
              >
                {info.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm font-bold ${
                    isCancel ? 'text-red-700' : 'text-coffee-900'
                  }`}
                >
                  {info.label}
                  {isCurrent && (
                    <span className="text-[10px] font-normal text-coffee-500 mr-2">
                      (وضعیت فعلی)
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-coffee-500 mt-0.5">
                  {info.description}
                </div>
              </div>
              {!isCurrent && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={isCancel ? 'text-red-400' : 'text-coffee-300'}
                >
                  <path d="M19 12H5" />
                  <path d="m12 19-7-7 7-7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {isPending && (
        <div className="mt-3 text-center text-xs text-coffee-500">
          در حال اعمال تغییر...
        </div>
      )}
    </div>
  );
}

// ==========================================
// گزینه‌های مجاز بر اساس وضعیت فعلی
// ==========================================

function getAllowedStatuses(current: OrderStatus): OrderStatus[] {
  // لغو شده: هیچ تغییری مجاز نیست
  if (current === 'CANCELLED') {
    return ['CANCELLED'];
  }

  // تحویل شده: فقط لغو مجاز نیست
  if (current === 'DELIVERED') {
    return ['DELIVERED'];
  }

  const currentIdx = STATUS_ORDER.indexOf(current);

  const result: OrderStatus[] = [];

  // یک پله عقب
  if (currentIdx > 0) {
    result.push(STATUS_ORDER[currentIdx - 1]);
  }

  // خودش
  result.push(current);

  // یک پله جلو
  if (currentIdx < STATUS_ORDER.length - 1) {
    result.push(STATUS_ORDER[currentIdx + 1]);
  }

  // لغو
  result.push('CANCELLED');

  return result;
}