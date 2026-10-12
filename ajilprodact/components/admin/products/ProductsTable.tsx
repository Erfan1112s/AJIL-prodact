// components/admin/products/ProductsTable.tsx
// جدول محصولات با فیلتر، جست‌وجو و ویرایش سریع قیمت

'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  EditIcon,
  TrashIcon,
  SearchIcon,
} from '@/components/admin/icons';
import QuickPriceEdit from '@/components/admin/products/QuickPriceEdit';
import { formatPrice } from '@/lib/utils';
import {
  deleteProductAction,
  toggleProductActiveAction,
} from '@/app/admin/products/actions';
import type { AdminProductListItem } from '@/lib/queries/products-admin';
import type { CategorySummary } from '@/lib/types';

interface Props {
  products: AdminProductListItem[];
  categories: CategorySummary[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  currentSearch: string;
  currentCategory: number | null;
  currentStatus: 'all' | 'active' | 'inactive';
}

interface QuickEditTarget {
  id: number;
  product_name: string;
  weight_gram: number;
  price: number;
  compare_price: number | null;
}

export default function ProductsTable({
  products,
  categories,
  totalCount,
  currentPage,
  totalPages,
  currentSearch,
  currentCategory,
  currentStatus,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(currentSearch);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [quickEditTarget, setQuickEditTarget] =
    useState<QuickEditTarget | null>(null);
  const [quickEditLoading, setQuickEditLoading] = useState<number | null>(null);

  // به‌روزرسانی URL با فیلترها
  function updateFilters(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    if (!updates.page && currentPage !== 1) {
      params.delete('page');
    }

    router.push(`/admin/products?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilters({ search: search.trim() || null });
  }

  function handleToggleActive(productId: number, isActive: boolean) {
    startTransition(async () => {
      const result = await toggleProductActiveAction(productId, !isActive);
      if (result.ok) {
        router.refresh();
      } else {
        alert(result.error);
      }
    });
  }

  function handleDelete(productId: number) {
    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (result.ok) {
        setConfirmDelete(null);
        router.refresh();
      } else {
        alert(result.error);
        setConfirmDelete(null);
      }
    });
  }

  // باز کردن مودال ویرایش سریع قیمت
  async function handleQuickPriceEdit(
    productId: number,
    productName: string
  ) {
    setQuickEditLoading(productId);

    try {
      const res = await fetch(
        `/api/admin/products/${productId}/first-variant`
      );
      const data = (await res.json()) as {
        ok: boolean;
        variant?: {
          id: number;
          weight_gram: number;
          price: number;
          compare_price: number | null;
        };
      };

      if (data.ok && data.variant) {
        setQuickEditTarget({
          ...data.variant,
          product_name: productName,
        });
      } else {
        alert('این محصول واریانت فعال ندارد');
      }
    } catch {
      alert('خطا در دریافت اطلاعات');
    } finally {
      setQuickEditLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* ==========================================
          فیلترها
          ========================================== */}
      <div className="rounded-2xl border border-coffee-200 bg-white p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <form onSubmit={handleSearch} className="sm:col-span-5">
            <div className="relative">
              <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-coffee-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جست‌وجوی نام یا اسلاگ..."
                className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-coffee-200 bg-cream-50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all text-sm"
              />
            </div>
          </form>

          <div className="sm:col-span-4">
            <select
              value={currentCategory ?? ''}
              onChange={(e) =>
                updateFilters({ category: e.target.value || null })
              }
              className="w-full px-3 py-2.5 rounded-xl border border-coffee-200 bg-cream-50 focus:bg-white focus:border-gold-500 outline-none text-sm"
            >
              <option value="">همه دسته‌بندی‌ها</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={currentStatus}
              onChange={(e) =>
                updateFilters({
                  status: e.target.value === 'all' ? null : e.target.value,
                })
              }
              className="w-full px-3 py-2.5 rounded-xl border border-coffee-200 bg-cream-50 focus:bg-white focus:border-gold-500 outline-none text-sm"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فقط فعال</option>
              <option value="inactive">فقط غیرفعال</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-coffee-100">
          <div className="text-xs text-coffee-500 fa-num">
            {totalCount.toLocaleString('fa-IR')} محصول
          </div>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl btn-gold text-xs font-bold"
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
            افزودن محصول
          </Link>
        </div>
      </div>

      {/* ==========================================
          جدول / کارت‌ها
          ========================================== */}
      {products.length === 0 ? (
        <div className="rounded-2xl border border-coffee-200 bg-white py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cream-100 mx-auto mb-4 flex items-center justify-center text-coffee-400">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z" />
            </svg>
          </div>
          <p className="text-sm text-coffee-500 mb-4">
            محصولی با این فیلترها یافت نشد
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-coffee-200 bg-white overflow-hidden">
          {/* دسکتاپ */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-coffee-100">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    محصول
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    دسته
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    وزن‌ها
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    قیمت
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    موجودی
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    وضعیت
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-100">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-cream-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-cream-100 shrink-0 ring-1 ring-coffee-100">
                          {product.primary_image ? (
                            <Image
                              src={product.primary_image}
                              alt={product.name}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-coffee-300 text-[10px]">
                              بدون
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-coffee-900 line-clamp-1">
                            {product.name}
                          </div>
                          <div
                            className="text-[11px] text-coffee-400 fa-num truncate"
                            dir="ltr"
                          >
                            {product.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-coffee-700 text-xs">
                      {product.category_name}
                    </td>

                    <td className="px-4 py-3 text-coffee-700 text-xs fa-num">
                      {product.variants_count.toLocaleString('fa-IR')} وزن
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-xs text-coffee-700 fa-num">
                        {product.variants_count > 0 ? (
                          product.min_price === product.max_price ? (
                            <>{formatPrice(product.min_price)}</>
                          ) : (
                            <>
                              {formatPrice(product.min_price)} -{' '}
                              {formatPrice(product.max_price)}
                            </>
                          )
                        ) : (
                          <span className="text-coffee-400">—</span>
                        )}
                      </div>
                      <div className="text-[10px] text-coffee-400">تومان</div>
                    </td>

                    <td className="px-4 py-3">
                      <StockBadge stock={Number(product.total_stock)} />
                    </td>

                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleActive(
                            product.id,
                            product.is_active === 1
                          )
                        }
                        disabled={isPending}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50 ${
                          product.is_active === 1
                            ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                            : 'bg-cream-100 text-coffee-500 hover:bg-cream-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            product.is_active === 1
                              ? 'bg-brand-500'
                              : 'bg-coffee-400'
                          }`}
                        />
                        {product.is_active === 1 ? 'فعال' : 'غیرفعال'}
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {/* ویرایش سریع قیمت */}
                        {product.variants_count > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              handleQuickPriceEdit(product.id, product.name)
                            }
                            disabled={quickEditLoading === product.id}
                            className="w-8 h-8 rounded-lg hover:bg-gold-50 text-coffee-500 hover:text-gold-700 flex items-center justify-center transition-colors disabled:opacity-50"
                            aria-label="ویرایش سریع قیمت"
                            title="ویرایش سریع قیمت"
                          >
                            {quickEditLoading === product.id ? (
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
                            ) : (
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
                                <rect x="3" y="6" width="18" height="12" rx="2" />
                                <circle cx="12" cy="12" r="2" />
                                <path d="M7 6V4M17 6V4" />
                              </svg>
                            )}
                          </button>
                        )}

                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="w-8 h-8 rounded-lg hover:bg-gold-50 text-coffee-500 hover:text-gold-700 flex items-center justify-center transition-colors"
                          aria-label="ویرایش"
                        >
                          <EditIcon className="w-4 h-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => setConfirmDelete(product.id)}
                          className="w-8 h-8 rounded-lg hover:bg-red-50 text-coffee-500 hover:text-red-600 flex items-center justify-center transition-colors"
                          aria-label="حذف"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* موبایل */}
          <div className="md:hidden divide-y divide-coffee-100">
            {products.map((product) => (
              <div key={product.id} className="p-4">
                <div className="flex gap-3 mb-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-cream-100 shrink-0">
                    {product.primary_image ? (
                      <Image
                        src={product.primary_image}
                        alt={product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-coffee-300 text-[10px]">
                        بدون
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-coffee-900 mb-1 line-clamp-2">
                      {product.name}
                    </div>
                    <div className="text-[11px] text-coffee-500 mb-2">
                      {product.category_name}
                    </div>
                    <StockBadge stock={Number(product.total_stock)} />
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-coffee-600 fa-num">
                    {product.variants_count.toLocaleString('fa-IR')} وزن |{' '}
                    {formatPrice(product.min_price)} تومان
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleActive(product.id, product.is_active === 1)
                    }
                    disabled={isPending}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${
                      product.is_active === 1
                        ? 'bg-brand-50 text-brand-700'
                        : 'bg-cream-100 text-coffee-500'
                    }`}
                  >
                    {product.is_active === 1 ? 'فعال' : 'غیرفعال'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {product.variants_count > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickPriceEdit(product.id, product.name)
                      }
                      disabled={quickEditLoading === product.id}
                      className="px-3 py-2 rounded-lg bg-gold-50 text-gold-700 text-xs font-medium hover:bg-gold-100 transition-colors disabled:opacity-50"
                      title="ویرایش قیمت"
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
                        <rect x="3" y="6" width="18" height="12" rx="2" />
                        <circle cx="12" cy="12" r="2" />
                      </svg>
                    </button>
                  )}

                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cream-100 text-coffee-700 text-xs font-medium hover:bg-cream-200 transition-colors"
                  >
                    <EditIcon className="w-3.5 h-3.5" />
                    ویرایش
                  </Link>

                  <button
                    type="button"
                    onClick={() => setConfirmDelete(product.id)}
                    className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* صفحه‌بندی */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <button
              type="button"
              onClick={() =>
                updateFilters({ page: String(currentPage - 1) })
              }
              className="px-3 py-2 rounded-lg bg-white border border-coffee-200 text-coffee-700 text-sm hover:border-gold-400 transition-colors"
            >
              قبلی
            </button>
          )}
          <span className="text-xs text-coffee-500 fa-num">
            صفحه {currentPage.toLocaleString('fa-IR')} از{' '}
            {totalPages.toLocaleString('fa-IR')}
          </span>
          {currentPage < totalPages && (
            <button
              type="button"
              onClick={() =>
                updateFilters({ page: String(currentPage + 1) })
              }
              className="px-3 py-2 rounded-lg btn-gold text-sm"
            >
              بعدی
            </button>
          )}
        </div>
      )}

      {/* Dialog تایید حذف */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-slide-down">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <TrashIcon className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-base font-bold text-coffee-900 text-center mb-2">
              حذف محصول
            </h3>
            <p className="text-sm text-coffee-600 text-center leading-6 mb-5">
              آیا از حذف این محصول مطمئن هستید؟ این عمل قابل بازگشت نیست.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-cream-100 text-coffee-700 text-sm font-medium hover:bg-cream-200 disabled:opacity-50 transition-colors"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDelete)}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'در حال حذف...' : 'حذف کن'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال ویرایش سریع قیمت */}
      {quickEditTarget && (
        <QuickPriceEdit
          variant={quickEditTarget}
          onClose={() => setQuickEditTarget(null)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}

// نشان موجودی
function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[11px] font-bold fa-num">
        ناموجود
      </span>
    );
  }
  if (stock < 5) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gold-50 text-gold-700 text-[11px] font-bold fa-num">
        {stock.toLocaleString('fa-IR')} عدد
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 text-[11px] font-bold fa-num">
      {stock.toLocaleString('fa-IR')} عدد
    </span>
  );
}