// components/auth/PasswordField.tsx
// فیلد رمز عبور با قابلیت نمایش/مخفی و نشانگر قدرت

'use client';

import { forwardRef, useState } from 'react';
import {
  getPasswordStrength,
  PASSWORD_MIN_LENGTH,
} from '@/lib/auth/validators';
import FormField from '@/components/auth/FormField';

interface Props {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string | null;
  showStrength?: boolean;
  autoComplete?: 'new-password' | 'current-password';
  autoFocus?: boolean;
  name?: string;
}

const EyeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <path d="m2 2 20 20" />
  </svg>
);

const PasswordField = forwardRef<HTMLInputElement, Props>(
  function PasswordField(
    {
      label = 'رمز عبور',
      value,
      onChange,
      disabled,
      error,
      showStrength = false,
      autoComplete = 'new-password',
      autoFocus,
      name = 'password',
    },
    ref
  ) {
    const [visible, setVisible] = useState(false);

    const strength = showStrength ? getPasswordStrength(value) : null;

    // رنگ نوار پر شده بر اساس قدرت
    const getFillGradient = (score: number): string => {
      switch (score) {
        case 1:
          return 'from-red-500 to-red-400';
        case 2:
          return 'from-gold-500 to-gold-400';
        case 3:
          return 'from-brand-500 to-gold-400';
        case 4:
          return 'from-brand-600 to-brand-500';
        default:
          return 'from-cream-200 to-cream-200';
      }
    };

    // درصد عرض نوار پر شده
    const getFillWidth = (score: number): string => {
      return `${(score / 4) * 100}%`;
    };

    return (
      <div>
        <FormField
          ref={ref}
          label={label}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          dir="ltr"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          error={error}
          hint={
            showStrength && !error
              ? `حداقل ${PASSWORD_MIN_LENGTH} کاراکتر`
              : undefined
          }
          leftIcon={
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setVisible((v) => !v)}
              className="text-coffee-400 hover:text-coffee-700 transition-colors pointer-events-auto"
              aria-label={visible ? 'مخفی کردن رمز' : 'نمایش رمز'}
            >
              {visible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          }
        />

        {/* نشانگر قدرت - یک خط پیوسته */}
        {showStrength && value.length > 0 && strength && strength.label && (
          <div className="mt-2.5 animate-fade-in">
            <div className="flex items-center gap-3">
              {/* نوار پایه */}
              <div className="flex-1 h-1.5 rounded-full bg-cream-200 overflow-hidden">
                {/* نوار پر شده */}
                <div
                  className={`h-full rounded-full bg-gradient-to-l transition-all duration-500 ${getFillGradient(
                    strength.score
                  )}`}
                  style={{ width: getFillWidth(strength.score) }}
                />
              </div>

              {/* برچسب */}
              <span
                className={`text-[11px] font-bold shrink-0 ${
                  strength.score >= 3
                    ? 'text-brand-700'
                    : strength.score === 2
                      ? 'text-gold-700'
                      : 'text-red-600'
                }`}
              >
                {strength.label}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default PasswordField;