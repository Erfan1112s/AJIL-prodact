// app/admin/login/page.tsx
// صفحه لاگین پنل ادمین

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth/session';
import LoginForm from '@/components/admin/LoginForm';
import Container from '@/components/Container';

export const metadata: Metadata = {
  title: 'ورود به پنل مدیریت',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ from?: string }>;
}

export default async function AdminLoginPage({ searchParams }: Props) {
  const { from } = await searchParams;

  // اگر از قبل لاگین است، به داشبورد برود
  const userId = await getCurrentUserId();
  if (userId) {
    redirect(from ?? '/admin');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-coffee-50 via-cream-50 to-gold-50 p-5">
      <Container measure="narrow" className="w-full">
        <div className="max-w-md mx-auto">
          {/* لوگو */}
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 items-center justify-center text-coffee-900 text-2xl font-bold shadow-lg shadow-gold-500/30 mb-4">
              آ
            </div>
            <h1 className="text-2xl font-bold text-coffee-900 mb-1">
              پنل مدیریت
            </h1>
            <p className="text-sm text-coffee-500">
              برای ورود، نام کاربری و رمز عبور خود را وارد کنید
            </p>
          </div>

          {/* فرم */}
          <LoginForm from={from} />
        </div>
      </Container>
    </main>
  );
}