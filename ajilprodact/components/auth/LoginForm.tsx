// components/auth/LoginForm.tsx
// فرم ورود مشتری

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import FormField from '@/components/auth/FormField';
import PhoneInput from '@/components/auth/PhoneInput';
import Alert from '@/components/auth/Alert';
import { customerLoginAction } from '@/app/auth/actions';

interface Props {
  from?: string;
}

export default function LoginForm({ from }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canSubmit = phone.length === 11 && password.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    fd.set('phone', phone);
    fd.set('password', password);

    startTransition(async () => {
      const result = await customerLoginAction(fd);
      if (result.ok) {
        router.push(from ?? '/');
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PhoneInput
        value={phone}
        onChange={setPhone}
        disabled={isPending}
        autoFocus
      />

      <FormField
        label="رمز عبور"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isPending}
        action={{ label: 'فراموش کرده‌اید؟', href: '/auth/forgot-password' }}
      />

      {error && <Alert type="error">{error}</Alert>}

      <button
        type="submit"
        disabled={isPending || !canSubmit}
        className="w-full btn-gold py-3.5 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? 'در حال ورود...' : 'ورود'}
      </button>
    </form>
  );
}