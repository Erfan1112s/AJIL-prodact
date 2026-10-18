// app/admin/branches/page.tsx
// لیست شعبات

import type { Metadata } from 'next';
import {
  getAdminBranches,
  getBranchesSummary,
} from '@/lib/queries/branches-admin';
import BranchesList from '@/components/admin/branches/BranchesList';

export const metadata: Metadata = {
  title: 'شعبات و موجودی',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminBranchesPage() {
  const [branches, summary] = await Promise.all([
    getAdminBranches(),
    getBranchesSummary(),
  ]);

  return <BranchesList branches={branches} summary={summary} />;
}