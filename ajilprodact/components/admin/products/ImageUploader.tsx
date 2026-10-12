// components/admin/products/ImageUploader.tsx
// کامپوننت آپلود تصویر با drag & drop

'use client';

import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { TrashIcon } from '@/components/admin/icons';
import type { ImageInput } from '@/app/admin/products/actions';

interface Props {
  images: ImageInput[];
  onChange: (images: ImageInput[]) => void;
  disabled?: boolean;
}

// حداکثر حجم فایل (5 مگابایت)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ImageUploader({
  images,
  onChange,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // آپلود فایل‌ها
  // ==========================================
  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;

    setError(null);
    setUploading(true);

    const uploadedImages: ImageInput[] = [];

    for (const file of files) {
      // بررسی حجم
      if (file.size > MAX_FILE_SIZE) {
        setError(`حجم "${file.name}" بیش از 5 مگابایت است`);
        continue;
      }

      // بررسی نوع
      if (!file.type.startsWith('image/')) {
        setError(`"${file.name}" یک تصویر نیست`);
        continue;
      }

      try {
        const fd = new FormData();
        fd.set('file', file);

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: fd,
        });

        const data = (await response.json()) as {
          ok: boolean;
          url?: string;
          error?: string;
        };

        if (data.ok && data.url) {
          uploadedImages.push({
            url: data.url,
            alt: '',
            // اولین تصویر، اصلی می‌شود
            is_primary: images.length === 0 && uploadedImages.length === 0,
            sort_order: images.length + uploadedImages.length,
          });
        } else {
          setError(data.error ?? 'خطا در آپلود');
        }
      } catch {
        setError(`خطا در آپلود "${file.name}"`);
      }
    }

    if (uploadedImages.length > 0) {
      onChange([...images, ...uploadedImages]);
    }

    setUploading(false);
  }

  // ==========================================
  // انتخاب فایل
  // ==========================================
  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) uploadFiles(files);
    // ریست input برای امکان انتخاب مجدد همان فایل
    if (inputRef.current) inputRef.current.value = '';
  }

  // ==========================================
  // Drag & Drop
  // ==========================================
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;

    const files = Array.from(e.dataTransfer.files ?? []);
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length > 0) uploadFiles(imageFiles);
  }

  // ==========================================
  // حذف تصویر
  // ==========================================
  function removeImage(index: number) {
    const next = images.filter((_, i) => i !== index);
    // اگر تصویر اصلی حذف شد، اولین تصویر باقیمانده اصلی شود
    if (images[index].is_primary && next.length > 0) {
      next[0] = { ...next[0], is_primary: true };
    }
    // ترتیب را دوباره مرتب کن
    onChange(
      next.map((img, i) => ({
        ...img,
        sort_order: i,
      }))
    );
  }

  // ==========================================
  // تنظیم تصویر اصلی
  // ==========================================
  function setPrimary(index: number) {
    onChange(
      images.map((img, i) => ({
        ...img,
        is_primary: i === index,
      }))
    );
  }

  // ==========================================
  // تغییر alt
  // ==========================================
  function updateAlt(index: number, alt: string) {
    onChange(
      images.map((img, i) => (i === index ? { ...img, alt } : img))
    );
  }

  return (
    <div className="space-y-4">
      {/* ناحیه Drag & Drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
          dragOver
            ? 'border-gold-500 bg-gold-50 scale-[1.01]'
            : uploading
              ? 'border-coffee-200 bg-cream-50 cursor-wait'
              : 'border-coffee-300 bg-cream-50/50 hover:border-gold-400 hover:bg-gold-50/40'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
          multiple
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <svg
              className="w-8 h-8 text-gold-600 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <div className="text-sm text-coffee-700">
              در حال آپلود و بهینه‌سازی...
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-white border border-coffee-200 flex items-center justify-center text-gold-600 shadow-sm">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m17 8-5-5-5 5" />
                <path d="M12 3v12" />
              </svg>
            </div>
            <div className="text-sm font-bold text-coffee-900">
              {dragOver
                ? 'فایل را اینجا رها کنید'
                : 'برای آپلود کلیک کنید یا فایل را بکشید'}
            </div>
            <div className="text-[11px] text-coffee-500 leading-5">
              JPG، PNG، WebP یا AVIF — حداکثر 5 مگابایت
              <br />
              تصاویر به‌صورت خودکار بهینه و به WebP تبدیل می‌شوند
            </div>
          </div>
        )}
      </div>

      {/* خطا */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* پیش‌نمایش تصاویر */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, index) => (
            <div
              key={index}
              className={`group relative rounded-2xl overflow-hidden border-2 transition-all ${
                img.is_primary
                  ? 'border-gold-500 ring-2 ring-gold-500/20'
                  : 'border-coffee-200 hover:border-gold-400'
              }`}
            >
              {/* پیش‌نمایش */}
              <div className="aspect-square bg-cream-100 relative overflow-hidden">
                {img.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.url}
                    alt={img.alt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23a8a29e"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-coffee-300 text-[10px]">
                    نامعتبر
                  </div>
                )}

                {/* نشان اصلی */}
                {img.is_primary && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-coffee-900 text-[10px] font-bold shadow-lg">
                    اصلی
                  </div>
                )}

                {/* حذف */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  disabled={disabled}
                  className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-white/95 backdrop-blur-md shadow-md flex items-center justify-center text-red-600 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                  aria-label="حذف تصویر"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* اطلاعات پایین */}
              <div className="p-2 bg-white space-y-1.5">
                <input
                  type="text"
                  value={img.alt}
                  onChange={(e) => updateAlt(index, e.target.value)}
                  disabled={disabled}
                  placeholder="توضیح تصویر (alt)"
                  className="w-full px-2 py-1 rounded-md border border-coffee-200 text-[11px] outline-none focus:border-gold-500"
                />

                {!img.is_primary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(index)}
                    disabled={disabled}
                    className="w-full text-[10px] font-medium text-gold-700 hover:text-gold-800 py-1 rounded-md hover:bg-gold-50 transition-colors disabled:opacity-50"
                  >
                    تنظیم به‌عنوان تصویر اصلی
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}