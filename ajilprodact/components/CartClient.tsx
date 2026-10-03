// components/CartClient.tsx
// محتوای صفحه سبد خرید
// Client Component چون از useCart استفاده می‌کند

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart/CartContext';
import { CartIcon, ArrowLeftIcon } from '@/components/icons';
import type { CartItem } from '@/lib/cart/types';

// تابع کمکی برای نمایش قیمت
function formatPrice(price: number): string {
    return price.toLocaleString('fa-IR');
}

export default function CartClient() {
    const {
        items,
        hydrated,
        removeItem,
        updateQuantity,
        totalCount,
        totalPrice,
    } = useCart();

    // در انتظار بارگذاری از localStorage
    if (!hydrated) {
        return (
            <div className="py-20 text-center text-coffee-400">
                در حال بارگذاری سبد خرید...
            </div>
        );
    }

    // سبد خالی
    if (items.length === 0) {
        return (
            <div className="py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-cream-100 mx-auto mb-6 flex items-center justify-center">
                    <CartIcon className="w-9 h-9 text-coffee-400" />
                </div>
                <h2 className="text-xl font-bold text-coffee-900 mb-2">
                    سبد خرید شما خالی است
                </h2>
                <p className="text-coffee-500 text-sm mb-6">
                    هنوز محصولی به سبد اضافه نکرده‌اید.
                </p>
                <Link
                    href="/products"
                    className="inline-flex items-center gap-2 btn-gold px-6 py-3 rounded-xl text-sm"
                >
                    مشاهده محصولات
                    <ArrowLeftIcon className="w-4 h-4" />
                </Link>
            </div>
        );
    }

    // محاسبه هزینه ارسال
    // فعلا ثابت: بالای 500 هزار تومان رایگان، وگرنه 50 هزار
    const freeShippingThreshold = 500_000;
    const shippingCost = totalPrice >= freeShippingThreshold ? 0 : 50_000;
    const finalTotal = totalPrice + shippingCost;
    const remainingForFreeShipping = Math.max(
        0,
        freeShippingThreshold - totalPrice
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* لیست آیتم‌ها */}
            <div className="lg:col-span-2 space-y-3">
                {items.map((item) => (
                    <CartItemRow
                        key={item.variantId}
                        item={item}
                        onRemove={() => removeItem(item.variantId)}
                        onQuantityChange={(qty) =>
                            updateQuantity(item.variantId, qty)
                        }
                    />
                ))}
            </div>

            {/* خلاصه سفارش - در دسکتاپ چسبیده */}
            <div className="lg:col-span-1">
                <div className="rounded-2xl border border-coffee-200 bg-white p-5 lg:sticky lg:top-24">
                    <h3 className="text-base font-bold text-coffee-900 mb-4">
                        خلاصه سفارش
                    </h3>

                    <div className="space-y-3 pb-4 border-b border-coffee-100">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-coffee-600">تعداد اقلام</span>
                            <span className="font-medium text-coffee-900 fa-num">
                                {totalCount.toLocaleString('fa-IR')} عدد
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-coffee-600">جمع کالاها</span>
                            <span className="font-medium text-coffee-900 fa-num">
                                {formatPrice(totalPrice)} تومان
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-coffee-600">هزینه ارسال</span>
                            <span
                                className={`font-medium fa-num ${shippingCost === 0
                                        ? 'text-brand-600'
                                        : 'text-coffee-900'
                                    }`}
                            >
                                {shippingCost === 0
                                    ? 'رایگان'
                                    : `${formatPrice(shippingCost)} تومان`}
                            </span>
                        </div>

                        {/* نشان ارسال رایگان */}
                        {remainingForFreeShipping > 0 && (
                            <div className="rounded-lg bg-gold-50 border border-gold-200 p-2.5 text-[11px] text-gold-700 leading-5">
                                {formatPrice(remainingForFreeShipping)} تومان دیگر تا
                                ارسال رایگان
                            </div>
                        )}
                    </div>

                    {/* جمع کل */}
                    <div className="py-4 flex items-center justify-between">
                        <span className="text-sm font-semibold text-coffee-900">
                            مبلغ قابل پرداخت
                        </span>
                        <div className="text-left">
                            <div className="text-lg font-bold text-gradient-gold fa-num">
                                {formatPrice(finalTotal)}
                            </div>
                            <div className="text-[10px] text-coffee-500">تومان</div>
                        </div>
                    </div>

                    {/* دکمه‌ها */}
                    <div className="space-y-2">
                        <Link
                            href="/checkout"
                            className="w-full inline-flex items-center justify-center gap-2 btn-gold shimmer-line py-3.5 rounded-xl text-sm"
                        >
                            تسویه حساب
                            <ArrowLeftIcon className="w-4 h-4" />
                        </Link>

                        <Link
                            href="/products"
                            className="w-full inline-flex items-center justify-center gap-2 bg-white border border-coffee-200 hover:border-gold-500 hover:text-gold-700 text-coffee-800 py-3 rounded-xl text-sm font-medium transition-colors"
                        >
                            ادامه خرید
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// کامپوننت کمکی: ردیف هر آیتم سبد
// ==========================================

interface CartItemRowProps {
    item: CartItem;
    onRemove: () => void;
    onQuantityChange: (qty: number) => void;
}

function CartItemRow({
    item,
    onRemove,
    onQuantityChange,
}: CartItemRowProps) {
    return (
        <div className="rounded-2xl border border-coffee-200 bg-white p-4 flex gap-4">
            {/* تصویر */}
            <Link
                href={`/products/${item.productSlug}`}
                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-cream-100 shrink-0"
            >
                {item.imageUrl ? (
                    <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        sizes="96px"
                        className="object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-coffee-300">
                        <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-5-5L5 21" />
                        </svg>
                    </div>
                )}
            </Link>

            {/* اطلاعات */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <Link
                            href={`/products/${item.productSlug}`}
                            className="font-bold text-sm text-coffee-900 hover:text-gold-700 transition-colors line-clamp-2 leading-6"
                        >
                            {item.productName}
                        </Link>
                        <div className="text-xs text-coffee-500 mt-1 fa-num">
                            {item.weightGram.toLocaleString('fa-IR')} گرم
                        </div>
                    </div>

                    {/* دکمه حذف */}
                    <button
                        type="button"
                        onClick={onRemove}
                        className="w-8 h-8 rounded-lg hover:bg-red-50 text-coffee-400 hover:text-red-600 flex items-center justify-center transition-colors shrink-0"
                        aria-label="حذف از سبد"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M3 6h18" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                        </svg>
                    </button>
                </div>

                {/* ردیف پایین: تعداد و قیمت */}
                <div className="flex items-end justify-between gap-3 mt-3">
                    {/* کنترل تعداد */}
                    <div className="flex items-center gap-1 border border-coffee-200 rounded-lg">
                        <button
                            type="button"
                            onClick={() => onQuantityChange(item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-8 h-8 flex items-center justify-center text-coffee-600 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-r-lg transition-colors"
                            aria-label="کاهش تعداد"
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            >
                                <path d="M5 12h14" />
                            </svg>
                        </button>

                        <span className="w-8 text-center text-sm font-bold text-coffee-900 fa-num">
                            {item.quantity.toLocaleString('fa-IR')}
                        </span>

                        <button
                            type="button"
                            onClick={() => onQuantityChange(item.quantity + 1)}
                            disabled={item.quantity >= 10}
                            className="w-8 h-8 flex items-center justify-center text-coffee-600 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-l-lg transition-colors"
                            aria-label="افزایش تعداد"
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            >
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                        </button>
                    </div>

                    {/* قیمت */}
                    <div className="text-left">
                        <div className="text-base font-bold text-coffee-900 fa-num">
                            {formatPrice(item.price * item.quantity)}
                        </div>
                        <div className="text-[10px] text-coffee-500">تومان</div>
                    </div>
                </div>
            </div>
        </div>
    );
}