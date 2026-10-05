// components/CustomerMenuButton.tsx
// دکمه حساب کاربری در هدر

'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserIcon } from '@/components/icons';
import { customerLogoutAction } from '@/app/auth/actions';

export default function CustomerMenuButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [phone, setPhone] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  // چک لاگین بودن با فراخوانی API سمت سرور
  useEffect(() => {
    setMounted(true);
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setPhone(data.customer.phone);
      })
      .catch(() => {});
  }, []);

  function handleLogout() {
    startTransition(async () => {
      await customerLogoutAction();
      setPhone(null);
      setOpen(false);
      router.push('/');
      router.refresh();
    });
  }

  if (!mounted) {
    return (
      <div className="p-2">
        <UserIcon className="w-5 h-5 text-coffee-700" />
      </div>
    );
  }

  // مهمان
  if (!phone) {
    return (
      <Link
        href="/auth/login"
        className="p-2 hover:bg-coffee-100 rounded-lg transition-colors"
        aria-label="ورود"
      >
        <UserIcon className="w-5 h-5 text-coffee-700" />
      </Link>
    );
  }

  // لاگین
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-2 hover:bg-coffee-100 rounded-lg transition-colors flex items-center gap-1"
        aria-label="حساب کاربری"
      >
        <UserIcon className="w-5 h-5 text-gold-600" />
        <span className="hidden sm:block text-xs text-coffee-700 fa-num" dir="ltr">
          {phone}
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-xl border border-coffee-200 shadow-xl z-50 overflow-hidden">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-coffee-800 hover:bg-cream-100 transition-colors"
            >
              حساب کاربری
            </Link>
            <Link
              href="/profile/orders"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-coffee-800 hover:bg-cream-100 transition-colors border-t border-coffee-100"
            >
              سفارش‌های من
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isPending}
              className="w-full text-right px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-coffee-100 disabled:opacity-50"
            >
              خروج از حساب
            </button>
          </div>
        </>
      )}
    </div>
  );
}