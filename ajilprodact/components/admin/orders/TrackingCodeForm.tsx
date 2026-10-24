// components/admin/orders/TrackingCodeForm.tsx
// فرم ثبت کد رهگیری ارسال

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@/components/auth/Alert';
import { saveTrackingCodeAction } from '@/app/admin/(protected)/orders/actions';

interface Props {
  orderNumber: string;
  initialCode: string | null;
}

export default function TrackingCodeForm({
  orderNumber,
  initialCode,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [code, setCode] = useState(initialCode ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await saveTrackingCodeAction(orderNumber, code);
      if (result.ok) {
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 2000);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4h13v12H1z" />
            <path d="M14 8h4l3 3v5h-7" />
            <circle cx="5.5" cy="18" r="1.5" />
            <circle cx="17.5" cy="18" r="1.5" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-coffee-900">
            کد رهگیری ارسال
          </h3>
          <p className="text-[11px] text-coffee-500">
            برای پیگیری مشتری
          </p>
        </div>
      </div>

      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.slice(0, 50))}
        disabled={isPending}
        dir="ltr"
        placeholder="مثال: 1234567890123456"
        className="w-full px-4 py-3 rounded-xl border border-coffee-200 bg-cream-50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all fa-num text-center"
      />

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">ذخیره شد</Alert>}

      <button
        type="submit"
        disabled={isPending || code.trim() === (initialCode ?? '')}
        className="w-full py-2.5 rounded-xl btn-gold text-sm font-bold disabled:opacity-60"
      >
        {isPending ? 'در حال ذخیره...' : 'ذخیره کد رهگیری'}
      </button>
    </form>
  );
}