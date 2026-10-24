// components/admin/reviews/ReviewsTable.tsx
// جدول نظرات در پنل ادمین

'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import StarRating from '@/components/reviews/StarRating';
import Alert from '@/components/auth/Alert';
import { TrashIcon, SearchIcon } from '@/components/admin/icons';
import { formatRelativeTime } from '@/lib/utils';
import {
  approveReviewAction,
  unapproveReviewAction,
  deleteReviewAction,
  replyToReviewAction,
} from '@/app/admin/(protected)/reviews/actions';
import type { AdminReviewListItem } from '@/lib/types';

interface Props {
  reviews: AdminReviewListItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  currentSearch: string;
  currentStatus: 'all' | 'approved' | 'pending';
  currentRating: 1 | 2 | 3 | 4 | 5 | null;
}

export default function ReviewsTable({
  reviews,
  totalCount,
  currentPage,
  totalPages,
  currentSearch,
  currentStatus,
  currentRating,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(currentSearch);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: number;
    productName: string;
    customerName: string;
  } | null>(null);
  const [replyTarget, setReplyTarget] = useState<AdminReviewListItem | null>(
    null
  );
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);

  function updateFilters(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') params.delete(key);
      else params.set(key, value);
    }
    if (!updates.page && currentPage !== 1) params.delete('page');
    router.push(`/admin/reviews?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilters({ search: search.trim() || null });
  }

  function handleToggleApproval(review: AdminReviewListItem) {
    startTransition(async () => {
      const action = review.is_approved
        ? unapproveReviewAction
        : approveReviewAction;
      const result = await action(review.id);
      if (result.ok) {
        router.refresh();
      } else {
        alert(result.error);
      }
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const result = await deleteReviewAction(id);
      if (result.ok) {
        setConfirmDelete(null);
        router.refresh();
      } else {
        alert(result.error);
        setConfirmDelete(null);
      }
    });
  }

  function openReplyModal(review: AdminReviewListItem) {
    setReplyTarget(review);
    setReplyText('');
    setReplyError(null);
  }

  function handleReplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!replyTarget) return;

    startTransition(async () => {
      const result = await replyToReviewAction(replyTarget.id, replyText);
      if (result.ok) {
        setReplyTarget(null);
        router.refresh();
      } else {
        setReplyError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* فیلترها */}
      <div className="rounded-2xl border border-coffee-200 bg-white p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-coffee-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جست‌وجو: نام مشتری، موبایل، عنوان..."
              className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-coffee-200 bg-cream-50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl btn-gold text-sm font-bold whitespace-nowrap"
          >
            جست‌وجو
          </button>
        </form>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 rounded-lg bg-cream-100 p-1">
              {(
                [
                  { value: 'all', label: 'همه' },
                  { value: 'pending', label: 'در انتظار' },
                  { value: 'approved', label: 'تاییدشده' },
                ] as const
              ).map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() =>
                    updateFilters({
                      status: s.value === 'all' ? null : s.value,
                    })
                  }
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    currentStatus === s.value
                      ? 'bg-white text-coffee-900 shadow-sm'
                      : 'text-coffee-600 hover:text-coffee-900'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <select
              value={currentRating ?? ''}
              onChange={(e) =>
                updateFilters({ rating: e.target.value || null })
              }
              className="px-3 py-1.5 rounded-lg border border-coffee-200 bg-cream-50 text-xs outline-none focus:border-gold-500"
            >
              <option value="">همه امتیازها</option>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} ستاره
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-coffee-500 fa-num">
            {totalCount.toLocaleString('fa-IR')} نظر
          </div>
        </div>
      </div>

      {/* جدول */}
      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-coffee-200 bg-white py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cream-100 mx-auto mb-4 flex items-center justify-center text-coffee-400">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-sm text-coffee-500">
            نظری با این فیلترها یافت نشد
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-coffee-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-coffee-100">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">محصول</th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">مشتری</th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">امتیاز</th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">نظر</th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">وضعیت</th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">تاریخ</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-100">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-cream-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/${review.product_id}/edit`}
                        className="text-xs font-medium text-coffee-900 hover:text-gold-700 line-clamp-1 transition-colors"
                      >
                        {review.product_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-coffee-800">
                        {review.customer_name ?? 'بدون نام'}
                      </div>
                      <div className="text-[10px] text-coffee-500 fa-num" dir="ltr">
                        {review.customer_phone}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StarRating value={review.rating} size="sm" readOnly />
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {review.title && (
                        <div className="text-xs font-medium text-coffee-900 line-clamp-1">
                          {review.title}
                        </div>
                      )}
                      {review.body && (
                        <div className="text-[11px] text-coffee-500 line-clamp-2 mt-0.5">
                          {review.body}
                        </div>
                      )}
                      {review.media_count > 0 && (
                        <div className="text-[10px] text-gold-700 mt-1 inline-flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-5-5L5 21" />
                          </svg>
                          {review.media_count.toLocaleString('fa-IR')} رسانه
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {review.is_approved ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                          تاییدشده
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gold-50 text-gold-700 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
                          در انتظار
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-coffee-500">
                      {formatRelativeTime(review.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => handleToggleApproval(review)}
                          disabled={isPending}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 ${
                            review.is_approved
                              ? 'hover:bg-gold-50 text-coffee-500 hover:text-gold-700'
                              : 'hover:bg-brand-50 text-coffee-500 hover:text-brand-600'
                          }`}
                          title={review.is_approved ? 'لغو تایید' : 'تایید'}
                        >
                          {review.is_approved ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M6 6l12 12M18 6L6 18" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openReplyModal(review)}
                          disabled={isPending}
                          className="w-8 h-8 rounded-lg hover:bg-gold-50 text-coffee-500 hover:text-gold-700 flex items-center justify-center transition-colors disabled:opacity-50"
                          title="پاسخ"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDelete({
                              id: review.id,
                              productName: review.product_name,
                              customerName: review.customer_name ?? 'کاربر',
                            })
                          }
                          disabled={isPending}
                          className="w-8 h-8 rounded-lg hover:bg-red-50 text-coffee-500 hover:text-red-600 flex items-center justify-center transition-colors disabled:opacity-50"
                          title="حذف"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* صفحه‌بندی */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <button
              type="button"
              onClick={() => updateFilters({ page: String(currentPage - 1) })}
              className="px-4 py-2 rounded-lg bg-white border border-coffee-200 text-coffee-700 text-sm hover:border-gold-400 transition-colors"
            >
              قبلی
            </button>
          )}
          <span className="text-xs text-coffee-500 fa-num">
            صفحه {currentPage.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
          </span>
          {currentPage < totalPages && (
            <button
              type="button"
              onClick={() => updateFilters({ page: String(currentPage + 1) })}
              className="px-4 py-2 rounded-lg btn-gold text-sm font-bold"
            >
              بعدی
            </button>
          )}
        </div>
      )}

      {/* دیالوگ حذف */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-slide-down">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <TrashIcon className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-base font-bold text-coffee-900 text-center mb-2">
              حذف نظر
            </h3>
            <p className="text-sm text-coffee-600 text-center leading-6 mb-5">
              نظر «{confirmDelete.customerName}» برای «{confirmDelete.productName}» حذف شود؟
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-cream-100 text-coffee-700 text-sm font-medium hover:bg-cream-200 disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDelete.id)}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50"
              >
                {isPending ? 'در حال حذف...' : 'حذف کن'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال پاسخ */}
      {replyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-slide-down">
            <h3 className="text-base font-bold text-coffee-900 mb-1">
              پاسخ به نظر
            </h3>
            <p className="text-xs text-coffee-500 mb-4">
              نظر «{replyTarget.customer_name ?? 'کاربر'}» برای «{replyTarget.product_name}»
            </p>

            <form onSubmit={handleReplySubmit}>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={isPending}
                rows={5}
                maxLength={1000}
                placeholder="پاسخ خود را بنویسید... (خالی = حذف پاسخ)"
                className="w-full px-4 py-3 rounded-xl border border-coffee-200 bg-cream-50 focus:bg-white focus:border-gold-500 outline-none text-sm resize-none"
              />

              {replyError && (
                <div className="mt-3">
                  <Alert type="error">{replyError}</Alert>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-cream-100 text-coffee-700 text-sm font-medium hover:bg-cream-200 disabled:opacity-50"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl btn-gold text-sm font-bold disabled:opacity-50"
                >
                  {isPending ? 'در حال ذخیره...' : 'ذخیره'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}