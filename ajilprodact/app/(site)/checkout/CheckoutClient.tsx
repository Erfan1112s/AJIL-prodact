// components/checkout/CheckoutClient.tsx
// فرم تسویه حساب و خلاصه سفارش

'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FormField from '@/components/auth/FormField';
import Alert from '@/components/auth/Alert';
import SubmitButton from '@/components/auth/SubmitButton';
import { useCart } from '@/lib/cart/CartContext';
import { PROVINCES, getCitiesOfProvince } from '@/lib/shipping/provinces';
import { calculateShippingOptions } from '@/lib/shipping/calculator';
import { submitOrderAction } from '@/app/checkout/actions';
import type { DeliveryMethod, ShippingProvider } from '@/lib/types';

interface Props {
  customer: {
    phone: string;
    fullName: string;
    email: string;
    defaultAddress: string;
  };
  branches: Array<{
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
  }>;
}

function formatPrice(price: number): string {
  return price.toLocaleString('fa-IR');
}

export default function CheckoutClient({ customer, branches }: Props) {
  const router = useRouter();
  const { items, totalPrice, hydrated } = useCart();
  const [isPending, startTransition] = useTransition();

  // state فرم
  const [fullName, setFullName] = useState(customer.fullName);
  const [phone, setPhone] = useState(customer.phone);
  const [email, setEmail] = useState(customer.email);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('SHIPPING');
  const [shippingProvider, setShippingProvider] = useState<ShippingProvider>('POST');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState(customer.defaultAddress);
  const [postalCode, setPostalCode] = useState('');
  const [branchId, setBranchId] = useState<number | null>(branches[0]?.id ?? null);
  const [note, setNote] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // محاسبه وزن و هزینه ارسال
  const shippingResult = useMemo(() => {
    if (deliveryMethod !== 'SHIPPING' || !province || !city || !items.length) {
      return null;
    }
    const totalWeight = items.reduce(
      (sum, item) => sum + item.weightGram * item.quantity,
      0
    );
    return calculateShippingOptions({
      province,
      city,
      totalWeightGram: totalWeight,
      subtotal: totalPrice,
    });
  }, [deliveryMethod, province, city, items, totalPrice]);

  // هزینه ارسال انتخاب‌شده
  const shippingCost = useMemo(() => {
    if (deliveryMethod === 'PICKUP') return 0;
    if (!shippingResult) return 0;
    const option = shippingResult.options.find(
      (o) => o.provider === shippingProvider
    );
    return option?.cost ?? 0;
  }, [deliveryMethod, shippingResult, shippingProvider]);

  const finalTotal = totalPrice + shippingCost;
  const cities = province ? getCitiesOfProvince(province) : [];

  // اگر سبد خالی است
  if (hydrated && items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-full bg-cream-100 mx-auto mb-6 flex items-center justify-center">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-coffee-400"
          >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-coffee-900 mb-2">
          سبد خرید شما خالی است
        </h2>
        <p className="text-coffee-500 text-sm mb-6">
          برای تسویه حساب، ابتدا محصولی به سبد اضافه کنید.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 btn-gold px-6 py-3 rounded-xl text-sm"
        >
          مشاهده محصولات
        </Link>
      </div>
    );
  }

  // اعتبارسنجی سمت کلاینت
  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!fullName || fullName.trim().length < 3) {
      newErrors.fullName = 'نام و نام خانوادگی را وارد کنید';
    }
    if (!/^09\d{9}$/.test(phone)) {
      newErrors.phone = 'شماره موبایل نامعتبر است';
    }

    if (deliveryMethod === 'SHIPPING') {
      if (!province) newErrors.province = 'استان را انتخاب کنید';
      if (!city) newErrors.city = 'شهر را انتخاب کنید';
      if (!address || address.trim().length < 10) {
        newErrors.address = 'آدرس کامل را وارد کنید';
      }
      if (!/^\d{10}$/.test(postalCode)) {
        newErrors.postalCode = 'کد پستی باید 10 رقم باشد';
      }
    } else {
      if (!branchId) newErrors.branchId = 'شعبه را انتخاب کنید';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ارسال
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validate()) {
      setError('لطفاً خطاهای فرم را برطرف کنید.');
      return;
    }

    startTransition(async () => {
      try {
        const result = await submitOrderAction({
          fullName: fullName.trim(),
          phone,
          email: email.trim(),
          deliveryMethod,
          shippingProvider: deliveryMethod === 'SHIPPING' ? shippingProvider : 'NONE',
          address: address.trim(),
          city,
          province,
          postalCode,
          note: note.trim(),
          branchId: deliveryMethod === 'PICKUP' ? branchId : null,
          items: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        });

        if (!result.ok) {
          setError(result.error);
          return;
        }

        // انتقال به درگاه پرداخت
        if (result.isMock) {
          // در حالت mock، مستقیم به callback برو
          window.location.href = result.paymentUrl;
        } else {
          window.location.href = result.paymentUrl;
        }
      } catch (err) {
        console.error(err);
        setError('خطای غیرمنتظره. لطفاً دوباره تلاش کنید.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ستون اصلی: فرم */}
      <div className="lg:col-span-2 space-y-5">
        {/* بخش 1: اطلاعات تماس */}
        <Section title="اطلاعات تماس">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="نام و نام خانوادگی"
              name="fullName"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors((x) => ({ ...x, fullName: '' }));
              }}
              disabled={isPending}
              error={errors.fullName || null}
            />

            <FormField
              label="شماره موبایل"
              name="phone"
              type="tel"
              inputMode="numeric"
              dir="ltr"
              centered
              faNumeric
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 11));
                if (errors.phone) setErrors((x) => ({ ...x, phone: '' }));
              }}
              disabled={isPending}
              error={errors.phone || null}
            />

            <div className="sm:col-span-2">
              <FormField
                label="ایمیل (اختیاری)"
                name="email"
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                hint="برای دریافت فاکتور الکترونیکی"
              />
            </div>
          </div>
        </Section>

        {/* بخش 2: روش تحویل */}
        <Section title="روش تحویل">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <RadioCard
              active={deliveryMethod === 'SHIPPING'}
              onClick={() => setDeliveryMethod('SHIPPING')}
              disabled={isPending}
              title="ارسال به آدرس"
              desc="تحویل توسط اسنپ یا پست"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 4h13v12H1z" />
                  <path d="M14 8h4l3 3v5h-7" />
                  <circle cx="5.5" cy="18" r="1.5" />
                  <circle cx="17.5" cy="18" r="1.5" />
                </svg>
              }
            />
            <RadioCard
              active={deliveryMethod === 'PICKUP'}
              onClick={() => setDeliveryMethod('PICKUP')}
              disabled={isPending}
              title="تحویل حضوری"
              desc="از شعبه، بدون هزینه ارسال"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <path d="M9 22V12h6v10" />
                </svg>
              }
            />
          </div>
        </Section>

        {/* بخش 3: اطلاعات ارسال */}
        {deliveryMethod === 'SHIPPING' && (
          <Section title="آدرس تحویل">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-coffee-800 mb-2">
                  استان
                </label>
                <select
                  value={province}
                  onChange={(e) => {
                    setProvince(e.target.value);
                    setCity('');
                    if (errors.province) setErrors((x) => ({ ...x, province: '' }));
                  }}
                  disabled={isPending}
                  className={`w-full px-4 py-3 rounded-xl border bg-cream-50 outline-none transition-all ${
                    errors.province
                      ? 'border-red-300'
                      : 'border-coffee-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
                  }`}
                >
                  <option value="">انتخاب کنید...</option>
                  {PROVINCES.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {errors.province && (
                  <p className="text-xs text-red-600 mt-1.5">{errors.province}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-coffee-800 mb-2">
                  شهر
                </label>
                <select
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (errors.city) setErrors((x) => ({ ...x, city: '' }));
                  }}
                  disabled={isPending || !province}
                  className={`w-full px-4 py-3 rounded-xl border bg-cream-50 outline-none transition-all disabled:opacity-50 ${
                    errors.city
                      ? 'border-red-300'
                      : 'border-coffee-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
                  }`}
                >
                  <option value="">انتخاب کنید...</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {errors.city && (
                  <p className="text-xs text-red-600 mt-1.5">{errors.city}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-coffee-800 mb-2">
                  آدرس دقیق
                </label>
                <textarea
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors((x) => ({ ...x, address: '' }));
                  }}
                  disabled={isPending}
                  rows={3}
                  placeholder="خیابان، کوچه، پلاک، واحد"
                  className={`w-full px-4 py-3 rounded-xl border bg-cream-50 outline-none transition-all resize-none ${
                    errors.address
                      ? 'border-red-300'
                      : 'border-coffee-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
                  }`}
                />
                {errors.address && (
                  <p className="text-xs text-red-600 mt-1.5">{errors.address}</p>
                )}
              </div>

              <FormField
                label="کد پستی"
                name="postalCode"
                type="text"
                inputMode="numeric"
                dir="ltr"
                centered
                faNumeric
                value={postalCode}
                onChange={(e) => {
                  setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 10));
                  if (errors.postalCode) setErrors((x) => ({ ...x, postalCode: '' }));
                }}
                disabled={isPending}
                error={errors.postalCode || null}
              />
            </div>

            {/* انتخاب شرکت ارسال */}
            {shippingResult?.canShip && shippingResult.options.length > 0 && (
              <div className="mt-5">
                <label className="block text-sm font-medium text-coffee-800 mb-3">
                  روش ارسال
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shippingResult.options.map((opt) => (
                    <button
                      key={opt.provider}
                      type="button"
                      onClick={() => setShippingProvider(opt.provider)}
                      disabled={isPending}
                      className={`text-right p-4 rounded-xl border-2 transition-all ${
                        shippingProvider === opt.provider
                          ? 'border-gold-500 bg-gold-50'
                          : 'border-coffee-200 bg-white hover:border-gold-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="font-bold text-sm text-coffee-900">
                          {opt.label}
                        </div>
                        <div
                          className={`text-sm font-bold fa-num ${
                            opt.isFree ? 'text-brand-600' : 'text-coffee-900'
                          }`}
                        >
                          {opt.isFree
                            ? 'رایگان'
                            : `${formatPrice(opt.cost)} تومان`}
                        </div>
                      </div>
                      <div className="text-xs text-coffee-500 leading-5">
                        {opt.description}
                      </div>
                      <div className="text-[11px] text-coffee-400 mt-1">
                        زمان تقریبی: {opt.estimatedDays}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {shippingResult && !shippingResult.canShip && (
              <div className="mt-5">
                <Alert type="error">
                  {shippingResult.message ?? 'ارسال به این منطقه امکان‌پذیر نیست'}
                </Alert>
              </div>
            )}
          </Section>
        )}

        {/* بخش 4: انتخاب شعبه */}
        {deliveryMethod === 'PICKUP' && (
          <Section title="انتخاب شعبه">
            <div className="space-y-2">
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => {
                    setBranchId(branch.id);
                    if (errors.branchId) setErrors((x) => ({ ...x, branchId: '' }));
                  }}
                  disabled={isPending}
                  className={`w-full text-right p-4 rounded-xl border-2 transition-all ${
                    branchId === branch.id
                      ? 'border-gold-500 bg-gold-50'
                      : 'border-coffee-200 bg-white hover:border-gold-300'
                  }`}
                >
                  <div className="font-bold text-sm text-coffee-900 mb-1">
                    {branch.name}
                  </div>
                  {branch.address && (
                    <div className="text-xs text-coffee-500 leading-5">
                      {branch.address}
                    </div>
                  )}
                  {branch.phone && (
                    <div className="text-[11px] text-coffee-400 mt-1 fa-num" dir="ltr">
                      {branch.phone}
                    </div>
                  )}
                </button>
              ))}
            </div>
            {errors.branchId && (
              <p className="text-xs text-red-600 mt-2">{errors.branchId}</p>
            )}
          </Section>
        )}

        {/* یادداشت */}
        <Section title="یادداشت (اختیاری)">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isPending}
            rows={2}
            placeholder="مثال: سفارش را بعد از ساعت ۱۷ ارسال کنید"
            className="w-full px-4 py-3 rounded-xl border border-coffee-200 bg-cream-50 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all resize-none"
          />
        </Section>

        {error && <Alert type="error">{error}</Alert>}
      </div>

      {/* ستون خلاصه سفارش */}
      <div className="lg:col-span-1">
        <div className="rounded-2xl border border-coffee-200 bg-white p-5 lg:sticky lg:top-24">
          <h3 className="text-base font-bold text-coffee-900 mb-4">
            خلاصه سفارش
          </h3>

          {/* لیست اقلام */}
          <div className="space-y-3 pb-4 border-b border-coffee-100 max-h-[300px] overflow-y-auto">
            {items.map((item) => (
              <div key={item.variantId} className="flex gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-coffee-800 line-clamp-1">
                    {item.productName}
                  </div>
                  <div className="text-xs text-coffee-500 fa-num">
                    {item.weightGram.toLocaleString('fa-IR')} گرم ×{' '}
                    {item.quantity.toLocaleString('fa-IR')}
                  </div>
                </div>
                <div className="font-bold text-coffee-900 fa-num shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* مبالغ */}
          <div className="space-y-2 py-4 border-b border-coffee-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-coffee-600">جمع کالاها</span>
              <span className="font-medium text-coffee-900 fa-num">
                {formatPrice(totalPrice)} تومان
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-coffee-600">هزینه ارسال</span>
              <span
                className={`font-medium fa-num ${
                  shippingCost === 0 ? 'text-brand-600' : 'text-coffee-900'
                }`}
              >
                {deliveryMethod === 'PICKUP'
                  ? 'حضوری'
                  : shippingCost === 0
                    ? 'رایگان'
                    : `${formatPrice(shippingCost)} تومان`}
              </span>
            </div>
          </div>

          {/* مبلغ نهایی */}
          <div className="py-4 flex items-center justify-between">
            <span className="text-sm font-bold text-coffee-900">
              مبلغ قابل پرداخت
            </span>
            <div className="text-left">
              <div className="text-lg font-bold text-gradient-gold fa-num">
                {formatPrice(finalTotal)}
              </div>
              <div className="text-[10px] text-coffee-500">تومان</div>
            </div>
          </div>

          <SubmitButton loading={isPending}>پرداخت و ثبت سفارش</SubmitButton>

          <Link
            href="/cart"
            className="block text-center mt-3 text-xs text-coffee-500 hover:text-coffee-800 transition-colors"
          >
            بازگشت به سبد خرید
          </Link>
        </div>
      </div>
    </form>
  );
}

// ==========================================
// کامپوننت‌های کمکی
// ==========================================

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

function RadioCard({
  active,
  onClick,
  disabled,
  title,
  desc,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-right p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
        active
          ? 'border-gold-500 bg-gold-50'
          : 'border-coffee-200 bg-white hover:border-gold-300'
      } disabled:opacity-50`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          active
            ? 'bg-gold-500 text-coffee-900'
            : 'bg-cream-100 text-coffee-600'
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-coffee-900 mb-0.5">{title}</div>
        <div className="text-xs text-coffee-500 leading-5">{desc}</div>
      </div>
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
          active ? 'border-gold-500' : 'border-coffee-300'
        }`}
      >
        {active && <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
      </div>
    </button>
  );
}