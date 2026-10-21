// components/admin/AdminSidebar.tsx
// سایدبار پنل ادمین

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DashboardIcon,
  BoxIcon,
  FolderIcon,
  ReceiptIcon,
  StoreIcon,
  UsersIcon,
  TagIcon,
  MessageSquareIcon,
  SettingsIcon,
  MenuIcon,
  CloseIcon,
} from '@/components/admin/icons';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/admin',
    label: 'داشبورد',
    icon: <DashboardIcon className="w-5 h-5" />,
  },
  {
    href: '/admin/products',
    label: 'محصولات',
    icon: <BoxIcon className="w-5 h-5" />,
  },
  {
    href: '/admin/categories',
    label: 'دسته‌بندی‌ها',
    icon: <FolderIcon className="w-5 h-5" />,
  },
  {
    href: '/admin/orders',
    label: 'سفارشات',
    icon: <ReceiptIcon className="w-5 h-5" />,
  },
  {
    href: '/admin/branches',
    label: 'شعبات و موجودی',
    icon: <StoreIcon className="w-5 h-5" />,
  },
  {
    href: '/admin/customers',
    label: 'مشتریان',
    icon: <UsersIcon className="w-5 h-5" />,
  },
  {
    href: '/admin/reviews',
    label: 'نظرات کاربران',
    icon: <MessageSquareIcon className="w-5 h-5" />,
  },
  {
    href: '/admin/discounts',
    label: 'تخفیف‌ها',
    icon: <TagIcon className="w-5 h-5" />,
  },
  {
    href: '/admin/settings',
    label: 'تنظیمات',
    icon: <SettingsIcon className="w-5 h-5" />,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  function isActive(href: string): boolean {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <>
      <div className="h-16 flex items-center px-5 border-b border-coffee-800/60">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-coffee-900 font-bold shadow-lg shadow-gold-500/20 group-hover:scale-105 transition-transform">
            آ
          </div>
          <div className="min-w-0">
            <div className="font-bold text-cream-50 text-sm leading-tight">
              پنل مدیریت
            </div>
            <div className="text-[10px] text-coffee-400 leading-tight">
              آجیل و خشکبار
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  active
                    ? 'bg-gold-500/15 text-cream-50'
                    : 'text-coffee-200 hover:bg-coffee-800/60 hover:text-cream-50'
                }`}
              >
                {active && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full bg-gradient-to-b from-gold-400 to-gold-600" />
                )}

                <span
                  className={`shrink-0 transition-colors ${
                    active
                      ? 'text-gold-400'
                      : 'text-coffee-400 group-hover:text-gold-400'
                  }`}
                >
                  {item.icon}
                </span>

                <span className="flex-1 text-sm font-medium">
                  {item.label}
                </span>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-gold-500 text-coffee-900 text-[10px] font-bold flex items-center justify-center fa-num">
                    {item.badge.toLocaleString('fa-IR')}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-3 border-t border-coffee-800/60">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-coffee-400 hover:text-gold-400 hover:bg-coffee-800/60 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
          </svg>
          مشاهده سایت
        </Link>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-30 w-11 h-11 rounded-xl bg-coffee-900 text-cream-100 flex items-center justify-center shadow-xl shadow-coffee-900/20 hover:bg-coffee-800 transition-colors"
        aria-label="باز کردن منو"
      >
        <MenuIcon className="w-5 h-5" />
      </button>

      <aside className="hidden lg:flex fixed top-0 right-0 bottom-0 w-64 bg-gradient-to-b from-coffee-900 to-coffee-800 flex-col z-20">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-coffee-900/60 backdrop-blur-sm lg:hidden animate-fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          <aside className="fixed top-0 right-0 bottom-0 z-50 w-72 max-w-[85vw] bg-gradient-to-b from-coffee-900 to-coffee-800 flex flex-col shadow-2xl lg:hidden animate-slide-down">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 left-4 w-9 h-9 rounded-lg bg-coffee-800/80 text-cream-100 flex items-center justify-center hover:bg-coffee-700 transition-colors"
              aria-label="بستن منو"
            >
              <CloseIcon className="w-4 h-4" />
            </button>

            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}