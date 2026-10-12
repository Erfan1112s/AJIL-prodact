// components/admin/products/ProductForm.tsx
// فرم افزودن یا ویرایش محصول

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FormField from '@/components/auth/FormField';
import Alert from '@/components/auth/Alert';
import { TrashIcon, PlusIcon } from '@/components/admin/icons';
import { formatPrice } from '@/lib/utils';
import {
  saveProductAction,
  generateSlugAction,
  type ProductFormInput,
  type VariantInput,
  type ImageInput,
} from '@/app/admin/products/actions';
import type { CategorySummary } from '@/lib/types';

interface Props {
  categories: CategorySummary[];
  initial?: {
    id: number;
    name: string;
    slug: string;
    short_desc: string;
    description: string;
    category_id: number;
    is_active: boolean;
    is_featured: boolean;
    meta_title: string;
    meta_desc: string;
    variants: VariantInput[];
    images: ImageInput[];
  };
}

export default function ProductForm({ categories, initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEdit = Boolean(initial?.id);

  // state فرم
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [shortDesc, setShortDesc] = useState(initial?.short_desc ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [categoryId, setCategoryId] = useState<number>(
    initial?.category_id ?? categories[0]?.id ?? 0
  );
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false);
  const [metaTitle, setMetaTitle] = useState(initial?.meta_title ?? '');
  const [metaDesc, setMetaDesc] = useState(initial?.meta_desc ?? '');

  // واریانت‌ها
  const [variants, setVariants] = useState<VariantInput[]>(
    initial?.variants ?? [
      {
        weight_gram: 250,
        price: 0,
        compare_price: null,
        sku: null,
        is_active: true,
      },
    ]
  );

  // تصاویر
  const [images, setImages] = useState<ImageInput[]>(
    initial?.images ?? []
  );

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // تولید slug خودکار
  async function handleGenerateSlug() {
    if (!name.trim()) return;
    const result = await generateSlugAction(name);
    if (result.slug) setSlug(result.slug);
  }

  // افزودن واریانت
  function addVariant() {
    setVariants((v) => [
      ...v,
      {
        weight_gram: 500,
        price: 0,
        compare_price: null,
        sku: null,
        is_active: true,
      },
    ]);
  }

  // حذف واریانت
  function removeVariant(index: number) {
    setVariants((v) => v.filter((_, i) => i !== index));
  }

  // به‌روزرسانی واریانت
  function updateVariant(index: number, updates: Partial<VariantInput>) {
    setVariants((v) =>
      v.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  }

  // افزودن تصویر
  function addImage() {
    setImages((imgs) => [
      ...imgs,
      {
        url: '',
        alt: '',
        is_primary: imgs.length === 0,
        sort_order: imgs.length,
      },
    ]);
  }

  // حذف تصویر
  function removeImage(index: number) {
    setImages((imgs) => imgs.filter((_, i) => i !== index));
  }

  // به‌روزرسانی تصویر
  function updateImage(index: number, updates: Partial<ImageInput>) {
    setImages((imgs) =>
      imgs.map((item, i) => {
        if (i === index) return { ...item, ...updates };
        // اگر is_primary تغییر کرده، بقیه را غیرفعال کن
        if (updates.is_primary === true) {
          return { ...item, is_primary: false };
        }
        return item;
      })
    );
  }

  // ارسال
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // اعتبارسنجی سمت کلاینت
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'نام محصول را وارد کنید';
    if (!slug.trim()) errors.slug = 'اسلاگ را وارد کنید';
    if (!categoryId) errors.category = 'دسته‌بندی را انتخاب کنید';
    if (variants.length === 0) errors.variants = 'حداقل یک واریانت اضافه کنید';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('لطفاً خطاهای فرم را برطرف کنید');
      return;
    }

    const input: ProductFormInput = {
      id: initial?.id,
      name: name.trim(),
      slug: slug.trim(),
      short_desc: shortDesc.trim(),
      description: description.trim(),
      category_id: categoryId,
      is_active: isActive,
      is_featured: isFeatured,
      meta_title: metaTitle.trim(),
      meta_desc: metaDesc.trim(),
      variants,
      images: images.filter((img) => img.url.trim()),
    };

    startTransition(async () => {
      try {
        const result = await saveProductAction(input);

        if (result.ok) {
          router.push('/admin/products');
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
            {isEdit ? 'ویرایش محصول' : 'افزودن محصول جدید'}
          </h1>
          <p className="text-xs text-coffee-500">
            {isEdit
              ? `شناسه: ${initial?.id}`
              : 'اطلاعات محصول را کامل وارد کنید'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products"
            className="px-4 py-2.5 rounded-xl bg-white border border-coffee-200 text-coffee-700 text-sm font-medium hover:border-gold-400 transition-colors"
          >
            انصراف
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 rounded-xl btn-gold text-sm font-bold disabled:opacity-60"
          >
            {isPending ? 'در حال ذخیره...' : 'ذخیره محصول'}
          </button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ستون اصلی */}
        <div className="lg:col-span-2 space-y-5">
          {/* اطلاعات اصلی */}
          <Section title="اطلاعات اصلی">
            <div className="space-y-4">
              <FormField
                label="نام محصول"
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
                placeholder="مثال: پسته اکبری ممتاز"
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
                  placeholder="peste-akbari-momtaz"
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

              <FormField
                label="توضیح کوتاه"
                name="short_desc"
                type="text"
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                disabled={isPending}
                hint="در کارت محصول نمایش داده می‌شود (حداکثر 500 کاراکتر)"
              />

              <div>
                <label className="block text-sm font-medium text-coffee-800 mb-2">
                  توضیحات کامل
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                  rows={6}
                  placeholder="توضیحات کامل محصول..."
                  className="w-full px-4 py-3 rounded-xl border border-coffee-200 bg-cream-50 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all resize-none"
                />
              </div>
            </div>
          </Section>

          {/* واریانت‌ها */}
          <Section
            title="وزن‌ها و قیمت‌ها"
            action={
              <button
                type="button"
                onClick={addVariant}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 text-xs text-gold-700 hover:text-gold-800 font-medium"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                افزودن وزن
              </button>
            }
          >
            {variants.length === 0 ? (
              <div className="text-center py-6 text-sm text-coffee-500">
                حداقل یک وزن اضافه کنید
              </div>
            ) : (
              <div className="space-y-3">
                {variants.map((variant, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-coffee-200 bg-cream-50/50 p-3"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-coffee-700 fa-num">
                        وزن {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={variant.is_active}
                            onChange={(e) =>
                              updateVariant(index, {
                                is_active: e.target.checked,
                              })
                            }
                            disabled={isPending}
                            className="w-3.5 h-3.5 accent-gold-500"
                          />
                          <span className="text-[11px] text-coffee-600">
                            فعال
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          disabled={isPending}
                          className="w-6 h-6 rounded-md hover:bg-red-50 text-coffee-400 hover:text-red-600 flex items-center justify-center transition-colors"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] text-coffee-500 mb-1">
                          وزن (گرم)
                        </label>
                        <input
                          type="number"
                          value={variant.weight_gram}
                          onChange={(e) =>
                            updateVariant(index, {
                              weight_gram: Number(e.target.value) || 0,
                            })
                          }
                          disabled={isPending}
                          dir="ltr"
                          min="1"
                          className="w-full px-2.5 py-2 rounded-lg border border-coffee-200 bg-white text-sm text-center outline-none focus:border-gold-500 fa-num"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-coffee-500 mb-1">
                          قیمت (تومان)
                        </label>
                        <input
                          type="number"
                          value={variant.price}
                          onChange={(e) =>
                            updateVariant(index, {
                              price: Number(e.target.value) || 0,
                            })
                          }
                          disabled={isPending}
                          dir="ltr"
                          min="0"
                          className="w-full px-2.5 py-2 rounded-lg border border-coffee-200 bg-white text-sm text-center outline-none focus:border-gold-500 fa-num"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-coffee-500 mb-1">
                          قیمت قبل از تخفیف
                        </label>
                        <input
                          type="number"
                          value={variant.compare_price ?? ''}
                          onChange={(e) =>
                            updateVariant(index, {
                              compare_price: e.target.value
                                ? Number(e.target.value)
                                : null,
                            })
                          }
                          disabled={isPending}
                          dir="ltr"
                          min="0"
                          placeholder="اختیاری"
                          className="w-full px-2.5 py-2 rounded-lg border border-coffee-200 bg-white text-sm text-center outline-none focus:border-gold-500 fa-num"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-coffee-500 mb-1">
                          SKU
                        </label>
                        <input
                          type="text"
                          value={variant.sku ?? ''}
                          onChange={(e) =>
                            updateVariant(index, {
                              sku: e.target.value || null,
                            })
                          }
                          disabled={isPending}
                          dir="ltr"
                          placeholder="اختیاری"
                          className="w-full px-2.5 py-2 rounded-lg border border-coffee-200 bg-white text-xs text-center outline-none focus:border-gold-500 fa-num"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* تصاویر */}
          <Section
            title="تصاویر محصول"
            action={
              <button
                type="button"
                onClick={addImage}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 text-xs text-gold-700 hover:text-gold-800 font-medium"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                افزودن تصویر
              </button>
            }
          >
            <div className="rounded-xl bg-gold-50 border border-gold-200 p-3 text-[11px] text-coffee-700 leading-5 mb-3">
              در این مرحله، فقط می‌توانید آدرس تصویر را وارد کنید. آپلود
              مستقیم در فاز بعدی اضافه می‌شود. تصاویر را در{' '}
              <code className="bg-white px-1 rounded">public/images/products/</code>{' '}
              قرار دهید.
            </div>

            {images.length === 0 ? (
              <div className="text-center py-6 text-sm text-coffee-500">
                هنوز تصویری اضافه نشده
              </div>
            ) : (
              <div className="space-y-2">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2.5 rounded-xl border border-coffee-200 bg-cream-50/50"
                  >
                    {/* پیش‌نمایش */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-coffee-100 shrink-0 flex items-center justify-center">
                      {img.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img.url}
                          alt={img.alt}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-[9px] text-coffee-400">
                          بدون
                        </span>
                      )}
                    </div>

                    {/* فیلدها */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <input
                        type="text"
                        value={img.url}
                        onChange={(e) =>
                          updateImage(index, { url: e.target.value })
                        }
                        disabled={isPending}
                        dir="ltr"
                        placeholder="/images/products/example.jpg"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-coffee-200 bg-white text-xs outline-none focus:border-gold-500"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={img.alt}
                          onChange={(e) =>
                            updateImage(index, { alt: e.target.value })
                          }
                          disabled={isPending}
                          placeholder="توضیح تصویر"
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-coffee-200 bg-white text-xs outline-none focus:border-gold-500"
                        />
                        <label className="inline-flex items-center gap-1 cursor-pointer shrink-0">
                          <input
                            type="radio"
                            name="primary_image"
                            checked={img.is_primary}
                            onChange={() =>
                              updateImage(index, { is_primary: true })
                            }
                            disabled={isPending}
                            className="w-3 h-3 accent-gold-500"
                          />
                          <span className="text-[10px] text-coffee-600">
                            اصلی
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          disabled={isPending}
                          className="w-6 h-6 rounded-md hover:bg-red-50 text-coffee-400 hover:text-red-600 flex items-center justify-center transition-colors shrink-0"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* ستون کنار */}
        <div className="lg:col-span-1 space-y-5">
          {/* وضعیت */}
          <Section title="وضعیت">
            <div className="space-y-3">
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

              <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-xl border border-coffee-200 hover:border-gold-400 transition-colors">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  disabled={isPending}
                  className="w-4 h-4 mt-0.5 accent-gold-500"
                />
                <div>
                  <div className="text-sm font-medium text-coffee-900">
                    محصول ویژه
                  </div>
                  <div className="text-[11px] text-coffee-500 mt-0.5">
                    نمایش در صفحه اصلی
                  </div>
                </div>
              </label>
            </div>
          </Section>

          {/* دسته‌بندی */}
          <Section title="دسته‌بندی">
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(Number(e.target.value));
                if (fieldErrors.category)
                  setFieldErrors((x) => ({ ...x, category: '' }));
              }}
              disabled={isPending}
              className={`w-full px-4 py-3 rounded-xl border bg-cream-50 outline-none transition-all ${
                fieldErrors.category
                  ? 'border-red-300'
                  : 'border-coffee-200 focus:border-gold-500'
              }`}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {fieldErrors.category && (
              <p className="text-xs text-red-600 mt-1.5">
                {fieldErrors.category}
              </p>
            )}
          </Section>

          {/* SEO */}
          <Section title="بهینه‌سازی (SEO)">
            <div className="space-y-3">
              <FormField
                label="عنوان SEO"
                name="meta_title"
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                disabled={isPending}
                hint="حداکثر 70 کاراکتر"
              />
              <FormField
                label="توضیحات SEO"
                name="meta_desc"
                type="text"
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                disabled={isPending}
                hint="حداکثر 160 کاراکتر"
              />
            </div>
          </Section>
        </div>
      </div>

      {/* دکمه پایین (موبایل) */}
      <div className="lg:hidden flex items-center gap-2 pt-4 border-t border-coffee-100">
        <Link
          href="/admin/products"
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
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-coffee-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-bold text-coffee-900">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}