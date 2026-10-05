// components/auth/SubmitButton.tsx
// دکمه ارسال فرم با حالت loading

import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: 'submit' | 'button';
  onClick?: () => void;
}

export default function SubmitButton({
  children,
  loading,
  disabled,
  type = 'submit',
  onClick,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className="w-full btn-gold py-3.5 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
    >
      {loading && (
        <svg
          className="w-4 h-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      )}
      <span>{loading ? 'در حال پردازش...' : children}</span>
    </button>
  );
}