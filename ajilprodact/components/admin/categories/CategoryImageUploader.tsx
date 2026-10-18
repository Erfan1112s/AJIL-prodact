// components/admin/categories/CategoryImageUploader.tsx
// آپلود تصویر تکی برای دسته‌بندی

'use client';

import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import Image from 'next/image';

interface Props {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function CategoryImageUploader({
  value,
  onChange,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File) {
    setError(null);

    // بررسی حجم
    if (file.size > MAX_FILE_SIZE) {
      setError('حجم فایل بیش از 5 مگابایت است');
      return;
    }

    // بررسی نوع
    if (!file.type.startsWith('image/')) {
      setError('فایل انتخابی باید تصویر باشد');
      return;
    }

    setUploading(true);

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
        onChange(data.url);
      } else {
        setError(data.error ?? 'خطا در آپلود');
      }
    } catch {
      setError('خطا در آپلود تصویر');
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (!disabled && !uploading) setDragOver(true);
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleRemove() {
    onChange('');
    setError(null);
  }

  // ==========================================
  // حالت آپلود شده
  // ==========================================
  if (value) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-2xl border-2 border-gold-300 bg-gold-50/30 p-3 overflow-hidden">
          <div className="flex items-center gap-4">
            {/* پیش‌نمایش */}
            <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-white border border-coffee-200 shrink-0">
              <Image
                src={value}
                alt="پیش‌نمایش"
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>

            {/* اطلاعات */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-coffee-900 mb-1">
                تصویر دسته‌بندی
              </div>
              <div
                className="text-[10px] text-coffee-500 truncate mb-3"
                dir="ltr"
              >
                {value}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={disabled || uploading}
                  className="px-3 py-1.5 rounded-lg bg-white border border-coffee-200 hover:border-gold-400 text-[11px] font-medium text-coffee-700 transition-colors disabled:opacity-50"
                >
                  {uploading ? 'در حال آپلود...' : 'تغییر تصویر'}
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={disabled || uploading}
                  className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-[11px] font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={handleFileSelect}
            disabled={disabled || uploading}
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
            {error}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // حالت خالی - ناحیه Drag & Drop
  // ==========================================
  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() =>
          !disabled && !uploading && inputRef.current?.click()
        }
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
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
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
            <div className="w-12 h-12 rounded-2xl bg-white border border-coffee-200 flex items-center justify-center text-gold-600 shadow-sm">
              <svg
                width="22"
                height="22"
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
              تصویر به‌صورت خودکار بهینه می‌شود
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}