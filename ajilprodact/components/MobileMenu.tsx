// components/MobileMenu.tsx
// منوی کشویی موبایل با پالت قهوه‌ای و طلایی

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

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 hover:bg-coffee-100 rounded-lg transition-colors"
        aria-label="منو"
      >
        <MenuIcon className="w-5 h-5 text-coffee-700" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-coffee-900/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-cream-50 shadow-2xl lg:hidden transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-coffee-200 bg-coffee-800">
          <span className="font-bold text-gold-400">منو</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-2 hover:bg-coffee-700 rounded-lg transition-colors"
            aria-label="بستن"
          >
            <CloseIcon className="w-5 h-5 text-cream-100" />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          <Link
            href="/products"
            onClick={() => setOpen(false)}
            className="block px-3 py-3 rounded-lg text-coffee-800 hover:bg-gold-50 hover:text-gold-700 font-medium transition-colors"
          >
            همه محصولات
          </Link>

          {categories.map((cat) => (
            <div key={cat.id}>
              <Link
                href={`/categories/${cat.slug}`}
                onClick={() => setOpen(false)}
                className="block px-3 py-3 rounded-lg text-coffee-800 hover:bg-gold-50 hover:text-gold-700 font-medium transition-colors"
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
                      className="block px-3 py-2 rounded-lg text-sm text-coffee-600 hover:bg-gold-50 hover:text-gold-700 transition-colors"
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