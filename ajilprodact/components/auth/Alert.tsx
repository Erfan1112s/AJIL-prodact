// components/auth/Alert.tsx
// پیام هشدار با سه حالت: error, success, info

import type { ReactNode } from 'react';

type AlertType = 'error' | 'success' | 'info';

interface Props {
  type: AlertType;
  children: ReactNode;
  title?: string;
}

const STYLES: Record<
  AlertType,
  { wrapper: string; icon: ReactNode }
> = {
  error: {
    wrapper: 'bg-red-50 border-red-200 text-red-700',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    ),
  },
  success: {
    wrapper: 'bg-brand-50 border-brand-200 text-brand-700',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  info: {
    wrapper: 'bg-gold-50 border-gold-200 text-coffee-700',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
  },
};

export default function Alert({ type, children, title }: Props) {
  const style = STYLES[type];

  return (
    <div
      className={`rounded-xl border p-3.5 text-sm flex items-start gap-2.5 animate-fade-in ${style.wrapper}`}
      role={type === 'error' ? 'alert' : 'status'}
    >
      <div className="shrink-0 mt-0.5">{style.icon}</div>
      <div className="flex-1 min-w-0 leading-6">
        {title && <div className="font-bold mb-0.5">{title}</div>}
        <div>{children}</div>
      </div>
    </div>
  );
}