import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentCustomerId } from '@/lib/auth/customer-session';
import AuthShell from '@/components/auth/AuthShell';
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'ثبت‌نام',
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const id = await getCurrentCustomerId();
  if (id) redirect('/profile');

  return (
    <AuthShell
      title="ساخت حساب جدید"
      subtitle="برای ثبت‌نام، اطلاعات خود را در سه مرحله وارد کنید."
      footer={
        <>
          حساب دارید؟{' '}
          <Link
            href="/auth/login"
            className="text-gold-700 font-medium hover:text-gold-800"
          >
            ورود
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}