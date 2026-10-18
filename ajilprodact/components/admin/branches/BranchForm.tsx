// components/admin/branches/BranchForm.tsx
// فرم افزودن یا ویرایش شعبه

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FormField from '@/components/auth/FormField';
import Alert from '@/components/auth/Alert';
import {
  saveBranchAction,
  generateBranchSlugAction,
  type BranchFormInput,
} from '@/app/admin/branches/actions';

interface Props {
  initial?: {
    id: number;
    name: string;
    slug: string;
    address: string;
    phone: string;
    lat: number | null;
    lng: number | null;
    is_active: boolean;
  };
}

export default function BranchForm({ initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(initial?.id);

  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [lat, setLat] = useState<string>(
    initial?.lat ? String(initial.lat) : ''
  );
  const [lng, setLng] = useState<string>(
    initial?.lng ? String(initial.lng) : ''
  );
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleGenerateSlug() {
    if (!name.trim()) return;
    const result = await generateBranchSlugAction(name);
    if (result.slug) setSlug(result.slug);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'نام شعبه را وارد کنید';
    if (!slug.trim()) errors.slug = 'اسلاگ را وارد کنید';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('لطفاً خطاهای فرم را برطرف کنید');
      return;
    }

    const input: BranchFormInput = {
      id: initial?.id,
      name: name.trim(),
      slug: slug.trim(),
      address: address.trim(),
      phone: phone.trim(),
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
      is_active: isActive,
    };

    startTransition(async () => {
      try {
        const result = await saveBranchAction(input);
        if (result.ok) {
          router.push('/admin/branches');
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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-coffee-900 mb-1">
            {isEdit ? 'ویرایش شعبه' : 'افزودن شعبه جدید'}
          </h1>
          <p className="text-xs text-coffee-500">
            {isEdit
              ? `شناسه: ${initial?.id}`
              : 'اطلاعات شعبه را کامل وارد کنید'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/branches"
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
        <div className="lg:col-span-2 space-y-5">
          <Section title="اطلاعات اصلی">
            <div className="space-y-4">
              <FormField
                label="نام شعبه"
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
                placeholder="مثال: شعبه مرکزی"
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
                  placeholder="markazi"
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
                  آدرس
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isPending}
                  rows={3}
                  placeholder="آدرس کامل شعبه..."
                  className="w-full px-4 py-3 rounded-xl border border-coffee-200 bg-cream-50 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all resize-none"
                />
              </div>

              <FormField
                label="شماره تلفن"
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isPending}
                dir="ltr"
                placeholder="03188776655"
                hint="مثال: 03188776655"
              />
            </div>
          </Section>

          <Section title="موقعیت جغرافیایی">
            <div className="rounded-xl bg-gold-50 border border-gold-200 p-3 text-[11px] text-coffee-700 leading-5 mb-4">
              برای نمایش شعبه روی نقشه، مختصات جغرافیایی را وارد کنید.
              می‌توانید از Google Maps یا نشان استفاده کنید.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="عرض جغرافیایی (Latitude)"
                name="lat"
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                disabled={isPending}
                dir="ltr"
                placeholder="32.6546000"
                hint="اختیاری"
              />

              <FormField
                label="طول جغرافیایی (Longitude)"
                name="lng"
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                disabled={isPending}
                dir="ltr"
                placeholder="51.6680000"
                hint="اختیاری"
              />
            </div>
          </Section>
        </div>

        <div className="lg:col-span-1 space-y-5">
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
                  نمایش در فروشگاه
                </div>
              </div>
            </label>
          </Section>

          <Section title="راهنما">
            <ul className="text-[11px] text-coffee-600 leading-6 space-y-1.5">
              <li>• نام شعبه در فرآیند تسویه حساب به کاربر نمایش داده می‌شود</li>
              <li>• اسلاگ برای URL صفحه شعبه استفاده می‌شود</li>
              <li>• پس از ذخیره، می‌توانید موجودی این شعبه را مدیریت کنید</li>
              <li>• شعبه غیرفعال در انتخاب مشتری نمایش داده نمی‌شود</li>
            </ul>
          </Section>
        </div>
      </div>

      <div className="lg:hidden flex items-center gap-2 pt-4 border-t border-coffee-100">
        <Link
          href="/admin/branches"
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