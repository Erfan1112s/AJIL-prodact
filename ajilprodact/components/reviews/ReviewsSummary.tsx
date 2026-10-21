// components/reviews/ReviewsSummary.tsx
// خلاصه نظرات در صفحه محصول

import Link from 'next/link';
import StarRating from '@/components/reviews/StarRating';
import type { ProductReviewStats } from '@/lib/types';

interface Props {
  productSlug: string;
  stats: ProductReviewStats;
  // آیا کاربر می‌تواند نظر بدهد؟ (خریدار تاییدشده)
  canReview: boolean;
  // آیا کاربر قبلاً نظر داده؟
  hasExistingReview: boolean;
}

export default function ReviewsSummary({
  productSlug,
  stats,
  canReview,
  hasExistingReview,
}: Props) {
  const reviewsUrl = `/products/${productSlug}/reviews`;

  // اگر هیچ نظری نیست
  if (stats.total_count === 0) {
    return (
      <div className="rounded-2xl border border-coffee-200 bg-white p-6 sm:p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-cream-100 mx-auto mb-4 flex items-center justify-center text-coffee-400">
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
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
          </svg>
        </div>

        <h3 className="text-base font-bold text-coffee-900 mb-2">
          هنوز نظری برای این محصول ثبت نشده
        </h3>
        <p className="text-sm text-coffee-500 leading-7 mb-5 max-w-md mx-auto">
          {canReview
            ? 'اولین نفری باشید که تجربه خود را از خرید این محصول با دیگران به اشتراک می‌گذارد.'
            : 'پس از خرید و تحویل سفارش می‌توانید نظر خود را ثبت کنید.'}
        </p>

        {canReview ? (
          <Link
            href={`${reviewsUrl}#write-review`}
            className="inline-flex items-center gap-2 btn-gold px-6 py-3 rounded-xl text-sm font-bold"
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
              <path d="M12 5v14M5 12h14" />
            </svg>
            {hasExistingReview ? 'ویرایش نظر شما' : 'ثبت اولین نظر'}
          </Link>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cream-100 text-coffee-500 text-xs">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            فقط خریداران این محصول می‌توانند نظر ثبت کنند
          </div>
        )}
      </div>
    );
  }

  // محاسبه درصدها برای نمودار
  const maxCount = Math.max(
    stats.rating_distribution[1],
    stats.rating_distribution[2],
    stats.rating_distribution[3],
    stats.rating_distribution[4],
    stats.rating_distribution[5],
    1 // جلوگیری از تقسیم بر صفر
  );

  // امتیاز گرد شده برای نمایش ستاره‌ها
  const roundedRating = Math.round(stats.average_rating);

  return (
    <div className="rounded-2xl border border-coffee-200 bg-white overflow-hidden">
      {/* ==========================================
          بخش بالا: میانگین + توزیع
          ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-5">
        {/* ستون میانگین (۲ از ۵) */}
        <div className="md:col-span-2 p-6 border-b md:border-b-0 md:border-l border-coffee-100 flex flex-col items-center justify-center text-center bg-gradient-to-br from-gold-50/40 to-white">
          <div className="text-5xl font-bold text-gradient-gold fa-num leading-none mb-2">
            {stats.average_rating.toLocaleString('fa-IR', {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </div>

          <div className="text-sm text-coffee-500 mb-3">از ۵</div>

          <StarRating
            value={roundedRating}
            size="md"
            readOnly
            className="mb-3"
          />

          <div className="text-xs text-coffee-600 fa-num">
            بر اساس {stats.total_count.toLocaleString('fa-IR')} نظر
          </div>
        </div>

        {/* ستون توزیع (۳ از ۵) */}
        <div className="md:col-span-3 p-5 sm:p-6">
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.rating_distribution[
                star as 1 | 2 | 3 | 4 | 5
              ];
              const percent =
                stats.total_count > 0
                  ? Math.round((count / stats.total_count) * 100)
                  : 0;

              return (
                <Link
                  key={star}
                  href={`${reviewsUrl}?rating=${star}`}
                  className="group flex items-center gap-3 px-1 py-0.5 rounded-lg hover:bg-cream-50 transition-colors"
                >
                  {/* شماره ستاره */}
                  <span className="inline-flex items-center gap-1 text-xs text-coffee-600 w-10 shrink-0 fa-num">
                    {star.toLocaleString('fa-IR')}
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-gold-500"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                    </svg>
                  </span>

                  {/* نوار پیشرفت */}
                  <div className="flex-1 h-2 bg-cream-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-gold-400 to-gold-600 rounded-full transition-all"
                      style={{
                        width: `${(count / maxCount) * 100}%`,
                      }}
                    />
                  </div>

                  {/* تعداد */}
                  <span className="text-[11px] text-coffee-500 w-12 text-left fa-num shrink-0">
                    {count.toLocaleString('fa-IR')}
                  </span>

                  {/* درصد (در دسکتاپ) */}
                  <span className="hidden sm:block text-[10px] text-coffee-400 w-10 text-left fa-num shrink-0">
                    {percent.toLocaleString('fa-IR')}٪
                  </span>
                </Link>
              );
            })}
          </div>

          {/* آمار اضافه */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-coffee-100 flex-wrap">
            {stats.verified_count > 0 && (
              <div className="inline-flex items-center gap-1 text-[11px] text-brand-700">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span className="fa-num">
                  {stats.verified_count.toLocaleString('fa-IR')}
                </span>
                خریدار تاییدشده
              </div>
            )}
            {stats.with_media_count > 0 && (
              <div className="inline-flex items-center gap-1 text-[11px] text-coffee-600">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
                <span className="fa-num">
                  {stats.with_media_count.toLocaleString('fa-IR')}
                </span>
                با عکس یا ویدیو
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==========================================
          بخش پایین: دکمه‌ها
          ========================================== */}
      <div className="p-4 bg-cream-50 border-t border-coffee-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-coffee-600">
          {canReview
            ? hasExistingReview
              ? 'شما قبلاً برای این محصول نظر داده‌اید'
              : 'تجربه خود را با دیگران به اشتراک بگذارید'
            : 'برای ثبت نظر ابتدا باید این محصول را خریداری کنید'}
        </div>

        <div className="flex items-center gap-2">
          {canReview && (
            <Link
              href={`${reviewsUrl}#write-review`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-coffee-200 text-coffee-700 text-xs font-medium hover:border-gold-400 hover:text-gold-700 transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              {hasExistingReview ? 'ویرایش نظر' : 'ثبت نظر'}
            </Link>
          )}

          <Link
            href={reviewsUrl}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl btn-gold text-xs font-bold"
          >
            مشاهده همه نظرات
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}