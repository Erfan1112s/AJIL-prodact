// components/admin/products/ProductForm.tsx
// فرم افزودن یا ویرایش محصول با بسته‌بندی چندگانه

'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FormField from '@/components/auth/FormField';
import Alert from '@/components/auth/Alert';
import ImageUploader from '@/components/admin/products/ImageUploader';
import VariantPackagingSelect, {
  getPackagingLabel,
} from '@/components/admin/products/VariantPackagingSelect';
import { TrashIcon, PlusIcon } from '@/components/admin/icons';
import { calculateAutoFreshness } from '@/lib/freshness';
import {
  saveProductAction,
  generateSlugAction,
  type ProductFormInput,
  type VariantInput,
  type ImageInput,
  type BatchInput,
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
    batch?: BatchInput;
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
        packaging_type: 'standard',
        packaging_label: '',
        price: 0,
        compare_price: null,
        sku: null,
        image_url: null,
        is_active: true,
      },
    ]
  );

  // تصاویر
  const [images, setImages] = useState<ImageInput[]>(initial?.images ?? []);

  // Batch
  const [batch, setBatch] = useState<BatchInput>(
    initial?.batch ?? {
      batch_code: '',
      supplier_name: '',
      harvest_date: '',
      roast_date: '',
      pack_date: '',
      expiry_date: '',
      freshness_mode: 'MANUAL',
      freshness_score: 100,
      freshness_base_score: 100,
      freshness_base_date: '',
      freshness_annual_decay: 50,
      qc_note: '',
    }
  );

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState<
    number | null
  >(null);

  // تولید slug
  async function handleGenerateSlug() {
    if (!name.trim()) return;
    const result = await generateSlugAction(name);
    if (result.slug) setSlug(result.slug);
  }

  // آپلود تصویر واریانت
  async function handleVariantImageUpload(index: number, file: File) {
    setUploadingVariantIndex(index);
    try {
      const fd = new FormData();
      fd.set('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd,
      });
      const data = (await res.json()) as {
        ok: boolean;
        url?: string;
        error?: string;
      };

      if (data.ok && data.url) {
        updateVariant(index, { image_url: data.url });
      } else {
        alert(data.error ?? 'خطا در آپلود تصویر');
      }
    } catch {
      alert('خطا در آپلود تصویر');
    } finally {
      setUploadingVariantIndex(null);
    }
  }

  // مدیریت واریانت‌ها
  function addVariant() {
    setVariants((v) => [
      ...v,
      {
        weight_gram: 500,
        packaging_type: 'standard',
        packaging_label: '',
        price: 0,
        compare_price: null,
        sku: null,
        image_url: null,
        is_active: true,
      },
    ]);
  }

  function removeVariant(index: number) {
    setVariants((v) => v.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, updates: Partial<VariantInput>) {
    setVariants((v) =>
      v.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  }

  // ارسال
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

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
      batch,
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

  // پیش‌نمایش تازگی خودکار
  const autoFreshnessPreview =
    batch.freshness_mode === 'AUTO'
      ? calculateAutoFreshness({
          freshness_base_score: batch.freshness_base_score,
          freshness_base_date: batch.pack_date
            ? new Date(batch.pack_date)
            : batch.freshness_base_date
              ? new Date(batch.freshness_base_date)
              : null,
          freshness_annual_decay: batch.freshness_annual_decay,
        })
      : null;

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
            title="وزن‌ها، بسته‌بندی و قیمت‌ها"
            action={
              <button
                type="button"
                onClick={addVariant}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 text-xs text-gold-700 hover:text-gold-800 font-medium"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                افزودن واریانت
              </button>
            }
          >
            <div className="rounded-xl bg-gold-50 border border-gold-200 p-3 text-[11px] text-coffee-700 leading-5 mb-4">
              هر محصول می‌تواند چندین بسته‌بندی از یک وزن داشته باشد.
              مثلاً پسته ۵۰۰ گرم در کیسه پلاستیکی و پسته ۵۰۰ گرم در
              جعبه هدیه، دو واریانت جداگانه با قیمت‌های متفاوت هستند.
            </div>

            {variants.length === 0 ? (
              <div className="text-center py-6 text-sm text-coffee-500">
                حداقل یک واریانت اضافه کنید
              </div>
            ) : (
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-coffee-200 bg-cream-50/50 p-4"
                  >
                    {/* هدر واریانت */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-coffee-700">
                          واریانت {(index + 1).toLocaleString('fa-IR')}
                        </span>
                        <span className="text-[10px] font-normal text-coffee-500 mr-2 fa-num">
                          ({variant.weight_gram.toLocaleString('fa-IR')} گرم
                          {variant.packaging_type !== 'standard' ||
                          variant.packaging_label
                            ? ` — ${getPackagingLabel(
                                variant.packaging_type,
                                variant.packaging_label
                              )}`
                            : ''}
                          )
                        </span>
                      </div>
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
                          disabled={isPending || variants.length === 1}
                          className="w-6 h-6 rounded-md hover:bg-red-50 text-coffee-400 hover:text-red-600 disabled:opacity-30 flex items-center justify-center transition-colors"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* فیلدهای واریانت */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                      {/* وزن */}
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

                      {/* نوع بسته‌بندی */}
                      <div>
                        <label className="block text-[10px] text-coffee-500 mb-1">
                          نوع بسته‌بندی
                        </label>
                        <VariantPackagingSelect
                          value={variant.packaging_type}
                          onChange={(v) =>
                            updateVariant(index, { packaging_type: v })
                          }
                          disabled={isPending}
                        />
                      </div>

                      {/* قیمت */}
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

                      {/* قیمت قبل از تخفیف */}
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

                      {/* برچسب بسته‌بندی */}
                      <div className="col-span-2">
                        <label className="block text-[10px] text-coffee-500 mb-1">
                          برچسب نمایشی بسته‌بندی (اختیاری)
                        </label>
                        <input
                          type="text"
                          value={variant.packaging_label}
                          onChange={(e) =>
                            updateVariant(index, {
                              packaging_label: e.target.value,
                            })
                          }
                          disabled={isPending}
                          placeholder="مثال: با روبان قرمز"
                          className="w-full px-2.5 py-2 rounded-lg border border-coffee-200 bg-white text-xs outline-none focus:border-gold-500"
                        />
                        <p className="text-[9px] text-coffee-400 mt-1">
                          اگر پر شود، به‌جای برچسب پیش‌فرض نمایش داده می‌شود
                        </p>
                      </div>

                      {/* SKU */}
                      <div className="col-span-2">
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

                    {/* تصویر واریانت */}
                    <div className="pt-3 border-t border-coffee-200">
                      <label className="block text-[10px] text-coffee-500 mb-2">
                        تصویر این واریانت (اختیاری)
                      </label>

                      {variant.image_url ? (
                        <div className="flex items-center gap-3">
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white border border-coffee-200 shrink-0">
                            <Image
                              src={variant.image_url}
                              alt={`${variant.weight_gram} گرم`}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-[10px] text-coffee-500 truncate mb-2"
                              dir="ltr"
                            >
                              {variant.image_url}
                            </div>
                            <div className="flex gap-2">
                              <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white border border-coffee-200 hover:border-gold-400 text-[11px] font-medium text-coffee-700 transition-colors">
                                {uploadingVariantIndex === index
                                  ? 'در حال آپلود...'
                                  : 'تغییر تصویر'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={
                                    isPending ||
                                    uploadingVariantIndex === index
                                  }
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleVariantImageUpload(index, file);
                                    }
                                    e.target.value = '';
                                  }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() =>
                                  updateVariant(index, { image_url: null })
                                }
                                disabled={isPending}
                                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-[11px] font-medium hover:bg-red-100 transition-colors"
                              >
                                حذف
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label
                          className={`cursor-pointer flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed transition-colors ${
                            uploadingVariantIndex === index
                              ? 'border-gold-500 bg-gold-50 cursor-wait'
                              : 'border-coffee-300 hover:border-gold-400 bg-white hover:bg-gold-50/40'
                          }`}
                        >
                          {uploadingVariantIndex === index ? (
                            <>
                              <svg
                                className="w-4 h-4 text-gold-600 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              >
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                              </svg>
                              <span className="text-xs text-coffee-700 font-medium">
                                در حال آپلود...
                              </span>
                            </>
                          ) : (
                            <>
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-gold-600"
                              >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <path d="m17 8-5-5-5 5" />
                                <path d="M12 3v12" />
                              </svg>
                              <span className="text-xs text-coffee-700 font-medium">
                                آپلود تصویر برای این واریانت
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={
                              isPending || uploadingVariantIndex === index
                            }
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleVariantImageUpload(index, file);
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* تصاویر گالری */}
          <Section title="تصاویر گالری محصول">
            <ImageUploader
              images={images}
              onChange={setImages}
              disabled={isPending}
            />
          </Section>

          {/* بچ تولید و تازگی */}
          <Section title="بچ تولید و تازگی">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="کد بچ"
                  name="batch_code"
                  type="text"
                  value={batch.batch_code}
                  onChange={(e) => {
                    setBatch((b) => ({ ...b, batch_code: e.target.value }));
                    if (fieldErrors.batch_code)
                      setFieldErrors((x) => ({ ...x, batch_code: '' }));
                  }}
                  disabled={isPending}
                  error={fieldErrors.batch_code || null}
                  placeholder="P-250901"
                  dir="ltr"
                  hint="اختیاری - اگر خالی باشد بچ ذخیره نمی‌شود"
                />

                <FormField
                  label="تأمین‌کننده"
                  name="supplier_name"
                  type="text"
                  value={batch.supplier_name}
                  onChange={(e) =>
                    setBatch((b) => ({ ...b, supplier_name: e.target.value }))
                  }
                  disabled={isPending}
                  placeholder="باغات رفسنجان"
                />

                <FormField
                  label="تاریخ برداشت"
                  name="harvest_date"
                  type="date"
                  value={batch.harvest_date}
                  onChange={(e) =>
                    setBatch((b) => ({ ...b, harvest_date: e.target.value }))
                  }
                  disabled={isPending}
                  dir="ltr"
                />

                <FormField
                  label="تاریخ برشته‌کاری"
                  name="roast_date"
                  type="date"
                  value={batch.roast_date}
                  onChange={(e) =>
                    setBatch((b) => ({ ...b, roast_date: e.target.value }))
                  }
                  disabled={isPending}
                  dir="ltr"
                />

                <FormField
                  label="تاریخ بسته‌بندی"
                  name="pack_date"
                  type="date"
                  value={batch.pack_date}
                  onChange={(e) =>
                    setBatch((b) => ({ ...b, pack_date: e.target.value }))
                  }
                  disabled={isPending}
                  dir="ltr"
                  hint="تاریخ پایه محاسبه تازگی"
                />

                <FormField
                  label="تاریخ انقضا"
                  name="expiry_date"
                  type="date"
                  value={batch.expiry_date}
                  onChange={(e) =>
                    setBatch((b) => ({ ...b, expiry_date: e.target.value }))
                  }
                  disabled={isPending}
                  dir="ltr"
                />
              </div>

              {/* حالت تازگی */}
              <div className="pt-4 border-t border-coffee-100">
                <label className="block text-sm font-medium text-coffee-800 mb-3">
                  محاسبه تازگی
                </label>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() =>
                      setBatch((b) => ({ ...b, freshness_mode: 'MANUAL' }))
                    }
                    disabled={isPending}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      batch.freshness_mode === 'MANUAL'
                        ? 'border-gold-500 bg-gold-50'
                        : 'border-coffee-200 bg-white hover:border-gold-300'
                    }`}
                  >
                    <div className="font-bold text-sm text-coffee-900 mb-0.5">
                      دستی
                    </div>
                    <div className="text-[10px] text-coffee-500">
                      امتیاز را خودت تعیین کن
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setBatch((b) => ({ ...b, freshness_mode: 'AUTO' }))
                    }
                    disabled={isPending}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      batch.freshness_mode === 'AUTO'
                        ? 'border-gold-500 bg-gold-50'
                        : 'border-coffee-200 bg-white hover:border-gold-300'
                    }`}
                  >
                    <div className="font-bold text-sm text-coffee-900 mb-0.5">
                      خودکار
                    </div>
                    <div className="text-[10px] text-coffee-500">
                      کاهش سالانه بر اساس تاریخ
                    </div>
                  </button>
                </div>

                {batch.freshness_mode === 'MANUAL' && (
                  <div>
                    <label className="block text-sm font-medium text-coffee-800 mb-2">
                      امتیاز تازگی:{' '}
                      <span className="fa-num font-bold text-gold-700">
                        {batch.freshness_score.toLocaleString('fa-IR')}
                      </span>{' '}
                      از ۱۰۰
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={batch.freshness_score}
                      onChange={(e) =>
                        setBatch((b) => ({
                          ...b,
                          freshness_score: Number(e.target.value),
                        }))
                      }
                      disabled={isPending}
                      className="w-full accent-gold-500"
                    />
                    <div className="flex items-center justify-between text-[10px] text-coffee-400 mt-1">
                      <span>۰ (منقضی)</span>
                      <span>۵۰ (نصف)</span>
                      <span>۱۰۰ (تازه)</span>
                    </div>
                  </div>
                )}

                {batch.freshness_mode === 'AUTO' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-coffee-800 mb-2">
                        امتیاز پایه (در تاریخ بسته‌بندی)
                      </label>
                      <input
                        type="number"
                        value={batch.freshness_base_score}
                        onChange={(e) =>
                          setBatch((b) => ({
                            ...b,
                            freshness_base_score: Math.min(
                              100,
                              Math.max(0, Number(e.target.value) || 0)
                            ),
                          }))
                        }
                        disabled={isPending}
                        dir="ltr"
                        min="0"
                        max="100"
                        className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 bg-cream-50 text-sm text-center outline-none focus:border-gold-500 fa-num"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-coffee-800 mb-2">
                        درصد کاهش در هر سال:{' '}
                        <span className="fa-num font-bold text-gold-700">
                          {batch.freshness_annual_decay.toLocaleString('fa-IR')}٪
                        </span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={batch.freshness_annual_decay}
                        onChange={(e) =>
                          setBatch((b) => ({
                            ...b,
                            freshness_annual_decay: Number(e.target.value),
                          }))
                        }
                        disabled={isPending}
                        className="w-full accent-gold-500"
                      />
                      <div className="text-[10px] text-coffee-500 mt-1 leading-5">
                        پیش‌فرض ۵۰٪ یعنی بعد از یک سال، امتیاز نصف می‌شود.
                      </div>
                    </div>

                    {autoFreshnessPreview !== null && (
                      <div className="rounded-xl bg-gold-50 border border-gold-200 p-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] text-coffee-700 mb-0.5">
                            امتیاز فعلی (محاسبه خودکار)
                          </div>
                          <div className="text-lg font-bold text-gold-700 fa-num">
                            {autoFreshnessPreview.toLocaleString('fa-IR')} از
                            ۱۰۰
                          </div>
                        </div>
                      </div>
                    )}

                    {!batch.pack_date && !batch.freshness_base_date && (
                      <Alert type="info">
                        برای محاسبه خودکار، تاریخ بسته‌بندی را وارد کنید.
                      </Alert>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-coffee-800 mb-2">
                  یادداشت کنترل کیفیت
                </label>
                <textarea
                  value={batch.qc_note}
                  onChange={(e) =>
                    setBatch((b) => ({ ...b, qc_note: e.target.value }))
                  }
                  disabled={isPending}
                  rows={2}
                  placeholder="اختیاری"
                  className="w-full px-4 py-3 rounded-xl border border-coffee-200 bg-cream-50 focus:border-gold-500 outline-none resize-none text-sm"
                />
              </div>
            </div>
          </Section>
        </div>

        {/* ستون کنار */}
        <div className="lg:col-span-1 space-y-5">
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