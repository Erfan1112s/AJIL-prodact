// components/auth/OtpInput.tsx
// ورودی کد OTP با شش باکس جداگانه و ناوبری کامل صفحه‌کلید

'use client';

import {
  useRef,
  useEffect,
  type ChangeEvent,
  type KeyboardEvent,
  type ClipboardEvent,
} from 'react';
import { OTP_LENGTH } from '@/lib/auth/validators';

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  error?: boolean;
}

export default function OtpInput({
  value,
  onChange,
  disabled,
  autoFocus = true,
  error = false,
}: Props) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const digits = Array.from(
    { length: OTP_LENGTH },
    (_, i) => value[i] ?? ''
  );

  useEffect(() => {
    if (autoFocus) inputRefs.current[0]?.focus();
  }, [autoFocus]);

  function setDigit(index: number, digit: string) {
    const next = [...digits];
    next[index] = digit;
    onChange(next.join('').slice(0, OTP_LENGTH));
  }

  function handleChange(index: number, e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '');

    if (!raw) {
      setDigit(index, '');
      return;
    }

    // اگر چند رقم پیست شد
    if (raw.length > 1) {
      const clean = raw.slice(0, OTP_LENGTH - index);
      const next = [...digits];
      for (let i = 0; i < clean.length; i++) {
        next[index + i] = clean[i];
      }
      onChange(next.join('').slice(0, OTP_LENGTH));
      const nextIndex = Math.min(index + clean.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    setDigit(index, raw);

    // رفتن به باکس بعدی
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
    index: number,
    e: KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        setDigit(index - 1, '');
      } else {
        setDigit(index, '');
      }
    } else if (e.key === 'ArrowLeft' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'ArrowRight' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH);

    if (!pasted) return;

    onChange(pasted);
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  }

  return (
    <div
      className="flex gap-2 sm:gap-3 justify-center"
      onPaste={handlePaste}
      dir="ltr"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          aria-label={`رقم ${index + 1} از ${OTP_LENGTH}`}
          className={`w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border-2 bg-cream-50 outline-none transition-all disabled:opacity-50 fa-num ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-coffee-200 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
          }`}
        />
      ))}
    </div>
  );
}