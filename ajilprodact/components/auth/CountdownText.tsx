// components/auth/CountdownText.tsx
// نمایش شمارش معکوس یا دکمه ارسال مجدد

'use client';

interface Props {
  remaining: number;
  canResend: boolean;
  onResend: () => void;
  disabled?: boolean;
}

export default function CountdownText({
  remaining,
  canResend,
  onResend,
  disabled,
}: Props) {
  if (!canResend && remaining > 0) {
    return (
      <span className="text-xs text-coffee-500 fa-num">
        ارسال مجدد در {remaining.toLocaleString('fa-IR')} ثانیه
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onResend}
      disabled={disabled}
      className="text-xs text-gold-700 hover:text-gold-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      ارسال مجدد کد
    </button>
  );
}