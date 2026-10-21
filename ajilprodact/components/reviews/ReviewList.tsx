// components/reviews/ReviewList.tsx
// لیست نظرات با فیلتر و صفحه‌بندی

'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ReviewCard from '@/components/reviews/ReviwCard';
import type { ProductReviewWithDetails } from '@/lib/types';

interface Props {
  productSlug: string;
  reviews: ProductReviewWithDetails[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  currentSort: 'newest' | 'highest' | 'lowest' | 'helpful';
  currentRating: number | null;
  currentWithMedia: boolean;
  currentVerified: boolean;
  // برای تشخیص «نظر خودم»
  currentCustomerId: number | null;
}

const SORT_OPTIONS: Array<{
  value: 'newest' | 'highest' | 'lowest' | 'helpful';
  label: string;
}> = [
  { value: 'newest', label: 'جدیدترین' },
  { value: 'helpful', label: 'مفیدترین' },
  { value: 'highest', label: 'بالاترین امتیاز' },
  { value: 'lowest', label: 'پایین‌ترین امتیاز' },
];

export default function ReviewList({
  productSlug,
  reviews,
  totalCount,
  currentPage,
  totalPages,
  currentSort,
  currentRating,
  currentWithMedia,
  currentVerified,
  currentCustomerId,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // فیلتر فعال است؟
  const hasActiveFilters =
    currentSort !== 'newest' ||
    currentRating !== null ||
    currentWithMedia ||
    currentVerified;

  // به‌روزرسانی فیلترها در URL
  function updateFilters(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    // هنگام تغییر فیلتر، به صفحه ۱ برگرد
    if (!updates.page && currentPage !== 1) {
      params.delete('page');
    }

    startTransition(() => {
      router.push(
        `/products/${productSlug}/reviews?${params.toString()}#reviews`
      );
    });
  }

  // پاک کردن همه فیلترها
  function clearFilters() {
    startTransition(() => {
      router.push(`/products/${productSlug}/reviews#reviews`);
    });
  }

  return (
    <div id="reviews" className="space-y-4">
      {/* ==========================================
          فیلترها
          ========================================== */}
      <div className="rounded-2xl border border-coffee-200 bg-white p-4">
        {/* ردیف مرتب‌سازی */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-coffee-600 mb-2">
            مرتب‌سازی
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SORT_OPTIONS.map((option) => {
              const active = currentSort === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    updateFilters({
                      sort:
                        option.value === 'newest' ? null : option.value,
                    })
                  }
                  disabled={isPending}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                    active
                      ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-coffee-900 shadow-md shadow-gold-500/30'
                      : 'bg-cream-100 text-coffee-600 hover:bg-cream-200'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* فیلترهای دیگر */}
        <div className="pt-3 border-t border-coffee-100 space-y-2">
          {/* فیلتر امتیاز */}
          <div>
            <label className="block text-xs font-medium text-coffee-600 mb-2">
              امتیاز
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => updateFilters({ rating: null })}
                disabled={isPending}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                  currentRating === null
                    ? 'bg-gold-100 text-gold-800 border border-gold-400'
                    : 'bg-white text-coffee-600 border border-coffee-200 hover:border-gold-300'
                }`}
              >
                همه
              </button>
              {[5, 4, 3, 2, 1].map((star) => {
                const active = currentRating === star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      updateFilters({ rating: String(star) })
                    }
                    disabled={isPending}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                      active
                        ? 'bg-gold-100 text-gold-800 border border-gold-400'
                        : 'bg-white text-coffee-600 border border-coffee-200 hover:border-gold-300'
                    }`}
                  >
                    <span className="fa-num">
                      {star.toLocaleString('fa-IR')}
                    </span>
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-gold-500"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>

          {/* فیلترهای چک‌باکسی */}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={currentWithMedia}
                onChange={(e) =>
                  updateFilters({
                    withMedia: e.target.checked ? '1' : null,
                  })
                }
                disabled={isPending}
                className="w-4 h-4 accent-gold-500"
              />
              <span className="text-xs text-coffee-700">
                فقط با عکس یا ویدیو
              </span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={currentVerified}
                onChange={(e) =>
                  updateFilters({
                    verified: e.target.checked ? '1' : null,
                  })
                }
                disabled={isPending}
                className="w-4 h-4 accent-gold-500"
              />
              <span className="text-xs text-coffee-700">
                فقط خریداران تاییدشده
              </span>
            </label>
          </div>
        </div>

        {/* شمارش و پاک کردن */}
        <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-coffee-100 flex-wrap">
          <div className="text-xs text-coffee-500 fa-num">
            {totalCount.toLocaleString('fa-IR')} نظر
            {hasActiveFilters && (
              <span className="text-gold-700 mr-1.5">(فیلتر فعال)</span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              disabled={isPending}
              className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50 inline-flex items-center gap-1 transition-colors"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
              پاک کردن فیلترها
            </button>
          )}
        </div>
      </div>

      {/* ==========================================
          لیست نظرات
          ========================================== */}
      {reviews.length === 0 ? (
        <EmptyState hasActiveFilters={hasActiveFilters} />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              productSlug={productSlug}
              isOwnReview={
                currentCustomerId !== null &&
                review.author.id === currentCustomerId
              }
            />
          ))}
        </div>
      )}

      {/* ==========================================
          صفحه‌بندی
          ========================================== */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) =>
            updateFilters({ page: String(page) })
          }
          disabled={isPending}
        />
      )}
    </div>
  );
}

// ==========================================
// حالت خالی
// ==========================================

function EmptyState({ hasActiveFilters }: { hasActiveFilters: boolean }) {
  return (
    <div className="rounded-2xl border border-coffee-200 bg-white py-14 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-cream-100 mx-auto mb-4 flex items-center justify-center text-coffee-400">
        {hasActiveFilters ? (
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        ) : (
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </div>

      {hasActiveFilters ? (
        <>
          <h3 className="text-base font-bold text-coffee-900 mb-2">
            نظری با این فیلترها یافت نشد
          </h3>
          <p className="text-sm text-coffee-500 leading-7">
            فیلترها را تغییر دهید یا همه نظرات را ببینید.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-base font-bold text-coffee-900 mb-2">
            هنوز نظری ثبت نشده
          </h3>
          <p className="text-sm text-coffee-500 leading-7 max-w-sm mx-auto">
            اولین نفری باشید که تجربه خود را از این محصول با دیگران
            به اشتراک می‌گذارد.
          </p>
        </>
      )}
    </div>
  );
}

// ==========================================
// صفحه‌بندی
// ==========================================

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled: boolean;
}) {
  // نمایش حداکثر ۵ شماره با ellipsis
  const pages: Array<number | 'ellipsis'> = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('ellipsis');

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      {currentPage > 1 && (
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled}
          className="w-10 h-10 rounded-xl bg-white border border-coffee-200 flex items-center justify-center text-coffee-700 hover:border-gold-500 hover:text-gold-700 disabled:opacity-50 transition-colors"
          aria-label="صفحه قبل"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      )}

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span
            key={`e-${i}`}
            className="w-10 h-10 flex items-center justify-center text-coffee-400"
          >
            ...
          </span>
        ) : p === currentPage ? (
          <span
            key={p}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-coffee-900 font-bold flex items-center justify-center fa-num shadow-lg shadow-gold-500/30"
          >
            {p.toLocaleString('fa-IR')}
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            disabled={disabled}
            className="w-10 h-10 rounded-xl bg-white border border-coffee-200 flex items-center justify-center text-coffee-700 font-medium hover:border-gold-500 hover:text-gold-700 disabled:opacity-50 transition-colors fa-num"
          >
            {p.toLocaleString('fa-IR')}
          </button>
        )
      )}

      {currentPage < totalPages && (
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled}
          className="w-10 h-10 rounded-xl bg-white border border-coffee-200 flex items-center justify-center text-coffee-700 hover:border-gold-500 hover:text-gold-700 disabled:opacity-50 transition-colors"
          aria-label="صفحه بعد"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}