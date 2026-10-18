// components/admin/branches/BranchesList.tsx
// لیست شعبات با آمار

'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  EditIcon,
  TrashIcon,
  PlusIcon,
  StoreIcon,
} from '@/components/admin/icons';
import {
  deleteBranchAction,
  toggleBranchActiveAction,
} from '@/app/admin/branches/actions';
import type {
  AdminBranchItem,
  BranchesSummary,
} from '@/lib/queries/branches-admin';

interface Props {
  branches: AdminBranchItem[];
  summary: BranchesSummary;
}

export default function BranchesList({ branches, summary }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleToggleActive(id: number, isActive: boolean) {
    startTransition(async () => {
      const result = await toggleBranchActiveAction(id, !isActive);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const result = await deleteBranchAction(id);
      if (result.ok) {
        setConfirmDelete(null);
        router.refresh();
      } else {
        setError(result.error);
        setConfirmDelete(null);
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* کارت‌های آماری */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="کل شعبات"
          value={summary.totalBranches}
          color="from-gold-400 to-gold-600"
          icon={<StoreIcon className="w-5 h-5" />}
        />
        <StatCard
          title="شعبات فعال"
          value={summary.activeBranches}
          color="from-brand-400 to-brand-600"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        <StatCard
          title="اقلام کم‌موجود"
          value={summary.lowStockCount}
          color="from-gold-500 to-gold-700"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
          }
        />
        <StatCard
          title="ناموجود"
          value={summary.outOfStockCount}
          color="from-red-400 to-red-600"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          }
        />
      </div>

      {/* هدر */}
      <div className="rounded-2xl border border-coffee-200 bg-white p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm font-bold text-coffee-900">
            شعبات فروشگاه
          </div>
          <div className="text-xs text-coffee-500 mt-0.5 fa-num">
            {branches.length.toLocaleString('fa-IR')} شعبه
          </div>
        </div>
        <Link
          href="/admin/branches/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl btn-gold text-xs font-bold"
        >
          <PlusIcon className="w-4 h-4" />
          افزودن شعبه
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

      {/* لیست */}
      {branches.length === 0 ? (
        <div className="rounded-2xl border border-coffee-200 bg-white py-16 text-center">
          <p className="text-sm text-coffee-500">شعبه‌ای ثبت نشده است</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {branches.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              onToggleActive={handleToggleActive}
              onDelete={(id, name) => setConfirmDelete({ id, name })}
              isPending={isPending}
            />
          ))}
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
              حذف شعبه
            </h3>
            <p className="text-sm text-coffee-600 text-center leading-6 mb-5">
              آیا از حذف «{confirmDelete.name}» مطمئن هستید؟
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
// کارت آماری
// ==========================================

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-coffee-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-md`}
        >
          {icon}
        </div>
      </div>
      <div className="text-xs text-coffee-500 mb-1">{title}</div>
      <div className="text-2xl font-bold text-coffee-900 fa-num leading-none">
        {value.toLocaleString('fa-IR')}
      </div>
    </div>
  );
}

// ==========================================
// کارت شعبه
// ==========================================

function BranchCard({
  branch,
  onToggleActive,
  onDelete,
  isPending,
}: {
  branch: AdminBranchItem;
  onToggleActive: (id: number, isActive: boolean) => void;
  onDelete: (id: number, name: string) => void;
  isPending: boolean;
}) {
  return (
    <div className="rounded-2xl border border-coffee-200 bg-white overflow-hidden hover:border-gold-400 transition-colors">
      {/* هدر */}
      <div className="p-4 border-b border-coffee-100">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-coffee-900 flex items-center justify-center shrink-0 shadow-md">
              <StoreIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-coffee-900 truncate">
                {branch.name}
              </div>
              <div
                className="text-[11px] text-coffee-500 truncate fa-num"
                dir="ltr"
              >
                {branch.slug}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleActive(branch.id, branch.is_active === 1)}
            disabled={isPending}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors shrink-0 disabled:opacity-50 ${branch.is_active === 1
                ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                : 'bg-cream-100 text-coffee-500 hover:bg-cream-200'
              }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${branch.is_active === 1 ? 'bg-brand-500' : 'bg-coffee-400'
                }`}
            />
            {branch.is_active === 1 ? 'فعال' : 'غیرفعال'}
          </button>
        </div>

        {branch.address && (
          <div className="text-xs text-coffee-600 leading-5 line-clamp-2 mt-2">
            {branch.address}
          </div>
        )}

        {branch.phone && (
          <div
            className="text-[11px] text-coffee-500 mt-1 fa-num"
            dir="ltr"
          >
            {branch.phone}
          </div>
        )}
      </div>

      {/* آمار - بر اساس تعداد اقلام، نه جمع عددی */}
      <div className="grid grid-cols-3 gap-2 p-4">
        <MiniStat
          label="با موجودی"
          value={branch.products_with_stock}
          color="text-brand-700"
        />
        <MiniStat
          label="کم‌موجود"
          value={branch.low_stock_count}
          color={branch.low_stock_count > 0 ? 'text-gold-700' : 'text-coffee-400'}
        />
        <MiniStat
          label="ناموجود"
          value={branch.out_of_stock_count}
          color={branch.out_of_stock_count > 0 ? 'text-red-700' : 'text-coffee-400'}
        />
      </div>

      {/* اکشن‌ها */}
      <div className="p-3 bg-cream-50 border-t border-coffee-100 flex items-center gap-2">
        <Link
          href={`/admin/branches/${branch.id}/inventory`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-coffee-200 hover:border-gold-400 text-xs font-medium text-coffee-700 transition-colors"
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
            <path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
          </svg>
          موجودی
        </Link>

        <Link
          href={`/admin/branches/${branch.id}/edit`}
          className="w-9 h-9 rounded-lg bg-white border border-coffee-200 hover:border-gold-400 flex items-center justify-center text-coffee-500 hover:text-gold-700 transition-colors"
          aria-label="ویرایش"
        >
          <EditIcon className="w-4 h-4" />
        </Link>

        <button
          type="button"
          onClick={() => onDelete(branch.id, branch.name)}
          className="w-9 h-9 rounded-lg bg-white border border-coffee-200 hover:border-red-300 hover:bg-red-50 flex items-center justify-center text-coffee-500 hover:text-red-600 transition-colors"
          aria-label="حذف"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className={`text-base font-bold fa-num ${color}`}>
        {value.toLocaleString('fa-IR')}
      </div>
      <div className="text-[10px] text-coffee-500 mt-0.5">{label}</div>
    </div>
  );
}