import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentCustomerId } from '@/lib/auth/customer-session';
import AuthShell from '@/components/auth/AuthShell';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'بازیابی رمز عبور',
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {
  const id = await getCurrentCustomerId();
  if (id) redirect('/profile');

  return (
    <AuthShell
      title="بازیابی رمز عبور"
      subtitle="با تایید شماره موبایل، رمز عبور جدید تنظیم کنید."
      footer={
        <Link
          href="/auth/login"
          className="text-gold-700 font-medium hover:text-gold-800"
        >
          بازگشت به ورود
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}