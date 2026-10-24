// app/admin/branches/[id]/edit/page.tsx
// ویرایش شعبه

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAdminBranchById } from '@/lib/queries/branches-admin';
import BranchForm from '@/components/admin/branches/BranchForm';

export const metadata: Metadata = {
  title: 'ویرایش شعبه',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditBranchPage({ params }: Props) {
  const { id } = await params;
  const branchId = Number(id);

  if (!Number.isInteger(branchId) || branchId <= 0) {
    notFound();
  }

  const branch = await getAdminBranchById(branchId);
  if (!branch) notFound();

  return (
    <BranchForm
      initial={{
        id: branch.id,
        name: branch.name,
        slug: branch.slug,
        address: branch.address ?? '',
        phone: branch.phone ?? '',
        lat: branch.lat ? Number(branch.lat) : null,
        lng: branch.lng ? Number(branch.lng) : null,
        is_active: branch.is_active === 1,
      }}
    />
  );
}