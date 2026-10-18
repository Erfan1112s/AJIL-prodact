// components/admin/categories/CategoriesTable.tsx
// جدول درختی دسته‌بندی‌ها

'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  EditIcon,
  TrashIcon,
  PlusIcon,
} from '@/components/admin/icons';
import {
  deleteCategoryAction,
  toggleCategoryActiveAction,
} from '@/app/admin/categories/actions';
import type { AdminCategoryNode } from '@/lib/queries/categories-admin';

interface Props {
  tree: AdminCategoryNode[];
}

export default function CategoriesTable({ tree }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(
    () => new Set(tree.filter((n) => n.children.length > 0).map((n) => n.id))
  );

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleToggleActive(id: number, isActive: boolean) {
    startTransition(async () => {
      const result = await toggleCategoryActiveAction(id, !isActive);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (result.ok) {
        setConfirmDelete(null);
        router.refresh();
      } else {
        setError(result.error);
        setConfirmDelete(null);
      }
    });
  }

  const totalCount = countAll(tree);

  return (
    <div className="space-y-4">
      {/* هدر */}
      <div className="rounded-2xl border border-coffee-200 bg-white p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm font-bold text-coffee-900">
            دسته‌بندی‌های محصولات
          </div>
          <div className="text-xs text-coffee-500 mt-0.5 fa-num">
            {totalCount.toLocaleString('fa-IR')} دسته در ساختار درختی
          </div>
        </div>
        <Link
          href="/admin/categories/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl btn-gold text-xs font-bold"
        >
          <PlusIcon className="w-4 h-4" />
          افزودن دسته
        </Link>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* جدول */}
      {tree.length === 0 ? (
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
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </div>
          <p className="text-sm text-coffee-500 mb-4">
            هنوز دسته‌بندی ثبت نشده است
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-coffee-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-coffee-100">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    نام دسته
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    اسلاگ
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    محصولات
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    ترتیب
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-xs text-coffee-600">
                    وضعیت
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-100">
                {tree.map((node) => (
                  <CategoryRowRecursive
                    key={node.id}
                    node={node}
                    expanded={expanded}
                    onToggleExpand={toggleExpand}
                    onToggleActive={handleToggleActive}
                    onDelete={(id, name) => setConfirmDelete({ id, name })}
                    isPending={isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialog تأیید حذف */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-slide-down">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <TrashIcon className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-base font-bold text-coffee-900 text-center mb-2">
              حذف دسته‌بندی
            </h3>
            <p className="text-sm text-coffee-600 text-center leading-6 mb-1">
              آیا از حذف «{confirmDelete.name}» مطمئن هستید؟
            </p>
            <p className="text-xs text-coffee-500 text-center mb-5">
              این عمل قابل بازگشت نیست.
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
                onClick={() => handleDelete(confirmDelete.id)}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'در حال حذف...' : 'حذف کن'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ردیف بازگشتی
// ==========================================

function CategoryRowRecursive({
  node,
  expanded,
  onToggleExpand,
  onToggleActive,
  onDelete,
  isPending,
}: {
  node: AdminCategoryNode;
  expanded: Set<number>;
  onToggleExpand: (id: number) => void;
  onToggleActive: (id: number, isActive: boolean) => void;
  onDelete: (id: number, name: string) => void;
  isPending: boolean;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id);

  return (
    <>
      <tr className="hover:bg-cream-50/50 transition-colors">
        <td className="px-4 py-3">
          <div
            className="flex items-center gap-2"
            style={{ paddingRight: `${node.depth * 24}px` }}
          >
            {/* دکمه expand */}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => onToggleExpand(node.id)}
                className="w-5 h-5 rounded-md hover:bg-coffee-100 flex items-center justify-center text-coffee-500 transition-colors shrink-0"
                aria-label={isExpanded ? 'بستن' : 'باز کردن'}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${
                    isExpanded ? '' : '-rotate-90'
                  }`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            ) : (
              <span className="w-5 h-5 shrink-0" />
            )}

            {/* تصویر */}
            <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-cream-100 shrink-0 ring-1 ring-coffee-100">
              {node.image_url ? (
                <Image
                  src={node.image_url}
                  alt={node.name}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-coffee-300 text-[10px]">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="font-medium text-coffee-900 line-clamp-1">
                {node.name}
              </div>
              {hasChildren && (
                <div className="text-[10px] text-coffee-400 fa-num">
                  {node.children.length.toLocaleString('fa-IR')} زیردسته
                </div>
              )}
            </div>
          </div>
        </td>

        <td className="px-4 py-3">
          <span className="text-xs text-coffee-500 fa-num" dir="ltr">
            {node.slug}
          </span>
        </td>

        <td className="px-4 py-3">
          {node.products_count > 0 ? (
            <Link
              href={`/admin/products?category=${node.id}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gold-50 text-gold-700 text-[11px] font-bold fa-num hover:bg-gold-100 transition-colors"
            >
              {node.products_count.toLocaleString('fa-IR')} محصول
            </Link>
          ) : (
            <span className="text-[11px] text-coffee-400">—</span>
          )}
        </td>

        <td className="px-4 py-3">
          <span className="text-xs text-coffee-700 fa-num">
            {node.sort_order.toLocaleString('fa-IR')}
          </span>
        </td>

        <td className="px-4 py-3">
          <button
            type="button"
            onClick={() => onToggleActive(node.id, node.is_active === 1)}
            disabled={isPending}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50 ${
              node.is_active === 1
                ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                : 'bg-cream-100 text-coffee-500 hover:bg-cream-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                node.is_active === 1 ? 'bg-brand-500' : 'bg-coffee-400'
              }`}
            />
            {node.is_active === 1 ? 'فعال' : 'غیرفعال'}
          </button>
        </td>

        <td className="px-4 py-3">
          <div className="flex items-center gap-1 justify-end">
            <Link
              href={`/admin/categories/${node.id}/edit`}
              className="w-8 h-8 rounded-lg hover:bg-gold-50 text-coffee-500 hover:text-gold-700 flex items-center justify-center transition-colors"
              aria-label="ویرایش"
            >
              <EditIcon className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => onDelete(node.id, node.name)}
              className="w-8 h-8 rounded-lg hover:bg-red-50 text-coffee-500 hover:text-red-600 flex items-center justify-center transition-colors"
              aria-label="حذف"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>

      {/* فرزندان */}
      {isExpanded &&
        hasChildren &&
        node.children.map((child) => (
          <CategoryRowRecursive
            key={child.id}
            node={child}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            onToggleActive={onToggleActive}
            onDelete={onDelete}
            isPending={isPending}
          />
        ))}
    </>
  );
}

// ==========================================
// شمارش کل
// ==========================================

function countAll(nodes: AdminCategoryNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count += 1 + countAll(node.children);
  }
  return count;
}