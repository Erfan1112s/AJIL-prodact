// components/admin/categories/CategoryForm.tsx
// فرم افزودن یا ویرایش دسته‌بندی

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FormField from '@/components/auth/FormField';
import Alert from '@/components/auth/Alert';
import {
  saveCategoryAction,
  generateCategorySlugAction,
  type CategoryFormInput,
} from '@/app/admin/categories/actions';
import type { CategoryRow } from '@/lib/types';
import CategoryImageUploader from '@/components/admin/categories/CategoryImageUploader';

interface Props {
  categories: CategoryRow[]; // برای dropdown والد
  initial?: {
    id: number;
    name: string;
    slug: string;
    description: string;
    image_url: string;
    parent_id: number | null;
    sort_order: number;
    is_active: boolean;
  };
}

export default function CategoryForm({ categories, initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(initial?.id);

  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '');
  const [parentId, setParentId] = useState<number | null>(
    initial?.parent_id ?? null
  );
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleGenerateSlug() {
    if (!name.trim()) return;
    const result = await generateCategorySlugAction(name);
    if (result.slug) setSlug(result.slug);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'نام دسته را وارد کنید';
    if (!slug.trim()) errors.slug = 'اسلاگ را وارد کنید';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('لطفاً خطاهای فرم را برطرف کنید');
      return;
    }

    const input: CategoryFormInput = {
      id: initial?.id,
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      image_url: imageUrl.trim(),
      parent_id: parentId,
      sort_order: sortOrder,
      is_active: isActive,
    };

    startTransition(async () => {
      try {
        const result = await saveCategoryAction(input);

        if (result.ok) {
          router.push('/admin/categories');
          router.refresh();
        } else {
          setError(result.error);
          if (result.field) {
            setFieldErrors({ [result.field]: result.error });
          }
        }
      } catch {
        setError('خطای غیرمنتظره. لطفاً دوباره تلاش کنید.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* هدر */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-coffee-900 mb-1">
            {isEdit ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
          </h1>
          <p className="text-xs text-coffee-500">
            {isEdit
              ? `شناسه: ${initial?.id}`
              : 'اطلاعات دسته را کامل وارد کنید'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/categories"
            className="px-4 py-2.5 rounded-xl bg-white border border-coffee-200 text-coffee-700 text-sm font-medium hover:border-gold-400 transition-colors"
          >
            انصراف
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 rounded-xl btn-gold text-sm font-bold disabled:opacity-60"
          >
            {isPending ? 'در حال ذخیره...' : 'ذخیره'}
          </button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ستون اصلی */}
        <div className="lg:col-span-2 space-y-5">
          <Section title="اطلاعات اصلی">
            <div className="space-y-4">
              <FormField
                label="نام دسته"
                name="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name)
                    setFieldErrors((x) => ({ ...x, name: '' }));
                }}
                disabled={isPending}
                error={fieldErrors.name || null}
                placeholder="مثال: پسته"
              />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-coffee-800">
                    اسلاگ (آدرس URL)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSlug}
                    disabled={isPending || !name.trim()}
                    className="text-xs text-gold-700 hover:text-gold-800 disabled:opacity-50"
                  >
                    تولید خودکار
                  </button>
                </div>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '-')
                        .replace(/-+/g, '-')
                    );
                    if (fieldErrors.slug)
                      setFieldErrors((x) => ({ ...x, slug: '' }));
                  }}
                  disabled={isPending}
                  dir="ltr"
                  placeholder="peste"
                  className={`w-full px-4 py-3 rounded-xl border bg-cream-50 outline-none transition-all fa-num ${
                    fieldErrors.slug
                      ? 'border-red-300'
                      : 'border-coffee-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
                  }`}
                />
                {fieldErrors.slug && (
                  <p className="text-xs text-red-600 mt-1.5">
                    {fieldErrors.slug}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-coffee-800 mb-2">
                  توضیحات
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                  rows={4}
                  placeholder="توضیحات دسته..."
                  className="w-full px-4 py-3 rounded-xl border border-coffee-200 bg-cream-50 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all resize-none"
                />
              </div>

       <div>
  <label className="block text-sm font-medium text-coffee-800 mb-2">
    تصویر دسته‌بندی
  </label>
  <CategoryImageUploader
    value={imageUrl}
    onChange={setImageUrl}
    disabled={isPending}
  />
  <p className="text-[11px] text-coffee-500 mt-2 leading-5">
    تصویر دسته در لیست دسته‌ها و کارت محصولات آن دسته نمایش داده
    می‌شود.
  </p>
</div>
            </div>
          </Section>
        </div>

        {/* ستون کنار */}
        <div className="lg:col-span-1 space-y-5">
          <Section title="ساختار">
            <div>
              <label className="block text-sm font-medium text-coffee-800 mb-2">
                دسته والد
              </label>
              <select
                value={parentId ?? ''}
                onChange={(e) => {
                  setParentId(
                    e.target.value ? Number(e.target.value) : null
                  );
                  if (fieldErrors.parent_id)
                    setFieldErrors((x) => ({ ...x, parent_id: '' }));
                }}
                disabled={isPending}
                className={`w-full px-4 py-3 rounded-xl border bg-cream-50 outline-none transition-all ${
                  fieldErrors.parent_id
                    ? 'border-red-300'
                    : 'border-coffee-200 focus:border-gold-500'
                }`}
              >
                <option value="">بدون والد (دسته اصلی)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldErrors.parent_id && (
                <p className="text-xs text-red-600 mt-1.5">
                  {fieldErrors.parent_id}
                </p>
              )}
              <p className="text-[11px] text-coffee-500 mt-2 leading-5">
                اگر دسته اصلی است، خالی بگذارید. اگر زیردسته است، والد
                را انتخاب کنید.
              </p>
            </div>
          </Section>

          <Section title="ترتیب">
            <FormField
              label="ترتیب نمایش"
              name="sort_order"
              type="number"
              value={String(sortOrder)}
              onChange={(e) =>
                setSortOrder(Number(e.target.value) || 0)
              }
              disabled={isPending}
              dir="ltr"
              hint="عدد کمتر = نمایش بالاتر"
            />
          </Section>

          <Section title="وضعیت">
            <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-xl border border-coffee-200 hover:border-gold-400 transition-colors">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isPending}
                className="w-4 h-4 mt-0.5 accent-gold-500"
              />
              <div>
                <div className="text-sm font-medium text-coffee-900">
                  فعال
                </div>
                <div className="text-[11px] text-coffee-500 mt-0.5">
                  نمایش در سایت
                </div>
              </div>
            </label>
          </Section>
        </div>
      </div>

      {/* دکمه پایین (موبایل) */}
      <div className="lg:hidden flex items-center gap-2 pt-4 border-t border-coffee-100">
        <Link
          href="/admin/categories"
          className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-coffee-200 text-coffee-700 text-sm font-medium text-center"
        >
          انصراف
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 px-5 py-2.5 rounded-xl btn-gold text-sm font-bold disabled:opacity-60"
        >
          {isPending ? 'در حال ذخیره...' : 'ذخیره'}
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-coffee-200 bg-white p-5">
      <h3 className="text-sm font-bold text-coffee-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}