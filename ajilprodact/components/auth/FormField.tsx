// components/auth/FormField.tsx
// فیلد فرم مشترک با پشتیبانی از label, hint, error, action

'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  hint?: string;
  centered?: boolean;
  faNumeric?: boolean;
  action?: {
    label: string;
    href: string;
  };
  // آیکون سمت چپ داخل input (اختیاری)
  leftIcon?: ReactNode;
}

const FormField = forwardRef<HTMLInputElement, Props>(function FormField(
  {
    label,
    error,
    hint,
    centered,
    faNumeric,
    action,
    leftIcon,
    className = '',
    id,
    name,
    ...inputProps
  },
  ref
) {
  const inputId = id ?? name;
  const hasError = Boolean(error);

  return (
    <div>
      {/* ردیف بالایی */}
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-coffee-800"
        >
          {label}
        </label>
        {action && (
          <a
            href={action.href}
            className="text-xs text-gold-700 hover:text-gold-800 transition-colors"
          >
            {action.label}
          </a>
        )}
      </div>

      {/* input با آیکون اختیاری */}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          name={name}
          {...inputProps}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          className={`w-full px-4 py-3 rounded-xl border bg-cream-50 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            hasError
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-coffee-200 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
          } ${centered ? 'text-center' : ''} ${
            faNumeric ? 'fa-num' : ''
          } ${leftIcon ? 'pl-11' : ''} ${className}`}
        />
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {leftIcon}
          </div>
        )}
      </div>

      {/* hint / error */}
      {hasError ? (
        <p
          id={`${inputId}-error`}
          className="text-xs text-red-600 mt-1.5 animate-fade-in"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${inputId}-hint`}
          className="text-xs text-coffee-500 mt-1.5 leading-5"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default FormField;