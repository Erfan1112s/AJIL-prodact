// components/auth/AuthShell.tsx
// پوسته مشترک صفحات احراز هویت: لوگو، عنوان، کارت، پانویس

import Link from 'next/link';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: Props) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gold-50 via-cream-50 to-coffee-50 p-5 py-12">
      <div className="w-full max-w-md">
        {/* لوگو و عنوان */}
        <header className="text-center mb-8 animate-fade-in">
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-5 group"
            aria-label="بازگشت به صفحه اصلی"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-coffee-900 text-2xl font-bold shadow-lg shadow-gold-500/30 group-hover:scale-105 transition-transform">
              آ
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-coffee-900 mb-2">{title}</h1>
          <p className="text-sm text-coffee-500 leading-6 max-w-xs mx-auto">
            {subtitle}
          </p>
        </header>

        {/* کارت فرم */}
        <section className="rounded-3xl border border-coffee-200 bg-white shadow-xl shadow-coffee-900/5 p-6 sm:p-8 animate-fade-up">
          {children}
        </section>

        {/* پانویس */}
        {footer && (
          <footer className="mt-6 text-center text-sm text-coffee-500 animate-fade-in">
            {footer}
          </footer>
        )}
      </div>
    </main>
  );
}