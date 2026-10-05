// components/admin/LoginForm.tsx
// فرم لاگین ادمین

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/app/admin/login/actions';

interface Props {
  from?: string;
}

export default function LoginForm({ from }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      const result = await loginAction(formData);

      if (result.ok) {
        // موفق: به مسیر مقصد برو
        router.push(from ?? '/admin');
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-3xl border border-coffee-200 bg-white shadow-xl shadow-coffee-900/5 p-6 sm:p-8">
      <form action={handleSubmit} className="space-y-4">
        {/* نام کاربری */}
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-coffee-800 mb-2"
          >
            نام کاربری
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            autoComplete="username"
            autoFocus
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl border border-coffee-200 bg-cream-50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all disabled:opacity-50"
            placeholder="admin"
          />
        </div>

        {/* رمز عبور */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-coffee-800 mb-2"
          >
            رمز عبور
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl border border-coffee-200 bg-cream-50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all disabled:opacity-50"
            placeholder="••••••••"
          />
        </div>

        {/* پیام خطا */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* دکمه */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full btn-gold py-3.5 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {isPending ? 'در حال ورود...' : 'ورود به پنل'}
        </button>
      </form>
    </div>
  );
}