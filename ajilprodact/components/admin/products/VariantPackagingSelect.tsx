// components/admin/products/VariantPackagingSelect.tsx
// انتخاب نوع بسته‌بندی واریانت

'use client';

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

// انواع پرکاربرد بسته‌بندی
export const PACKAGING_TYPES: Array<{ value: string; label: string }> = [
  { value: 'standard', label: 'معمولی' },
  { value: 'plastic', label: 'کیسه پلاستیکی' },
  { value: 'paper', label: 'کیسه کاغذی' },
  { value: 'box', label: 'جعبه' },
  { value: 'gift_box', label: 'جعبه هدیه' },
  { value: 'can', label: 'قوطی حلبی' },
  { value: 'vacuum', label: 'وکیوم' },
  { value: 'jar', label: 'شیشه' },
];

// برچسب خوانا برای نوع بسته‌بندی
export function getPackagingLabel(
  type: string,
  customLabel: string | null | undefined
): string {
  if (customLabel && customLabel.trim()) return customLabel.trim();
  const found = PACKAGING_TYPES.find((t) => t.value === type);
  return found?.label ?? type;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function VariantPackagingSelect({
  value,
  onChange,
  disabled,
}: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-2.5 py-2 rounded-lg border border-coffee-200 bg-white text-xs outline-none focus:border-gold-500"
    >
      {PACKAGING_TYPES.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ))}
    </select>
  );
}