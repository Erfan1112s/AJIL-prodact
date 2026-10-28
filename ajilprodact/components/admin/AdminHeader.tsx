// components/admin/AdminHeader.tsx
// هدر پنل ادمین با breadcrumb و user menu

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDownIcon,
  LogoutIcon,
  UserIcon,
} from '@/components/admin/icons';
import { logoutAction } from '@/app/admin/actions'; 
const ROUTE_MAP: Record<string, string> = {
  '/admin': 'داشبورد',
  '/admin/products': 'محصولات',
  '/admin/products/new': 'افزودن محصول',
  '/admin/categories': 'دسته‌بندی‌ها',
  '/admin/orders': 'سفارشات',
  '/admin/branches': 'شعبات و موجودی',
  '/admin/customers': 'مشتریان',
  '/admin/discounts': 'تخفیف‌ها',
  '/admin/settings': 'تنظیمات',
};

interface Props {
  // اطلاعات ادمین (از لایوت پاس داده می‌شود)
  admin: {
    fullName: string | null;
    username: string;
  };
}

export default function AdminHeader({ admin }: Props) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // بستن منو با کلیک بیرون
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ساخت breadcrumb
  function getBreadcrumb(): string {
    // اگر مسیر دقیقاً در نقشه بود
    if (ROUTE_MAP[pathname]) return ROUTE_MAP[pathname];

    // اگر مسیر شامل زیرمجموعه بود (مثل /admin/products/123/edit)
    for (const [key, value] of Object.entries(ROUTE_MAP)) {
      if (pathname.startsWith(key) && key !== '/admin') {
        return value;
      }
    }

    return 'پنل مدیریت';
  }

  return (
    <header className="sticky top-0 z-10 bg-cream-50/95 backdrop-blur-md border-b border-coffee-200">
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 pr-12 lg:pr-0">
          {/* آیکون خانه */}
          <Link
            href="/admin"
            className="hidden sm:flex w-8 h-8 rounded-lg bg-white border border-coffee-200 items-center justify-center text-coffee-500 hover:text-gold-700 hover:border-gold-400 transition-colors"
            aria-label="داشبورد"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M9 22V12h6v10" />
            </svg>
          </Link>

          <span className="hidden sm:block text-coffee-300">/</span>

          <h1 className="text-sm sm:text-base font-bold text-coffee-900">
            {getBreadcrumb()}
          </h1>
        </div>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-xl hover:bg-white border border-transparent hover:border-coffee-200 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-coffee-900 font-bold text-sm shadow-sm shrink-0">
              {admin.fullName?.charAt(0) ?? 'ا'}
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-coffee-900 leading-tight">
                {admin.fullName ?? 'ادمین'}
              </div>
              <div className="text-[10px] text-coffee-500 leading-tight">
                {admin.username}
              </div>
            </div>
            <ChevronDownIcon
              className={`w-3.5 h-3.5 text-coffee-400 transition-transform ${
                userMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown */}
          {userMenuOpen && (
            <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl border border-coffee-200 shadow-xl shadow-coffee-900/5 overflow-hidden animate-slide-down">
              {/* اطلاعات کاربر */}
              <div className="p-3 bg-cream-50 border-b border-coffee-100">
                <div className="text-xs text-coffee-500 mb-1">
                  وارد شده به عنوان
                </div>
                <div className="text-sm font-bold text-coffee-900">
                  {admin.fullName ?? 'ادمین سیستم'}
                </div>
                <div className="text-[11px] text-coffee-500">
                  {admin.username}
                </div>
              </div>

              {/* لینک‌ها */}
              <div className="p-1">
                <Link
                  href="/admin/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-coffee-700 hover:bg-cream-50 hover:text-coffee-900 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-coffee-400" />
                  حساب کاربری
                </Link>
              </div>

              {/* خروج */}
              <div className="p-1 border-t border-coffee-100">
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogoutIcon className="w-4 h-4" />
                    خروج از حساب
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}