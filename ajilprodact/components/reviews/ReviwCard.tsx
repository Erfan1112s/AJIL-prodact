// components/reviews/ReviewCard.tsx
// کارت نمایش یک نظر

'use client';

import { useState } from 'react';
import StarRating from '@/components/reviews/StarRating';
import HelpfulButton from '@/components/reviews/HelpfulButton';
import { formatRelativeTime } from '@/lib/utils';
import type { ProductReviewWithDetails } from '@/lib/types';

interface Props {
  review: ProductReviewWithDetails;
  productSlug: string;
  // اگر کاربر نویسنده نظر است، true
  isOwnReview?: boolean;
}

export default function ReviewCard({
  review,
  productSlug,
  isOwnReview = false,
}: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // جدا کردن تصاویر و ویدیو
  const images = review.media.filter((m) => m.media_type === 'IMAGE');
  const video = review.media.find((m) => m.media_type === 'VIDEO') ?? null;

  return (
    <article className="rounded-2xl border border-coffee-200 bg-white p-4 sm:p-5">
      {/* ==========================================
          سربرگ: نویسنده و امتیاز
          ========================================== */}
      <header className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-coffee-900 font-bold text-sm shadow-sm shrink-0">
          {review.author.initial}
        </div>

        <div className="flex-1 min-w-0">
          {/* نام و نشان‌ها */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-sm text-coffee-900">
              {review.author.full_name ?? 'کاربر'}
            </span>

            {review.is_verified_purchase && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-700 text-[9px] font-bold">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
                خریدار
              </span>
            )}

            {isOwnReview && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gold-50 text-gold-700 text-[9px] font-bold">
                نظر شما
              </span>
            )}
          </div>

          {/* ردیف امتیاز و زمان */}
          <div className="flex items-center gap-3 flex-wrap">
            <StarRating value={review.rating} size="sm" readOnly />
            <span className="text-[11px] text-coffee-500">
              {formatRelativeTime(review.created_at)}
            </span>
          </div>
        </div>
      </header>

      {/* ==========================================
          عنوان و متن
          ========================================== */}
      {review.title && (
        <h3 className="font-bold text-sm text-coffee-900 mb-2">
          {review.title}
        </h3>
      )}

      {review.body && (
        <p className="text-sm text-coffee-700 leading-7 whitespace-pre-line mb-3">
          {review.body}
        </p>
      )}

      {/* ==========================================
          گالری عکس
          ========================================== */}
      {images.length > 0 && (
        <div
          className={`grid gap-1.5 mb-3 ${
            images.length === 1
              ? 'grid-cols-1 max-w-sm'
              : images.length === 2
                ? 'grid-cols-2 max-w-md'
                : 'grid-cols-3'
          }`}
        >
          {images.map((img, index) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setLightboxIndex(index)}
              className="relative aspect-square rounded-xl overflow-hidden bg-cream-100 border border-coffee-100 group cursor-zoom-in"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={`تصویر ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* ==========================================
          ویدیو
          ========================================== */}
      {video && (
        <div className="mb-3 rounded-xl overflow-hidden bg-black border border-coffee-200 max-w-md">
          <video
            src={video.url}
            controls
            preload="metadata"
            playsInline
            className="w-full h-auto"
          >
            مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
          </video>
        </div>
      )}

      {/* ==========================================
          پاسخ ادمین
          ========================================== */}
      {review.admin_reply && (
        <div className="mt-3 rounded-xl bg-gradient-to-l from-gold-50 to-cream-50 border border-gold-200 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gold-700"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="text-[11px] font-bold text-gold-800">
              پاسخ فروشگاه
            </span>
            {review.admin_reply_at && (
              <span className="text-[10px] text-coffee-500">
                {formatRelativeTime(review.admin_reply_at)}
              </span>
            )}
          </div>
          <p className="text-xs text-coffee-700 leading-6 whitespace-pre-line">
            {review.admin_reply}
          </p>
        </div>
      )}

      {/* ==========================================
          پایین: دکمه مفید
          ========================================== */}
      {!isOwnReview && (
        <div className="mt-3 pt-3 border-t border-coffee-100 flex items-center gap-3">
          <HelpfulButton
            reviewId={review.id}
            productSlug={productSlug}
            initialHasVoted={review.has_voted}
            initialCount={review.helpful_count}
          />
        </div>
      )}

      {/* ==========================================
          مودال Lightbox
          ========================================== */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </article>
  );
}

// ==========================================
// کامپوننت Lightbox
// ==========================================

import type { ReviewMediaRow } from '@/lib/types';

function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: ReviewMediaRow[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const current = images[index];

  function goNext() {
    setIndex((i) => (i + 1) % images.length);
  }

  function goPrev() {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight') goPrev(); // در RTL برعکس
    if (e.key === 'ArrowLeft') goNext();
  }

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-coffee-900/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      ref={(el) => el?.focus()}
    >
      {/* دکمه بستن */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-colors z-10"
        aria-label="بستن"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      {/* شمارش */}
      {images.length > 1 && (
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs fa-num">
          {(index + 1).toLocaleString('fa-IR')} از{' '}
          {images.length.toLocaleString('fa-IR')}
        </div>
      )}

      {/* دکمه قبلی */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={goPrev}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-colors"
          aria-label="قبلی"
        >
          <svg
            width="20"
            height="20"
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

      {/* تصویر */}
      <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={`تصویر ${index + 1}`}
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        />
      </div>

      {/* دکمه بعدی */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={goNext}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-colors"
          aria-label="بعدی"
        >
          <svg
            width="20"
            height="20"
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
    </div>
  );
}