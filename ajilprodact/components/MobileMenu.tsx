// components/MobileMenu.tsx
// منوی کشویی موبایل با state ساده

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MenuIcon, CloseIcon } from '@/components/icons';
import type { CategoryWithChildren } from '@/lib/types';

interface Props {
  categories: CategoryWithChildren[];
}

export default function MobileMenu({ categories }: Props) {
  const [open, setOpen] = useState(false);

  // وقتی منو باز است، اسکرول پس‌زمینه را قفل کن
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    // پاک‌سازی هنگام unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* دکمه باز کردن منو */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 hover:bg-ink-100 rounded-lg transition-colors"
        aria-label="منو"
      >
        <MenuIcon className="w-5 h-5 text-ink-700" />
      </button>

      {/* لایه تاریک پس‌زمینه */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink-900/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* پنل منو از راست می‌آید (چون RTL) */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white shadow-2xl lg:hidden transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-ink-200">
          <span className="font-bold text-ink-900">منو</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-2 hover:bg-ink-100 rounded-lg transition-colors"
            aria-label="بستن"
          >
            <CloseIcon className="w-5 h-5 text-ink-700" />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          <Link
            href="/products"
            onClick={() => setOpen(false)}
            className="block px-3 py-3 rounded-lg text-ink-800 hover:bg-brand-50 hover:text-brand-700 font-medium"
          >
            همه محصولات
          </Link>

          {categories.map((cat) => (
            <div key={cat.id}>
              <Link
                href={`/categories/${cat.slug}`}
                onClick={() => setOpen(false)}
                className="block px-3 py-3 rounded-lg text-ink-800 hover:bg-brand-50 hover:text-brand-700 font-medium"
              >
                {cat.name}
              </Link>

              {cat.children.length > 0 && (
                <div className="pr-4 mt-0.5 space-y-0.5">
                  {cat.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/categories/${child.slug}`}
                      onClick={() => setOpen(false)}
                      className="block px-3 py-2 rounded-lg text-sm text-ink-600 hover:bg-ink-50 hover:text-brand-700"
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}