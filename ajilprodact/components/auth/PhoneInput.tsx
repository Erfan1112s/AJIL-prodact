// components/auth/PhoneInput.tsx
// ورودی شماره موبایل با فیلتر خودکار

'use client';

import FormField from '@/components/auth/FormField';

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  error?: string;
}

export default function PhoneInput({
  value,
  onChange,
  disabled,
  autoFocus,
  error,
}: Props) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // فقط اعداد و حداکثر 11 رقم
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 11);
    onChange(cleaned);
  }

  return (
    <FormField
      label="شماره موبایل"
      name="phone"
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      placeholder="09xxxxxxxxx"
      dir="ltr"
      value={value}
      onChange={handleChange}
      disabled={disabled}
      autoFocus={autoFocus}
      error={error}
      hint="کد تایید به این شماره ارسال می‌شود."
      centered
      faNumeric
    />
  );
}