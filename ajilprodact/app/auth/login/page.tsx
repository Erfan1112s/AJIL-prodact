import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentCustomerId } from '@/lib/auth/customer-session';
import AuthShell from '@/components/auth/AuthShell';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'ورود',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ from?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { from } = await searchParams;
  const id = await getCurrentCustomerId();
  if (id) redirect(from ?? '/');

  return (
    <AuthShell
      title="ورود به حساب"
      subtitle="برای ادامه، شماره موبایل و رمز عبور خود را وارد کنید."
      footer={
        <>
          حساب ندارید؟{' '}
          <Link
            href="/auth/register"
            className="text-gold-700 font-medium hover:text-gold-800"
          >
            ثبت‌نام
          </Link>
        </>
      }
    >
      <LoginForm from={from} />
    </AuthShell>
  );
}