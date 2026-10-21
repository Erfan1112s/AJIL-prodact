// components/reviews/ReviewForm.tsx
// فرم ثبت یا ویرایش نظر

'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import StarRating from '@/components/reviews/StarRating';
import Alert from '@/components/auth/Alert';
import {
  submitReviewAction,
  deleteMyReviewAction,
  type ReviewMediaInput,
} from '@/app/products/[slug]/reviews/actions';
import { TrashIcon, PlusIcon } from '@/components/admin/icons';

// ==========================================
// تایپ‌های داخلی
// ==========================================

// آیتم رسانه در فرم (شامل وضعیت آپلود)
interface FormMediaItem {
  // اگر از قبل ذخیره شده باشد
  id?: number;
  media_type: 'IMAGE' | 'VIDEO';
  url: string;
  thumbnail_url: string | null;
  // در حال آپلود؟ (فقط برای فایل‌های جدید)
  uploading?: boolean;
  // پیش‌نمایش موقت (فقط برای آپلود در حال انجام)
  previewUrl?: string;
}

// نظر موجود (برای ویرایش)
export interface ExistingReview {
  id: number;
  rating: number;
  title: string | null;
  body: string | null;
  is_approved: boolean;
  media: Array<{
    id: number;
    media_type: 'IMAGE' | 'VIDEO';
    url: string;
    thumbnail_url: string | null;
  }>;
}

interface Props {
  productId: number;
  productSlug: string;
  // اگر کاربر قبلاً نظر داده
  existingReview?: ExistingReview | null;
}

// ==========================================
// محدودیت‌ها
// ==========================================

const MAX_TITLE = 100;
const MAX_BODY = 1000;
const MAX_IMAGES = 5;
const MAX_VIDEOS = 1;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export default function ReviewForm({
  productId,
  productSlug,
  existingReview = null,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEdit = Boolean(existingReview?.id);

  // State فرم
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [title, setTitle] = useState(existingReview?.title ?? '');
  const [body, setBody] = useState(existingReview?.body ?? '');
  const [mediaItems, setMediaItems] = useState<FormMediaItem[]>(
    existingReview?.media.map((m) => ({
      id: m.id,
      media_type: m.media_type,
      url: m.url,
      thumbnail_url: m.thumbnail_url,
    })) ?? []
  );

  // وضعیت‌ها
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Ref برای file inputها
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // شمارش رسانه‌ها
  const imageCount = mediaItems.filter((m) => m.media_type === 'IMAGE').length;
  const videoCount = mediaItems.filter((m) => m.media_type === 'VIDEO').length;

  // ==========================================
  // آپلود فایل
  // ==========================================

  async function uploadFile(file: File, mediaType: 'IMAGE' | 'VIDEO') {
    // بررسی حجم
    const maxSize = mediaType === 'IMAGE' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (file.size > maxSize) {
      setError(
        mediaType === 'IMAGE'
          ? 'حجم عکس نباید از 5 مگابایت بیشتر باشد'
          : 'حجم ویدیو نباید از 50 مگابایت بیشتر باشد'
      );
      return;
    }

    // بررسی تعداد
    if (mediaType === 'IMAGE' && imageCount >= MAX_IMAGES) {
      setError('حداکثر 5 عکس مجاز است');
      return;
    }
    if (mediaType === 'VIDEO' && videoCount >= MAX_VIDEOS) {
      setError('حداکثر 1 ویدیو مجاز است');
      return;
    }

    // نمایش پیش‌نمایش موقت (برای فایل‌های جدید)
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const previewUrl = URL.createObjectURL(file);

    const tempItem: FormMediaItem = {
      media_type: mediaType,
      url: '',
      thumbnail_url: null,
      uploading: true,
      previewUrl,
    };

    setMediaItems((prev) => [...prev, tempItem]);
    setError(null);

    try {
      const fd = new FormData();
      fd.set('file', file);
      fd.set('media_type', mediaType);

      const res = await fetch('/api/reviews/upload', {
        method: 'POST',
        body: fd,
      });

      const data = (await res.json()) as {
        ok: boolean;
        url?: string;
        thumbnail_url?: string;
        error?: string;
      };

      // پاک کردن preview URL
      URL.revokeObjectURL(previewUrl);

      if (data.ok && data.url) {
        // جایگزینی آیتم موقت با آیتم واقعی
        setMediaItems((prev) =>
          prev.map((item) =>
            item === tempItem
              ? {
                  media_type: mediaType,
                  url: data.url!,
                  thumbnail_url: data.thumbnail_url ?? null,
                }
              : item
          )
        );
      } else {
        // حذف آیتم موقت
        setMediaItems((prev) => prev.filter((item) => item !== tempItem));
        setError(data.error ?? 'خطا در آپلود فایل');
      }
    } catch {
      URL.revokeObjectURL(previewUrl);
      setMediaItems((prev) => prev.filter((item) => item !== tempItem));
      setError('خطا در آپلود فایل. لطفاً دوباره تلاش کنید.');
    }

    // ریست input
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
    void tempId;
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, 'IMAGE');
  }

  function handleVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, 'VIDEO');
  }

  // ==========================================
  // حذف رسانه از لیست
  // ==========================================

  function removeMedia(index: number) {
    const item = mediaItems[index];
    // اگر در حال آپلود است، preview URL را پاک کن
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    setMediaItems((prev) => prev.filter((_, i) => i !== index));
  }

  // ==========================================
  // بررسی امکان ارسال
  // ==========================================

  const hasUploading = mediaItems.some((m) => m.uploading);
  const hasText = title.trim().length > 0 || body.trim().length > 0;
  const hasMedia = mediaItems.filter((m) => !m.uploading).length > 0;

  const canSubmit =
    rating >= 1 &&
    (hasText || hasMedia) &&
    !hasUploading &&
    !isPending;

  // ==========================================
  // ارسال
  // ==========================================

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (rating < 1) {
      setError('لطفاً امتیاز خود را انتخاب کنید');
      return;
    }

    if (!hasText && !hasMedia) {
      setError('حداقل متن نظر یا یک عکس/ویدیو الزامی است');
      return;
    }

    if (hasUploading) {
      setError('لطفاً تا پایان آپلود فایل‌ها صبر کنید');
      return;
    }

    // آماده‌سازی رسانه‌ها برای ارسال
    const mediaPayload: ReviewMediaInput[] = mediaItems.map((m) => ({
      id: m.id,
      media_type: m.media_type,
      url: m.url,
      thumbnail_url: m.thumbnail_url,
    }));

    startTransition(async () => {
      const result = await submitReviewAction({
        productId,
        productSlug,
        rating,
        title: title.trim(),
        body: body.trim(),
        media: mediaPayload,
      });

      if (result.ok) {
        setSuccess(
          result.isEdit
            ? 'نظر شما با موفقیت ویرایش شد و پس از تایید نمایش داده می‌شود'
            : 'نظر شما با موفقیت ثبت شد و پس از تایید نمایش داده می‌شود'
        );
        router.refresh();
        setTimeout(() => setSuccess(null), 4000);
      } else {
        setError(result.error);
      }
    });
  }

  // ==========================================
  // حذف نظر
  // ==========================================

  function handleDelete() {
    if (!existingReview?.id) return;

    startTransition(async () => {
      const result = await deleteMyReviewAction(
        existingReview.id,
        productSlug
      );

      if (result.ok) {
        setShowDeleteConfirm(false);
        router.refresh();
      } else {
        setError(result.error);
        setShowDeleteConfirm(false);
      }
    });
  }

  // ==========================================
  // رندر
  // ==========================================

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-coffee-200 bg-white p-5 sm:p-6 space-y-5"
      >
        {/* هدر */}
        <div>
          <h3 className="text-base font-bold text-coffee-900 mb-1">
            {isEdit ? 'ویرایش نظر شما' : 'ثبت نظر'}
          </h3>
          <p className="text-xs text-coffee-500">
            {isEdit
              ? 'با ویرایش، نظر شما مجدداً بررسی می‌شود'
              : 'فقط خریداران این محصول می‌توانند نظر ثبت کنند'}
          </p>
        </div>

        {/* نمایش وضعیت تایید در ویرایش */}
        {isEdit && existingReview && !existingReview.is_approved && (
          <Alert type="info" title="در انتظار تایید">
            نظر شما در حال بررسی توسط تیم است. پس از تایید در سایت
            نمایش داده می‌شود.
          </Alert>
        )}

        {/* امتیاز */}
        <div>
          <label className="block text-sm font-medium text-coffee-800 mb-2">
            امتیاز شما <span className="text-red-500">*</span>
          </label>
          <StarRating
            value={rating}
            onChange={setRating}
            size="lg"
            showValue={rating > 0}
          />
        </div>

        {/* عنوان */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="review-title"
              className="block text-sm font-medium text-coffee-800"
            >
              عنوان نظر (اختیاری)
            </label>
            <span
              className={`text-[10px] fa-num ${
                title.length > MAX_TITLE
                  ? 'text-red-600'
                  : 'text-coffee-400'
              }`}
            >
              {title.length.toLocaleString('fa-IR')} /{' '}
              {MAX_TITLE.toLocaleString('fa-IR')}
            </span>
          </div>
          <input
            id="review-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
            disabled={isPending}
            placeholder="مثال: کیفیت عالی"
            className="w-full px-4 py-3 rounded-xl border border-coffee-200 bg-cream-50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all text-sm"
          />
        </div>

        {/* متن */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="review-body"
              className="block text-sm font-medium text-coffee-800"
            >
              متن نظر
            </label>
            <span
              className={`text-[10px] fa-num ${
                body.length > MAX_BODY
                  ? 'text-red-600'
                  : 'text-coffee-400'
              }`}
            >
              {body.length.toLocaleString('fa-IR')} /{' '}
              {MAX_BODY.toLocaleString('fa-IR')}
            </span>
          </div>
          <textarea
            id="review-body"
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
            disabled={isPending}
            rows={4}
            placeholder="تجربه خود را از خرید این محصول بنویسید..."
            className="w-full px-4 py-3 rounded-xl border border-coffee-200 bg-cream-50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all text-sm resize-none"
          />
        </div>

        {/* رسانه‌ها */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-coffee-800">
              عکس و ویدیو (اختیاری)
            </label>
            <div className="text-[10px] text-coffee-400 fa-num">
              عکس: {imageCount.toLocaleString('fa-IR')} از{' '}
              {MAX_IMAGES.toLocaleString('fa-IR')} | ویدیو:{' '}
              {videoCount.toLocaleString('fa-IR')} از{' '}
              {MAX_VIDEOS.toLocaleString('fa-IR')}
            </div>
          </div>

          {/* پیش‌نمایش رسانه‌ها */}
          {mediaItems.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
              {mediaItems.map((item, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-xl overflow-hidden border border-coffee-200 bg-cream-100 group"
                >
                  {/* تصویر یا ویدیو */}
                  {item.uploading ? (
                    <div className="w-full h-full flex items-center justify-center bg-cream-50">
                      {item.previewUrl ? (
                        item.media_type === 'IMAGE' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.previewUrl}
                            alt="در حال آپلود"
                            className="w-full h-full object-cover opacity-50"
                          />
                        ) : (
                          <div className="text-xs text-coffee-500">
                            ویدیو
                          </div>
                        )
                      ) : null}
                      {/* اسپینر */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <svg
                          className="w-6 h-6 text-white animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        >
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                      </div>
                    </div>
                  ) : item.media_type === 'IMAGE' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={`تصویر ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-coffee-100 relative">
                      {item.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.thumbnail_url}
                          alt="ویدیو"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-coffee-600"
                        >
                          <polygon points="23 7 16 12 23 17 23 7" />
                          <rect x="1" y="5" width="15" height="14" rx="2" />
                        </svg>
                      )}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="white"
                          className="opacity-90"
                        >
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* دکمه حذف */}
                  {!item.uploading && (
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      disabled={isPending}
                      className="absolute top-1 left-1 w-7 h-7 rounded-lg bg-white/95 backdrop-blur-md shadow-md flex items-center justify-center text-red-600 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      aria-label="حذف"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* نشان نوع */}
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-[9px]">
                    {item.media_type === 'IMAGE' ? 'عکس' : 'ویدیو'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* دکمه‌های آپلود */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={isPending || imageCount >= MAX_IMAGES}
              className="inline-flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 border-dashed border-coffee-300 hover:border-gold-400 bg-cream-50/50 hover:bg-gold-50/40 text-xs font-medium text-coffee-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-5-5L5 21" />
              </svg>
              افزودن عکس
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
              onChange={handleImageSelect}
              className="hidden"
              disabled={isPending || imageCount >= MAX_IMAGES}
            />

            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={isPending || videoCount >= MAX_VIDEOS}
              className="inline-flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 border-dashed border-coffee-300 hover:border-gold-400 bg-cream-50/50 hover:bg-gold-50/40 text-xs font-medium text-coffee-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" />
              </svg>
              افزودن ویدیو
            </button>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleVideoSelect}
              className="hidden"
              disabled={isPending || videoCount >= MAX_VIDEOS}
            />
          </div>

          <p className="text-[10px] text-coffee-400 mt-2 leading-5">
            عکس‌ها: JPG، PNG، WebP — حداکثر 5 مگابایت هر کدام —{' '}
            ویدیو: MP4، WebM — حداکثر 50 مگابایت
          </p>
        </div>

        {/* پیام‌ها */}
        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        {/* دکمه‌ها */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl btn-gold text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                در حال ارسال...
              </>
            ) : isEdit ? (
              'ذخیره تغییرات'
            ) : (
              'ثبت نظر'
            )}
          </button>

          {isEdit && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isPending}
              className="px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              حذف نظر
            </button>
          )}
        </div>
      </form>

      {/* دیالوگ حذف */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-slide-down">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <TrashIcon className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-base font-bold text-coffee-900 text-center mb-2">
              حذف نظر
            </h3>
            <p className="text-sm text-coffee-600 text-center leading-6 mb-5">
              آیا از حذف نظر خود مطمئن هستید؟ این عمل قابل بازگشت
              نیست.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-cream-100 text-coffee-700 text-sm font-medium hover:bg-cream-200 disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50"
              >
                {isPending ? 'در حال حذف...' : 'حذف کن'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}