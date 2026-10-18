// components/admin/branches/InventoryTable.tsx
// جدول موجودی محصولات بر اساس وزن

'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchIcon } from '@/components/admin/icons';
import Alert from '@/components/auth/Alert';
import {
  updateProductStockAction,
  bulkUpdateProductStockAction,
  transferProductStockAction,
  resetBranchInventoryAction,
} from '@/app/admin/branches/actions';
import { formatWeight } from '@/lib/utils';
import type {
  BranchProductStock,
  BranchInventoryStats,
} from '@/lib/queries/branches-admin';

interface Props {
  branchId: number;
  branchName: string;
  items: BranchProductStock[];
  stats: BranchInventoryStats;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  currentSearch: string;
  onlyLowStock: boolean;
  otherBranches: Array<{ id: number; name: string }>;
}

export default function InventoryTable({
  branchId,
  branchName,
  items,
  stats,
  totalCount,
  currentPage,
  totalPages,
  currentSearch,
  onlyLowStock,
  otherBranches,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(currentSearch);
  const [editing, setEditing] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>(''); // در گرم
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // انتقال
  const [transferTarget, setTransferTarget] = useState<BranchProductStock | null>(null);
  const [transferGrams, setTransferGrams] = useState('1000');
  const [transferTo, setTransferTo] = useState<number>(otherBranches[0]?.id ?? 0);

  // گروهی
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkValues, setBulkValues] = useState<Record<number, string>>({});

  // ریست
  const [showReset, setShowReset] = useState(false);

  function updateFilters(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') params.delete(key);
      else params.set(key, value);
    }
    if (!updates.page && currentPage !== 1) params.delete('page');
    router.push(`/admin/branches/${branchId}/inventory?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilters({ search: search.trim() || null });
  }

  function startEdit(item: BranchProductStock) {
    setEditing(item.product_id);
    setEditValue(String(item.total_weight_grams));
    setError(null);
  }

  function cancelEdit() {
    setEditing(null);
    setEditValue('');
  }

  function saveEdit(item: BranchProductStock) {
    const newTotal = parseInt(editValue, 10);

    if (isNaN(newTotal) || newTotal < 0) {
      setError('وزن باید عدد صحیح مثبت باشد');
      return;
    }

    if (newTotal === item.total_weight_grams) {
      cancelEdit();
      return;
    }

    startTransition(async () => {
      const result = await updateProductStockAction(
        branchId,
        item.product_id,
        newTotal
      );
      if (result.ok) {
        setSuccess('موجودی به‌روزرسانی شد');
        setEditing(null);
        router.refresh();
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError(result.error);
      }
    });
  }

  function handleTransfer() {
    if (!transferTarget) return;

    const grams = parseInt(transferGrams, 10);
    if (isNaN(grams) || grams <= 0) {
      setError('وزن انتقال باید عدد صحیح مثبت باشد');
      return;
    }

    if (!transferTo || transferTo === branchId) {
      setError('شعبه مقصد را انتخاب کنید');
      return;
    }

    startTransition(async () => {
      const result = await transferProductStockAction(
        branchId,
        transferTo,
        transferTarget.product_id,
        grams
      );
      if (result.ok) {
        setSuccess('انتقال انجام شد');
        setTransferTarget(null);
        setTransferGrams('1000');
        router.refresh();
        setTimeout(() => setSuccess(null), 2500);
      } else {
        setError(result.error);
      }
    });
  }

  function handleBulkSave() {
    const bulkItems: Array<{ productId: number; totalWeightGrams: number }> = [];
    for (const [productIdStr, value] of Object.entries(bulkValues)) {
      const productId = parseInt(productIdStr, 10);
      const weight = parseInt(value, 10);
      if (isNaN(weight) || weight < 0) {
        setError(`وزن نامعتبر برای محصول ${productId}`);
        return;
      }
      bulkItems.push({ productId, totalWeightGrams: weight });
    }

    if (bulkItems.length === 0) {
      setError('هیچ تغییری اعمال نشد');
      return;
    }

    startTransition(async () => {
      const result = await bulkUpdateProductStockAction(branchId, bulkItems);
      if (result.ok) {
        setSuccess(`${result.updated} مورد به‌روزرسانی شد`);
        setBulkMode(false);
        setBulkValues({});
        router.refresh();
        setTimeout(() => setSuccess(null), 2500);
      } else {
        setError(result.error);
      }
    });
  }

  function handleReset() {
    startTransition(async () => {
      const result = await resetBranchInventoryAction(branchId);
      if (result.ok) {
        setSuccess('موجودی شعبه صفر شد');
        setShowReset(false);
        router.refresh();
        setTimeout(() => setSuccess(null), 2500);
      } else {
        setError(result.error);
        setShowReset(false);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* هدر */}
      <div className="rounded-2xl border border-coffee-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/branches"
              className="w-9 h-9 rounded-lg hover:bg-cream-100 flex items-center justify-center text-coffee-500 transition-colors"
              aria-label="بازگشت"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-coffee-900">
                موجودی {branchName}
              </h1>
              <p className="text-xs text-coffee-500 fa-num">
                {totalCount.toLocaleString('fa-IR')} محصول |{' '}
                وزن کل: {formatWeight(stats.totalWeightKg * 1000)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowReset(true)}
            className="text-xs text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            صفر کردن موجودی شعبه
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-xl bg-cream-50 border border-coffee-100 p-3">
            <div className="text-[10px] text-coffee-500 mb-0.5">کل محصولات</div>
            <div className="text-lg font-bold text-coffee-900 fa-num leading-none">
              {stats.totalProducts.toLocaleString('fa-IR')}
            </div>
          </div>
          <div className="rounded-xl bg-brand-50 border border-brand-100 p-3">
            <div className="text-[10px] text-brand-600 mb-0.5">با موجودی</div>
            <div className="text-lg font-bold text-brand-700 fa-num leading-none">
              {stats.productsWithStock.toLocaleString('fa-IR')}
            </div>
          </div>
          <div className="rounded-xl bg-gold-50 border border-gold-100 p-3">
            <div className="text-[10px] text-gold-700 mb-0.5">کم‌موجود</div>
            <div className="text-lg font-bold text-gold-700 fa-num leading-none">
              {stats.productsLowStock.toLocaleString('fa-IR')}
            </div>
          </div>
          <div className="rounded-xl bg-red-50 border border-red-100 p-3">
            <div className="text-[10px] text-red-600 mb-0.5">ناموجود</div>
            <div className="text-lg font-bold text-red-700 fa-num leading-none">
              {stats.productsOutOfStock.toLocaleString('fa-IR')}
            </div>
          </div>
        </div>
      </div>

      {/* فیلترها */}
      <div className="rounded-2xl border border-coffee-200 bg-white p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-coffee-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جست‌وجوی نام محصول..."
              className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-coffee-200 bg-cream-50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl btn-gold text-sm font-bold whitespace-nowrap"
          >
            جست‌وجو
          </button>
        </form>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={(e) =>
                updateFilters({ lowStock: e.target.checked ? '1' : null })
              }
              className="w-4 h-4 accent-gold-500"
            />
            <span className="text-xs text-coffee-700">فقط کم‌موجود</span>
          </label>

          {!bulkMode && items.length > 0 && (
            <button
              type="button"
              onClick={() => setBulkMode(true)}
              className="text-xs text-gold-700 hover:text-gold-800 font-medium"
            >
              ویرایش گروهی
            </button>
          )}

          {bulkMode && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setBulkMode(false);
                  setBulkValues({});
                  setError(null);
                }}
                disabled={isPending}
                className="text-xs text-coffee-500 hover:text-coffee-700 disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleBulkSave}
                disabled={isPending}
                className="text-xs btn-gold px-3 py-1.5 rounded-lg font-bold disabled:opacity-50"
              >
                {isPending ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* جدول */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-coffee-200 bg-white py-16 text-center">
          <p className="text-sm text-coffee-500">
            محصولی با این فیلترها یافت نشد
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-coffee-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-coffee-100">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    محصول
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    وزن کل
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    رزرو
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    قابل فروش
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    واریانت‌ها
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-100">
                {items.map((item) => {
                  const isEditing = editing === item.product_id;
                  const bulkValue =
                    bulkValues[item.product_id] ??
                    String(item.total_weight_grams);

                  return (
                    <tr
                      key={item.product_id}
                      className="hover:bg-cream-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-cream-100 shrink-0 ring-1 ring-coffee-100">
                            {item.image_url ? (
                              <Image
                                src={item.image_url}
                                alt={item.product_name}
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
                            <div className="font-medium text-coffee-900 line-clamp-1 text-xs">
                              {item.product_name}
                            </div>
                            <div className="text-[10px] text-coffee-500">
                              {item.category_name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* وزن کل */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              disabled={isPending}
                              dir="ltr"
                              autoFocus
                              min="0"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit(item);
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              className="w-24 px-2 py-1.5 rounded-lg border border-gold-400 bg-white text-sm text-center outline-none focus:ring-2 focus:ring-gold-500/20 fa-num"
                            />
                            {editValue &&
                              !isNaN(parseInt(editValue, 10)) &&
                              parseInt(editValue, 10) >= 0 && (
                                <div className="text-[10px] text-gold-700 fa-num text-center">
                                  = {formatWeight(parseInt(editValue, 10))}
                                </div>
                              )}
                            <div className="flex items-center gap-1 justify-center">
                              <button
                                type="button"
                                onClick={() => saveEdit(item)}
                                disabled={isPending}
                                className="px-2 py-1 rounded-md bg-brand-500 text-white text-[10px] hover:bg-brand-600 disabled:opacity-50"
                              >
                                ذخیره
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                disabled={isPending}
                                className="px-2 py-1 rounded-md bg-cream-200 text-coffee-600 text-[10px] hover:bg-cream-300 disabled:opacity-50"
                              >
                                انصراف
                              </button>
                            </div>
                          </div>
                        ) : bulkMode ? (
                          <div className="space-y-1">
                            <input
                              type="number"
                              value={bulkValue}
                              onChange={(e) =>
                                setBulkValues((v) => ({
                                  ...v,
                                  [item.product_id]: e.target.value,
                                }))
                              }
                              disabled={isPending}
                              dir="ltr"
                              min="0"
                              className="w-24 px-2 py-1.5 rounded-lg border border-coffee-200 bg-cream-50 text-sm text-center outline-none focus:border-gold-500 fa-num"
                            />
                            {bulkValue &&
                              !isNaN(parseInt(bulkValue, 10)) &&
                              parseInt(bulkValue, 10) >= 0 && (
                                <div className="text-[10px] text-gold-700 fa-num text-center">
                                  = {formatWeight(parseInt(bulkValue, 10))}
                                </div>
                              )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="text-right group"
                          >
                            <div className="font-bold text-coffee-900 fa-num group-hover:text-gold-700 transition-colors">
                              {formatWeight(item.total_weight_grams)}
                            </div>
                            <div className="text-[10px] text-coffee-500 fa-num mt-0.5">
                              {item.total_weight_grams.toLocaleString('fa-IR')} گرم
                            </div>
                          </button>
                        )}
                      </td>

                      {/* رزرو */}
                      <td className="px-4 py-3">
                        {item.reserved_weight_grams > 0 ? (
                          <div className="text-xs">
                            <div className="font-bold text-coffee-600 fa-num">
                              {formatWeight(item.reserved_weight_grams)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-coffee-400">—</span>
                        )}
                      </td>

                      {/* قابل فروش */}
                      <td className="px-4 py-3">
                        <AvailableBadge grams={item.available_weight_grams} />
                      </td>

                      {/* واریانت‌ها */}
                      <td className="px-4 py-3 text-xs text-coffee-600 fa-num">
                        {item.variants_count.toLocaleString('fa-IR')} نوع
                      </td>

                      {/* اکشن */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {otherBranches.length > 0 &&
                            item.available_weight_grams > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTransferTarget(item);
                                  setTransferGrams('1000');
                                  setTransferTo(otherBranches[0].id);
                                  setError(null);
                                }}
                                className="w-8 h-8 rounded-lg hover:bg-gold-50 text-coffee-500 hover:text-gold-700 flex items-center justify-center transition-colors"
                                title="انتقال به شعبه دیگر"
                                aria-label="انتقال"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M7 16V4M7 4L3 8M7 4l4 4" />
                                  <path d="M17 8v12M17 20l4-4M17 20l-4-4" />
                                </svg>
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* صفحه‌بندی */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <button
              type="button"
              onClick={() => updateFilters({ page: String(currentPage - 1) })}
              className="px-4 py-2 rounded-lg bg-white border border-coffee-200 text-coffee-700 text-sm hover:border-gold-400 transition-colors"
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
              onClick={() => updateFilters({ page: String(currentPage + 1) })}
              className="px-4 py-2 rounded-lg btn-gold text-sm font-bold"
            >
              بعدی
            </button>
          )}
        </div>
      )}

      {/* مودال انتقال */}
      {transferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-down">
            <h3 className="text-base font-bold text-coffee-900 mb-1">
              انتقال موجودی
            </h3>
            <p className="text-xs text-coffee-500 mb-5">
              {transferTarget.product_name}
            </p>

            <div className="space-y-4 mb-5">
              <div className="rounded-xl bg-cream-50 border border-coffee-100 p-3">
                <div className="text-[10px] text-coffee-500 mb-1">
                  موجودی قابل انتقال
                </div>
                <div className="text-lg font-bold text-coffee-900 fa-num">
                  {formatWeight(transferTarget.available_weight_grams)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-coffee-800 mb-2">
                  به شعبه
                </label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(Number(e.target.value))}
                  disabled={isPending}
                  className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 bg-cream-50 text-sm outline-none focus:border-gold-500"
                >
                  {otherBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-coffee-800 mb-2">
                  وزن انتقال (گرم)
                </label>
                <input
                  type="number"
                  value={transferGrams}
                  onChange={(e) => setTransferGrams(e.target.value)}
                  disabled={isPending}
                  dir="ltr"
                  min="1"
                  max={transferTarget.available_weight_grams}
                  className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 bg-cream-50 text-sm text-center outline-none focus:border-gold-500 fa-num"
                />
                {transferGrams &&
                  !isNaN(parseInt(transferGrams, 10)) &&
                  parseInt(transferGrams, 10) > 0 && (
                    <div className="text-[11px] text-gold-700 fa-num text-center mt-2">
                      = {formatWeight(parseInt(transferGrams, 10))}
                    </div>
                  )}
              </div>
            </div>

            {error && (
              <div className="mb-4">
                <Alert type="error">{error}</Alert>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setTransferTarget(null);
                  setError(null);
                }}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-cream-100 text-coffee-700 text-sm font-medium hover:bg-cream-200 disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleTransfer}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-xl btn-gold text-sm font-bold disabled:opacity-50"
              >
                {isPending ? 'در حال انتقال...' : 'انتقال'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال ریست */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-slide-down">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <path d="M12 9v4M12 17h.01" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-coffee-900 text-center mb-2">
              صفر کردن موجودی
            </h3>
            <p className="text-sm text-coffee-600 text-center leading-6 mb-5">
              موجودی کل این شعبه صفر می‌شود. این عمل قابل بازگشت نیست.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowReset(false)}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-cream-100 text-coffee-700 text-sm font-medium hover:bg-cream-200 disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50"
              >
                {isPending ? 'در حال انجام...' : 'صفر کن'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AvailableBadge({ grams }: { grams: number }) {
  if (grams <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[11px] font-bold">
        ناموجود
      </span>
    );
  }
  if (grams < 5000) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gold-50 text-gold-700 text-[11px] font-bold fa-num">
        {formatWeight(grams)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 text-[11px] font-bold fa-num">
      {formatWeight(grams)}
    </span>
  );
}